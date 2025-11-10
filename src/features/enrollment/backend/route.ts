import { Hono } from 'hono';
import { AppEnv, getUser } from '@/backend/hono/context';
import { respond, failure } from '@/backend/http/response';
import { enrollmentErrorCodes } from './error';
import { createEnrollmentRequestSchema } from './schema';
import {
  getUserEnrollmentsService,
  createEnrollmentService,
  deleteEnrollmentService,
} from './service';

export const registerEnrollmentRoutes = (app: Hono<AppEnv>) => {
  // GET /api/enrollments - 사용자의 수강신청 목록 조회
  app.get('/api/enrollments', async (c) => {
    try {
      const user = getUser(c);

      if (!user) {
        return respond(
          c,
          failure(401, enrollmentErrorCodes.NOT_AUTHENTICATED, 'User not authenticated')
        );
      }

      const supabase = c.get('supabase');
      const result = await getUserEnrollmentsService(supabase, user.id);
      return respond(c, result);
    } catch (error) {
      return respond(
        c,
        failure(500, enrollmentErrorCodes.ENROLLMENT_FETCH_ERROR, String(error))
      );
    }
  });

  // POST /api/enrollments - 코스 수강신청
  app.post('/api/enrollments', async (c) => {
    try {
      const user = getUser(c);

      if (!user) {
        return respond(
          c,
          failure(401, enrollmentErrorCodes.NOT_AUTHENTICATED, 'User not authenticated')
        );
      }

      const body = await c.req.json();
      const validation = createEnrollmentRequestSchema.safeParse(body);

      if (!validation.success) {
        return respond(
          c,
          failure(400, enrollmentErrorCodes.VALIDATION_ERROR, 'Invalid request data', {
            errors: validation.error.flatten(),
          })
        );
      }

      const supabase = c.get('supabase');
      const result = await createEnrollmentService(supabase, user.id, validation.data.courseId);
      return respond(c, result);
    } catch (error) {
      return respond(
        c,
        failure(500, enrollmentErrorCodes.ENROLLMENT_CREATION_ERROR, String(error))
      );
    }
  });

  // DELETE /api/enrollments/:enrollmentId - 수강신청 취소
  app.delete('/api/enrollments/:enrollmentId', async (c) => {
    try {
      const enrollmentId = c.req.param('enrollmentId');
      const user = getUser(c);

      if (!user) {
        return respond(
          c,
          failure(401, enrollmentErrorCodes.NOT_AUTHENTICATED, 'User not authenticated')
        );
      }

      const supabase = c.get('supabase');
      const result = await deleteEnrollmentService(supabase, enrollmentId, user.id);
      return respond(c, result);
    } catch (error) {
      return respond(
        c,
        failure(500, enrollmentErrorCodes.ENROLLMENT_DELETE_ERROR, String(error))
      );
    }
  });
};
