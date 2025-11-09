import { Hono } from 'hono';
import { AppEnv, getUser, getLogger } from '@/backend/hono/context';
import { respond, failure, success } from '@/backend/http/response';
import { enrollmentErrorCodes } from './error';
import {
  createEnrollmentRequestSchema,
} from './schema';
import {
  createEnrollmentService,
  cancelEnrollmentService,
  getUserEnrollmentsService,
} from './service';

export const registerEnrollmentRoutes = (app: Hono<AppEnv>) => {
  // POST /api/enrollments - 수강신청
  app.post('/api/enrollments', async (c) => {
    try {
      const user = getUser(c);
      const logger = getLogger(c);

      // 인증 확인
      if (!user) {
        logger.warn('❌ 미인증 사용자 수강신청 시도');
        return respond(
          c,
          failure(
            401,
            enrollmentErrorCodes.NOT_AUTHENTICATED,
            '로그인이 필요합니다.'
          )
        );
      }

      logger.info('📚 POST /api/enrollments 요청', {
        userId: user.id,
      });

      // 요청 데이터 검증
      const body = await c.req.json();
      const validation = createEnrollmentRequestSchema.safeParse(body);

      if (!validation.success) {
        logger.warn('❌ 수강신청 요청 검증 실패', {
          error: validation.error.flatten(),
        });
        return respond(
          c,
          failure(
            400,
            enrollmentErrorCodes.VALIDATION_ERROR,
            '입력 데이터가 유효하지 않습니다.',
            validation.error.flatten()
          )
        );
      }

      const supabase = c.get('supabase');
      const result = await createEnrollmentService(
        supabase,
        user.id,
        validation.data.courseId
      );

      if (!result.ok) {
        logger.warn('❌ 수강신청 실패', {
          userId: user.id,
          courseId: validation.data.courseId,
          error: (result as any).error,
        });
        return respond(c, result);
      }

      logger.info('✅ 수강신청 성공', {
        userId: user.id,
        courseId: validation.data.courseId,
        enrollmentId: result.value.id,
      });

      return respond(c, result);
    } catch (error) {
      const logger = getLogger(c);
      logger.error('❌ 수강신청 에러', { error: String(error) });
      return respond(
        c,
        failure(
          500,
          enrollmentErrorCodes.ENROLLMENT_CREATION_ERROR,
          String(error)
        )
      );
    }
  });

  // DELETE /api/enrollments/:courseId - 수강취소
  app.delete('/api/enrollments/:courseId', async (c) => {
    try {
      const user = getUser(c);
      const logger = getLogger(c);
      const courseId = c.req.param('courseId');

      // 인증 확인
      if (!user) {
        logger.warn('❌ 미인증 사용자 수강취소 시도');
        return respond(
          c,
          failure(
            401,
            enrollmentErrorCodes.NOT_AUTHENTICATED,
            '로그인이 필요합니다.'
          )
        );
      }

      logger.info('📚 DELETE /api/enrollments/:courseId 요청', {
        userId: user.id,
        courseId,
      });

      const supabase = c.get('supabase');
      const result = await cancelEnrollmentService(
        supabase,
        user.id,
        courseId
      );

      if (!result.ok) {
        logger.warn('❌ 수강취소 실패', {
          userId: user.id,
          courseId,
          error: (result as any).error,
        });
        return respond(c, result);
      }

      logger.info('✅ 수강취소 성공', {
        userId: user.id,
        courseId,
      });

      return respond(c, result);
    } catch (error) {
      const logger = getLogger(c);
      logger.error('❌ 수강취소 에러', { error: String(error) });
      return respond(
        c,
        failure(
          500,
          enrollmentErrorCodes.ENROLLMENT_UPDATE_ERROR,
          String(error)
        )
      );
    }
  });

  // GET /api/enrollments/me - 내 수강중인 코스 목록
  app.get('/api/enrollments/me', async (c) => {
    try {
      const user = getUser(c);
      const logger = getLogger(c);

      // 인증 확인
      if (!user) {
        logger.warn('❌ 미인증 사용자 수강정보 조회 시도');
        return respond(
          c,
          failure(
            401,
            enrollmentErrorCodes.NOT_AUTHENTICATED,
            '로그인이 필요합니다.'
          )
        );
      }

      logger.info('📚 GET /api/enrollments/me 요청', {
        userId: user.id,
      });

      const supabase = c.get('supabase');
      const result = await getUserEnrollmentsService(supabase, user.id);

      if (!result.ok) {
        logger.warn('❌ 수강정보 조회 실패', {
          userId: user.id,
          error: (result as any).error,
        });
        return respond(c, result);
      }

      logger.info('✅ 수강정보 조회 성공', {
        userId: user.id,
        count: result.value.enrollments.length,
      });

      return respond(c, result);
    } catch (error) {
      const logger = getLogger(c);
      logger.error('❌ 수강정보 조회 에러', { error: String(error) });
      return respond(
        c,
        failure(
          500,
          enrollmentErrorCodes.ENROLLMENT_FETCH_ERROR,
          String(error)
        )
      );
    }
  });
};

