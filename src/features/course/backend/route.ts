import { Hono } from 'hono';
import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppEnv, getUser, getLogger } from '@/backend/hono/context';
import { respond, failure, success } from '@/backend/http/response';
import { courseErrorCodes } from './error';
import {
  CreateCourseRequestSchema,
  UpdateCourseRequestSchema,
  UpdateCourseStatusRequestSchema,
} from './schema';
import {
  getAvailableCoursesService,
  getInstructorCoursesService,
  createCourseService,
  getCourseByIdService,
  updateCourseService,
  updateCourseStatusService,
  deleteCourseService,
  getCategoriesAndDifficultiesService,
} from './service';

/**
 * ✅ Helper 함수: 사용자 역할 조회
 * user_metadata 또는 users 테이블에서 역할을 확인
 */
const getUserRole = async (
  user: User | undefined,
  supabase: SupabaseClient,
  logger: any
): Promise<string | null> => {
  if (!user) return null;

  // 1. user_metadata 또는 app_metadata에서 역할 확인
  let userRole = user.user_metadata?.role || user.app_metadata?.role;

  // 2. 없으면 users 테이블에서 조회
  if (!userRole) {
    logger.info('📖 users 테이블에서 역할 조회 중...', { userId: user.id });
    const { data: userRecord, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error) {
      logger.error('❌ 사용자 역할 조회 실패', { error: error.message });
      return null;
    }

    userRole = userRecord?.role;
  }

  return userRole as string | null;
};

