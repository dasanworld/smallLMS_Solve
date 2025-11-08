import type { Hono } from 'hono';
import {
  failure,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  getAuthUser,
  type AppEnv,
} from '@/backend/hono/context';
import { getLearnerDashboardService } from './service';
import {
  dashboardErrorCodes,
  type DashboardServiceError,
} from './error';

export const registerDashboardRoutes = (app: Hono<AppEnv>) => {
  // GET /api/dashboard/learner - Get learner dashboard data
  app.get('/api/dashboard/learner', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const user = await getAuthUser(c);

    if (!user) {
      return respond(
        c,
        failure(
          401,
          'UNAUTHORIZED',
          'User must be authenticated to access dashboard.',
        ),
      );
    }

    const result = await getLearnerDashboardService(supabase, user.id);

    if (!result.ok) {
      const errorResult = result as ErrorResult<DashboardServiceError, unknown>;

      if (errorResult.error.code === dashboardErrorCodes.fetchError) {
        logger.error('Failed to fetch dashboard data', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });
};