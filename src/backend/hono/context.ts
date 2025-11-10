import type { Context } from 'hono';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createServiceClient } from '@/backend/supabase/client';

export type AppLogger = Pick<Console, 'info' | 'error' | 'warn' | 'debug'>;

export type AppConfig = {
  supabase: {
    url: string;
    serviceRoleKey: string;
  };
};

export type UserWithRole = User & {
  role?: string;
};

export type AppVariables = {
  supabase: SupabaseClient;
  logger: AppLogger;
  config: AppConfig;
  user?: UserWithRole;
};

export type AppEnv = {
  Variables: AppVariables;
};

export type AppContext = Context<AppEnv>;

export const contextKeys = {
  supabase: 'supabase',
  logger: 'logger',
  config: 'config',
  user: 'user',
} as const satisfies Record<keyof AppVariables, keyof AppVariables>;

export const getSupabase = (c: AppContext) =>
  c.get(contextKeys.supabase) as SupabaseClient;

export const getLogger = (c: AppContext) =>
  c.get(contextKeys.logger) as AppLogger;

export const getConfig = (c: AppContext) =>
  c.get(contextKeys.config) as AppConfig;

export const getUser = (c: AppContext) =>
  c.get(contextKeys.user) as UserWithRole | undefined;

/**
 * Extract and verify the authenticated user from the request
 * Tries to get the session token from Authorization header
 * Also fetches user role from the users table
 */
export const getAuthUser = async (c: AppContext): Promise<UserWithRole | null> => {
  const config = getConfig(c);
  const supabase = createServiceClient(config.supabase);

  // Get token from Authorization header
  const authHeader = c.req.header('Authorization');
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (!token) {
    return null;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return null;
    }

    // Fetch user role from users table
    const { data: userRecord } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    // Return user with role attached
    return {
      ...user,
      role: userRecord?.role || 'learner', // Default to learner if role not found
    };
  } catch {
    return null;
  }
};
