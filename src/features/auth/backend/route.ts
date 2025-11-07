import type { Hono } from 'hono';
import { 
  failure,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
import { 
  SignupRequest,
  signupRequestSchema 
} from '@/features/auth/backend/schema';
import { 
  signupErrorCodes, 
  type SignupServiceError 
} from '@/features/auth/backend/error';
import { signupUserService } from './service';

export const registerAuthRoutes = (app: Hono<AppEnv>) => {
  app.post('/api/auth/signup', async (c) => {
    // Parse request body
    const requestBody = await c.req.json();
    const parsedBody = signupRequestSchema.safeParse(requestBody);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          signupErrorCodes.validationError,
          '입력 데이터가 유효하지 않습니다.',
          parsedBody.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);
    
    const deps = { supabase, logger };

    const result = await signupUserService(deps, parsedBody.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<SignupServiceError, unknown>;

      // Log specific errors
      if (errorResult.error.code === signupErrorCodes.authCreationError) {
        logger.error('Auth creation failed', errorResult.error.message);
      } else if (errorResult.error.code === signupErrorCodes.profileCreationError) {
        logger.error('Profile creation failed', errorResult.error.message);
      } else if (errorResult.error.code === signupErrorCodes.termsAgreementError) {
        logger.error('Terms agreement recording failed', errorResult.error.message);
      } else {
        logger.error('Signup process failed', errorResult.error.message);
      }

      return respond(c, result);
    }

    logger.info('User signup completed successfully', { 
      email: parsedBody.data.email,
      role: parsedBody.data.role
    });

    return respond(c, result);
  });
};