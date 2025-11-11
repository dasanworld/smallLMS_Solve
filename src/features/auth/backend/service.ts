import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import { getLogger } from '@/backend/hono/context';
import { 
  SignupRequest, 
  signupRequestSchema 
} from '@/features/auth/backend/schema';
import { 
  signupErrorCodes, 
  type SignupServiceError 
} from '@/features/auth/backend/error';

const USERS_TABLE = 'users';
const USER_TERMS_AGREEMENT_TABLE = 'user_terms_agreement';

/**
 * Normalize email to valid format for Supabase
 * Supabase requires email format with @ symbol
 * - If email already has @, use as is
 * - If email doesn't have @, append @example.com
 */
const normalizeEmail = (email: string): string => {
  const trimmed = email.trim();
  
  // If already has @ symbol, return as is (likely already valid)
  if (trimmed.includes('@')) {
    return trimmed;
  }
  
  // If no @, append domain
  return `${trimmed}@example.com`;
};

export type SignupServiceDependencies = {
  supabase: SupabaseClient;
  logger: ReturnType<typeof getLogger>;
};

export const createUserProfile = async (
  deps: SignupServiceDependencies,
  userId: string,
  email: string | null,
  role: string,
  name: string,
  phone: string,
  originalEmail?: string
): Promise<HandlerResult<void, typeof signupErrorCodes[keyof typeof signupErrorCodes], unknown>> => {
  const { supabase, logger } = deps;

  const { error } = await supabase
    .from(USERS_TABLE)
    .insert([
      {
        id: userId,
        email,
        role,
        name,
        phone,
        // Store original email if different from normalized email
        original_email: originalEmail || null,
      },
    ]);

  if (error) {
    logger.error('Failed to create user profile', error.message);
    return failure(500, signupErrorCodes.PROFILE_CREATION_ERROR, error.message);
  }

  return success(undefined);
};

export const recordTermsAgreement = async (
  deps: SignupServiceDependencies,
  userId: string,
  termsVersion: string,
  ipAddress?: string
): Promise<HandlerResult<void, typeof signupErrorCodes[keyof typeof signupErrorCodes], unknown>> => {
  const { supabase, logger } = deps;

  const { error } = await supabase
    .from(USER_TERMS_AGREEMENT_TABLE)
    .insert([
      {
        user_id: userId,
        terms_version: termsVersion,
        ip_address: ipAddress || null,
      },
    ]);

  if (error) {
    logger.error('Failed to record terms agreement', error.message);
    return failure(500, signupErrorCodes.TERMS_AGREEMENT_ERROR, error.message);
  }

  return success(undefined);
};

export const signupUserService = async (
  deps: SignupServiceDependencies,
  signupData: SignupRequest
): Promise<HandlerResult<{ redirectTo: string }, typeof signupErrorCodes[keyof typeof signupErrorCodes], unknown>> => {
  const { supabase, logger } = deps;

  // 1. Validate input data
  const parsedData = signupRequestSchema.safeParse(signupData);
  if (!parsedData.success) {
    logger.info('Invalid signup data', parsedData.error.format());
    return failure(
      400,
      signupErrorCodes.SIGNUP_VALIDATION_ERROR,
      '입력 데이터가 유효하지 않습니다.',
      parsedData.error.format()
    );
  }

  const { email, password, role, name, phone, termsAgreed } = parsedData.data;

  // 2. Check if terms are agreed
  if (!termsAgreed) {
    logger.info('Terms not agreed during signup', { email });
    return failure(400, signupErrorCodes.TERMS_NOT_AGREED, '약관에 동의해야 합니다.');
  }

  // 3. Normalize email to valid format if needed
  // Supabase requires valid email format with @ symbol
  // Convert any non-email format to valid format: test -> test@example.com
  const normalizedEmail = normalizeEmail(email);
  logger.info('Email normalization', { originalEmail: email, normalizedEmail });

  // 4. Create Supabase Auth user using admin API to bypass email validation
  // Using admin.createUser() instead of signUp() to allow non-standard email formats
  let authResult;
  
  try {
    // Try using admin API first (allows non-standard emails)
    authResult = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role,
        name,
        phone,
        // Store original email if it was normalized
        original_email: email !== normalizedEmail ? email : undefined,
      },
    });
    
    logger.info('User created with admin API', { email: normalizedEmail });
  } catch (adminError) {
    logger.warn('Admin API createUser failed, trying signUp', { error: String(adminError) });
    
    // Fallback to standard signUp
    authResult = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          role,
          name,
          phone,
          original_email: email !== normalizedEmail ? email : undefined,
        },
      },
    });
  }

  if (authResult.error) {
    logger.error('Failed to create Supabase Auth user', {
      error: authResult.error.message,
      normalizedEmail,
      originalEmail: email,
    });

    // Determine if it's a duplicate email error
    if (authResult.error.message.includes('User already registered')) {
      return failure(409, signupErrorCodes.USER_ALREADY_EXISTS, '이미 등록된 사용자입니다.');
    }

    return failure(500, signupErrorCodes.AUTH_CREATION_ERROR, authResult.error.message);
  }

  const userId = authResult.data.user?.id;
  if (!userId) {
    logger.error('No user ID returned from Supabase Auth', { email });
    return failure(500, signupErrorCodes.MISSING_USER_ID, '사용자 ID를 생성하지 못했습니다.');
  }

  // 5. Create user profile (with original email if normalized)
  const originalEmail = email !== normalizedEmail ? email : undefined;
  const profileResult = await createUserProfile(deps, userId, normalizedEmail, role, name, phone, originalEmail);
  if (!profileResult.ok) {
    // If profile creation fails, try to clean up the auth user
    await supabase.auth.admin.deleteUser(userId);
    return profileResult as HandlerResult<{ redirectTo: string }, typeof signupErrorCodes[keyof typeof signupErrorCodes], unknown>;
  }

  // 6. Record terms agreement
  const termsResult = await recordTermsAgreement(deps, userId, 'v1.0');
  if (!termsResult.ok) {
    // If terms agreement fails, try to clean up the auth user and profile
    await supabase.auth.admin.deleteUser(userId);
    await supabase.from(USERS_TABLE).delete().eq('id', userId);
    return termsResult as HandlerResult<{ redirectTo: string }, typeof signupErrorCodes[keyof typeof signupErrorCodes], unknown>;
  }

  // 6. Determine redirect path based on role
  // 리다이렉트 정책 (docs/REDIRECT_POLICY.md 참고):
  // 회원가입 완료 후:
  // - learner → /dashboard (학습자 대시보드)
  // - instructor → /instructor-dashboard (강사 대시보드)
  const redirectTo = role === 'learner' ? '/dashboard' : '/instructor-dashboard';

  logger.info('User signup completed successfully', { userId, email, role });

  return success({ redirectTo });
};