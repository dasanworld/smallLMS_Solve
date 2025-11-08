import { createMiddleware } from 'hono/factory';
import { getSupabase } from '@/backend/hono/context';
import type { AppEnv } from '@/backend/hono/context';
import { 
  failure,
  respond 
} from '@/backend/http/response';
import { 
  AUTHENTICATION_ERROR 
} from '@/features/auth/backend/error';

/**
 * Authentication middleware for Hono routes
 * Verifies user session using Supabase auth
 */
export const authenticate = createMiddleware<AppEnv>(async (c, next) => {
  const supabase = getSupabase(c);

  // Get the authorization token from the header
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return respond(
      c,
      failure(
        401,
        AUTHENTICATION_ERROR.UNAUTHORIZED,
        'Authorization header missing or invalid.',
      ),
    );
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Use the token to get user info from Supabase
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    console.error('Authentication failed:', error?.message);
    return respond(
      c,
      failure(
        401,
        AUTHENTICATION_ERROR.UNAUTHORIZED,
        'Invalid or expired authentication token.',
      ),
    );
  }

  // Attach user information to context
  c.set('user', user);

  await next();
});

/**
 * Type guard to check if user is authenticated
 */
export const isAuthenticated = (c: Parameters<Parameters<typeof createMiddleware>[0]>[0]) => {
  return c.get('user') !== undefined;
};

/**
 * Get authenticated user from context
 */
export const getAuthenticatedUser = (c: Parameters<Parameters<typeof createMiddleware>[0]>[0]) => {
  return c.get('user');
};