export const registerCourseRoutes = (app: Hono<AppEnv>) => {
  // ✅ GET /api/courses - 학습자가 수강신청할 수 있는 활성 코스 목록 조회
  app.get('/api/courses', async (c) => {
    try {
      const supabase = c.get('supabase');
      const result = await getAvailableCoursesService(supabase);
      return respond(c, result);
    } catch (error) {
      return respond(
        c,
        failure(500, courseErrorCodes.COURSE_CREATION_ERROR, String(error))
      );
    }
  });

  // GET /api/courses/my - 강사의 코스 목록 조회
  app.get('/api/courses/my', async (c) => {
    try {
      const logger = c.get('logger');
      const user = getUser(c);
      const supabase = c.get('supabase');

      logger.info('📚 GET /api/courses/my 요청', {
        userId: user?.id,
        hasAuth: !!user,
      });

      if (!user) {
        logger.warn('❌ 사용자 인증 안 됨');
        return respond(
          c,
          failure(401, courseErrorCodes.NOT_INSTRUCTOR, 'User not authenticated')
        );
      }

      // ✅ Helper 함수로 사용자 역할 조회
      const userRole = await getUserRole(user, supabase, logger);

      if (userRole !== 'instructor') {
        logger.warn('❌ 강사가 아님', { userRole, userId: user.id });
        return respond(
          c,
          failure(403, courseErrorCodes.NOT_INSTRUCTOR, 'Only instructors can manage courses')
        );
      }

      logger.info('✅ 강사 확인됨, 코스 조회 중...', { userId: user.id });
      const result = await getInstructorCoursesService(supabase, user.id);
      logger.info('✅ 강사 코스 조회 완료', { count: result.ok ? (result.data as any).courses.length : 0 });
      return respond(c, result);
    } catch (error) {
      const logger = c.get('logger');
      logger.error('❌ 강사 코스 조회 에러', { error: String(error) });
      return respond(
        c,
        failure(500, courseErrorCodes.COURSE_CREATION_ERROR, String(error))
      );
    }
  });

  // POST /api/courses - 새 코스 생성
  app.post('/api/courses', async (c) => {
    try {
      const user = getUser(c);
      const supabase = c.get('supabase');
      const logger = c.get('logger');

      if (!user) {
        return respond(
          c,
          failure(401, courseErrorCodes.NOT_INSTRUCTOR, 'User not authenticated')
        );
      }

      // ✅ Helper 함수로 사용자 역할 조회
      const userRole = await getUserRole(user, supabase, logger);

      if (userRole !== 'instructor') {
        return respond(
          c,
          failure(403, courseErrorCodes.NOT_INSTRUCTOR, 'Only instructors can create courses')
        );
      }

      const body = await c.req.json();
      const validation = CreateCourseRequestSchema.safeParse(body);

      if (!validation.success) {
        return respond(
          c,
          failure(400, courseErrorCodes.VALIDATION_ERROR, 'Invalid request data', {
            errors: validation.error.flatten(),
          })
        );
      }

      const result = await createCourseService(supabase, user.id, validation.data);
      return respond(c, result);
    } catch (error) {
      return respond(
        c,
        failure(500, courseErrorCodes.COURSE_CREATION_ERROR, String(error))
      );
    }
  });

  // GET /api/courses/:id - 코스 상세 조회
  app.get('/api/courses/:id', async (c) => {
    try {
      const courseId = c.req.param('id');
      const user = getUser(c);
      const logger = c.get('logger');

      const supabase = c.get('supabase');
      
      logger.info('📚 GET /api/courses/:id 요청', { courseId, userId: user?.id });
      
      const result = await getCourseByIdService(
        supabase,
        courseId,
        user?.id
      );
      
      if (!result.ok) {
        logger.warn('❌ 코스 조회 실패', { courseId, error: (result as any).error });
        return respond(c, result);
      }
      
      logger.info('✅ 코스 조회 완료', { courseId });
      
      // ✅ API 응답 형식 통일: { data: course }
      return respond(c, success({ data: result.data }));
    } catch (error) {
      const logger = c.get('logger');
      logger.error('❌ 코스 조회 에러', { error: String(error) });
      return respond(
        c,
        failure(500, courseErrorCodes.COURSE_UPDATE_ERROR, String(error))
      );
    }
  });

  // PUT /api/courses/:id - 코스 정보 수정
  app.put('/api/courses/:id', async (c) => {
    try {
      const courseId = c.req.param('id');
      const user = getUser(c);
      const supabase = c.get('supabase');
      const logger = c.get('logger');

      if (!user) {
        return respond(
          c,
          failure(401, courseErrorCodes.NOT_INSTRUCTOR, 'User not authenticated')
        );
      }

      // ✅ Helper 함수로 사용자 역할 조회
      const userRole = await getUserRole(user, supabase, logger);

      if (userRole !== 'instructor') {
        return respond(
          c,
          failure(403, courseErrorCodes.NOT_INSTRUCTOR, 'Only instructors can edit courses')
        );
      }

      const body = await c.req.json();
      const validation = UpdateCourseRequestSchema.safeParse(body);

      if (!validation.success) {
        return respond(
          c,
          failure(400, courseErrorCodes.VALIDATION_ERROR, 'Invalid request data', {
            errors: validation.error.flatten(),
          })
        );
      }

      // ✅ supabase는 이미 라인 190에서 정의됨
      const result = await updateCourseService(
        supabase,
        courseId,
        user.id,
        validation.data
      );
      return respond(c, result);
    } catch (error) {
      return respond(
        c,
        failure(500, courseErrorCodes.COURSE_UPDATE_ERROR, String(error))
      );
    }
  });

  // PATCH /api/courses/:id/status - 코스 상태 변경
  app.patch('/api/courses/:id/status', async (c) => {
    try {
      const courseId = c.req.param('id');
      const user = getUser(c);
      const supabase = c.get('supabase');
      const logger = c.get('logger');

      if (!user) {
        return respond(
          c,
          failure(401, courseErrorCodes.NOT_INSTRUCTOR, 'User not authenticated')
        );
      }

      // ✅ Helper 함수로 사용자 역할 조회
      const userRole = await getUserRole(user, supabase, logger);

      if (userRole !== 'instructor') {
        return respond(
          c,
          failure(403, courseErrorCodes.NOT_INSTRUCTOR, 'Only instructors can change course status')
        );
      }

      const body = await c.req.json();
      const validation = UpdateCourseStatusRequestSchema.safeParse(body);

      if (!validation.success) {
        return respond(
          c,
          failure(400, courseErrorCodes.VALIDATION_ERROR, 'Invalid request data', {
            errors: validation.error.flatten(),
          })
        );
      }

      // ✅ supabase는 이미 라인 243에서 정의됨
      const result = await updateCourseStatusService(
        supabase,
        courseId,
        user.id,
        validation.data
      );
      return respond(c, result);
    } catch (error) {
      return respond(
        c,
        failure(
          500,
          courseErrorCodes.COURSE_STATUS_CHANGE_ERROR,
          String(error)
        )
      );
    }
  });

  // DELETE /api/courses/:id - 코스 소프트 삭제
  app.delete('/api/courses/:id', async (c) => {
    try {
      const courseId = c.req.param('id');
      const user = getUser(c);
      const supabase = c.get('supabase');
      const logger = c.get('logger');

      if (!user) {
        return respond(
          c,
          failure(401, courseErrorCodes.NOT_INSTRUCTOR, 'User not authenticated')
        );
      }

      // ✅ Helper 함수로 사용자 역할 조회
      const userRole = await getUserRole(user, supabase, logger);

      if (userRole !== 'instructor') {
        return respond(
          c,
          failure(403, courseErrorCodes.NOT_INSTRUCTOR, 'Only instructors can delete courses')
        );
      }

      const result = await deleteCourseService(supabase, courseId, user.id);
      return respond(c, result);
    } catch (error) {
      return respond(
        c,
        failure(500, courseErrorCodes.COURSE_DELETE_ERROR, String(error))
      );
    }
  });

  // GET /api/courses/metadata/options - 카테고리 및 난이도 조회
  app.get('/api/courses/metadata/options', async (c) => {
    try {
      const supabase = c.get('supabase');
      const result = await getCategoriesAndDifficultiesService(supabase);
      return respond(c, result);
    } catch (error) {
      return respond(
        c,
        failure(500, courseErrorCodes.COURSE_UPDATE_ERROR, String(error))
      );
    }
  });
};
