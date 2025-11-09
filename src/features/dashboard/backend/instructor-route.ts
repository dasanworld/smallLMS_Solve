import type { Hono } from 'hono';
import {
  failure,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  getUser,
  type AppEnv,
} from '@/backend/hono/context';
import { getInstructorDashboardService } from './instructor-service';
import { requireRole } from '@/backend/middleware/auth';
import {
  dashboardErrorCodes,
  type DashboardServiceError,
} from '@/features/dashboard/backend/error';

export const registerInstructorDashboardRoutes = (app: Hono<AppEnv>) => {
  // GET /api/dashboard/instructor - Get instructor dashboard data
  // requireRole 미들웨어가 인증과 역할 검증을 함께 처리
  app.get('/api/dashboard/instructor', requireRole('instructor'), async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    // requireRole 미들웨어에서 user를 context에 설정하므로 getUser로 가져옴
    const user = getUser(c);

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

    const result = await getInstructorDashboardService(supabase, user.id);

    if (!result.ok) {
      const errorResult = result as ErrorResult<DashboardServiceError, unknown>;

      if (errorResult.error.code === dashboardErrorCodes.fetchError) {
        logger.error('Failed to fetch instructor dashboard data', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });
};