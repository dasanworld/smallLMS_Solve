import type { Hono } from 'hono';
import {
  failure,
  success,
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
  signupErrorCodes
} from '@/features/auth/backend/error';
import { signupUserService } from './service';
import { getUserProfileService } from './profile-service';

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
          signupErrorCodes.SIGNUP_VALIDATION_ERROR,
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
      const errorResult = result as unknown as ErrorResult<typeof signupErrorCodes[keyof typeof signupErrorCodes], unknown>;

      // Log specific errors
      if (errorResult.error.code === signupErrorCodes.AUTH_CREATION_ERROR) {
        logger.error('Auth creation failed', errorResult.error.message);
      } else if (errorResult.error.code === signupErrorCodes.PROFILE_CREATION_ERROR) {
        logger.error('Profile creation failed', errorResult.error.message);
      } else if (errorResult.error.code === signupErrorCodes.TERMS_AGREEMENT_ERROR) {
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

  // GET /api/auth/profile - Get authenticated user's profile
  app.get('/api/auth/profile', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // Get the authorization token from the header
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return respond(
        c,
        failure(
          401,
          'UNAUTHORIZED',
          'Authorization header missing or invalid.',
        ),
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Use the token to get user info from Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.error('Failed to get user from auth token', error?.message);
      return respond(
        c,
        failure(
          401,
          'UNAUTHORIZED',
          'Invalid or expired authentication token.',
        ),
      );
    }

    const result = await getUserProfileService(supabase, user.id);

    if (!result.ok) {
      logger.error('Failed to fetch user profile', (result as any).error.message);
      return respond(c, result);
    }

    return respond(c, result);
  });

  // POST /api/auth/logout - Logout user (sign out from Supabase)
  app.post('/api/auth/logout', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    try {
      // Get the authorization token from the header
      const authHeader = c.req.header('Authorization');

      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Use the token to sign out the specific user session
        const { error } = await supabase.auth.signOut({
          scope: 'global'
        });

        if (error) {
          logger.warn('Supabase signOut returned warning', error.message);
        }
      }

      // Clear the auth cookie by setting it to expire
      c.header('Set-Cookie', 'sb-auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 UTC;');

      logger.info('User logged out successfully');
      return respond(c, success({ message: 'Logged out successfully' }));
    } catch (error) {
      logger.error('Logout exception', String(error));
      return respond(
        c,
        failure(
          500,
          'LOGOUT_ERROR',
          'An error occurred during logout',
        ),
      );
    }
  });
};