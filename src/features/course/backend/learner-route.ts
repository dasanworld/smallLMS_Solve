import { Hono } from 'hono';
import { AppEnv, getUser } from '@/backend/hono/context';
import { respond, failure } from '@/backend/http/response';
import { courseErrorCodes } from './error';
import {
  getAvailableCoursesService,
  getEnrolledCoursesService,
  enrollCourseService,
  unenrollCourseService,
} from './learner-service';

/**
 * 학습자용 코스 API 라우트
 * - /api/learner/courses/* 경로
 */
export const registerLearnerCourseRoutes = (app: Hono<AppEnv>) => {
  // GET /api/learner/courses/available - 이용 가능한 코스 목록 조회
  app.get('/api/learner/courses/available', async (c) => {
    try {
      const user = getUser(c);
      const page = parseInt(c.req.query('page') || '1');
      const pageSize = parseInt(c.req.query('pageSize') || '10');

      // 유효성 검증
      if (isNaN(page) || page < 1) {
        return respond(
          c,
          failure(400, courseErrorCodes.VALIDATION_ERROR, 'Invalid page number')
        );
      }

      if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
        return respond(
          c,
          failure(400, courseErrorCodes.VALIDATION_ERROR, 'Page size must be between 1 and 100')
        );
      }

      const supabase = c.get('supabase');
      const result = await getAvailableCoursesService(supabase, user?.id, page, pageSize);
      return respond(c, result);
    } catch (error) {
      return respond(
        c,
        failure(500, courseErrorCodes.COURSE_CREATION_ERROR, String(error))
      );
    }
  });

  // GET /api/learner/courses/enrolled - 수강신청한 코스 목록 조회
  app.get('/api/learner/courses/enrolled', async (c) => {
    try {
      const user = getUser(c);

      if (!user) {
        return respond(
          c,
          failure(401, courseErrorCodes.COURSE_CREATION_ERROR, 'User not authenticated')
        );
      }

      const supabase = c.get('supabase');
      const result = await getEnrolledCoursesService(supabase, user.id);
      return respond(c, result);
    } catch (error) {
      return respond(
        c,
        failure(500, courseErrorCodes.COURSE_CREATION_ERROR, String(error))
      );
    }
  });

  // POST /api/learner/courses/:courseId/enroll - 수강신청
  app.post('/api/learner/courses/:courseId/enroll', async (c) => {
    try {
      const user = getUser(c);
      const courseId = c.req.param('courseId');

      if (!user) {
        return respond(
          c,
          failure(401, courseErrorCodes.COURSE_CREATION_ERROR, 'User not authenticated')
        );
      }

      if (!courseId) {
        return respond(
          c,
          failure(400, courseErrorCodes.VALIDATION_ERROR, 'Course ID is required')
        );
      }

      const supabase = c.get('supabase');
      const result = await enrollCourseService(supabase, user.id, courseId);
      return respond(c, result);
    } catch (error) {
      return respond(
        c,
        failure(500, courseErrorCodes.COURSE_CREATION_ERROR, String(error))
      );
    }
  });

  // DELETE /api/learner/courses/:courseId/enroll - 수강신청 취소
  app.delete('/api/learner/courses/:courseId/enroll', async (c) => {
    try {
      const user = getUser(c);
      const courseId = c.req.param('courseId');

      if (!user) {
        return respond(
          c,
          failure(401, courseErrorCodes.COURSE_CREATION_ERROR, 'User not authenticated')
        );
      }

      if (!courseId) {
        return respond(
          c,
          failure(400, courseErrorCodes.VALIDATION_ERROR, 'Course ID is required')
        );
      }

      const supabase = c.get('supabase');
      const result = await unenrollCourseService(supabase, user.id, courseId);
      return respond(c, result);
    } catch (error) {
      return respond(
        c,
        failure(500, courseErrorCodes.COURSE_CREATION_ERROR, String(error))
      );
    }
  });
};
