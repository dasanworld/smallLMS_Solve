import { createMiddleware } from 'hono/factory';
import { getSupabase } from '@/backend/hono/context';
import type { AppEnv } from '@/backend/hono/context';
import {
  failure,
  respond
} from '@/backend/http/response';

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
        'UNAUTHORIZED',
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
        'UNAUTHORIZED',
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
export const isAuthenticated = (c: any) => {
  return c.get('user') !== undefined;
};

/**
 * Get authenticated user from context
 */
export const getAuthenticatedUser = (c: any) => {
  return c.get('user');
};

/**
 * Role-based authorization middleware
 * Verifies that the authenticated user has the required role(s)
 */
export const requireRole = (roles: string | string[]) => {
  return createMiddleware<AppEnv>(async (c, next) => {
    // First try to get user from context (if set by authenticate middleware)
    let user = getAuthenticatedUser(c);

    // If user not in context, fetch from Authorization header
    if (!user) {
      const authHeader = c.req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const supabase = getSupabase(c);
        const { data: { user: authUser } } = await supabase.auth.getUser(token);
        user = authUser || undefined;

        if (user) {
          c.set('user', user);
        }
      }
    }

    if (!user) {
      return respond(
        c,
        failure(
          401,
          'UNAUTHORIZED',
          'User must be authenticated to access this resource.',
        ),
      );
    }

    // Get user role from Supabase user metadata or a separate role table
    // This assumes roles are stored in user's app_metadata or user_metadata
    let userRole = user.app_metadata?.role || user.user_metadata?.role;

    // If role is not in user metadata, fetch from users table
    if (!userRole) {
      const supabase = getSupabase(c);
      const { data: userRecord, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error.message);
        return respond(
          c,
          failure(
            403,
            'INSUFFICIENT_PERMISSIONS',
            'Could not determine user role.',
          ),
        );
      }

      userRole = userRecord?.role;
    }

    // Normalize roles to array
    const requiredRoles = Array.isArray(roles) ? roles : [roles];

    // Check if user has any of the required roles
    if (!requiredRoles.includes(userRole)) {
      return respond(
        c,
        failure(
          403,
          'INSUFFICIENT_PERMISSIONS',
          `User does not have required role(s): ${requiredRoles.join(', ')}. Current role: ${userRole}`,
        ),
      );
    }

    await next();
  });
};
