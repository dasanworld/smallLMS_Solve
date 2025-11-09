/**
 * 과제 관리 API 라우트
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { getSupabase, getLogger } from '@/backend/hono/context';
import { respond } from '@/backend/http/response';
import type { AppEnv } from '@/backend/hono/context';
import {
  CreateAssignmentRequestSchema,
  UpdateAssignmentRequestSchema,
  UpdateAssignmentStatusRequestSchema,
  GradeSubmissionRequestSchema,
  SubmitAssignmentRequestSchema,
} from './schema';
import {
  createAssignmentService,
  updateAssignmentService,
  deleteAssignmentService,
  updateAssignmentStatusService,
  getCourseAssignmentsService,
  getAssignmentSubmissionsService,
  gradeSubmissionService,
  getSubmissionStatsService,
  submitAssignmentService,
} from './service';

/**
 * 과제 관리 라우터 생성
 */
export const createAssignmentRoutes = (app: Hono<AppEnv>) => {
  // ============ Assignment 라우트 ============

  /**
   * POST /api/courses/:courseId/assignments
   * 새 과제 생성
   */
  app.post('/api/courses/:courseId/assignments', async (c) => {
    const userId = c.get('user')?.id;
    if (!userId) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }

    try {
      const body = await c.req.json();
      const validated = CreateAssignmentRequestSchema.parse(body);

      const supabase = getSupabase(c);
      const logger = getLogger(c);
      const result = await createAssignmentService(
        { supabase, logger },
        userId,
        validated
      );

      return respond(c, result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ error: '유효하지 않은 입력입니다', details: error.errors }, 400);
      }
      throw error;
    }
  });

  /**
   * GET /api/courses/:courseId/assignments
   * 코스의 과제 목록 조회
   */
  app.get('/api/courses/:courseId/assignments', async (c) => {
    const userId = c.get('user')?.id;
    if (!userId) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }

    try {
      const courseId = c.req.param('courseId');
      const limit = parseInt(c.req.query('limit') || '20');
      const offset = parseInt(c.req.query('offset') || '0');

      const supabase = getSupabase(c);
      const logger = getLogger(c);
      const result = await getCourseAssignmentsService(
        { supabase, logger },
        userId,
        courseId,
        Math.min(limit, 100),
        offset
      );

      return respond(c, result);
    } catch (error) {
      throw error;
    }
  });

  /**
   * GET /api/courses/:courseId/assignments/:assignmentId
   * 개별 과제 조회
   */
  app.get('/api/courses/:courseId/assignments/:assignmentId', async (c) => {
    const userId = c.get('user')?.id;
    if (!userId) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }

    try {
      const courseId = c.req.param('courseId');
      const assignmentId = c.req.param('assignmentId');

      const supabase = getSupabase(c);
      const logger = getLogger(c);

      // 해당 과제 조회
      const { data: assignment, error: queryError } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .eq('course_id', courseId)
        .maybeSingle();

      if (queryError) {
        logger.error('Assignment fetch failed:', queryError);
        return respond(c, {
          ok: false,
          status: 500,
          error: {
            code: 'ASSIGNMENT_FETCH_ERROR',
            message: '과제 조회 실패',
          },
        } as any);
      }

      if (!assignment) {
        return respond(c, {
          ok: false,
          status: 404,
          error: {
            code: 'ASSIGNMENT_NOT_FOUND',
            message: '과제를 찾을 수 없습니다',
          },
        } as any);
      }

      // 접근 권한 확인 (강사 또는 등록된 학습자)
      const { data: course } = await supabase
        .from('courses')
        .select('owner_id')
        .eq('id', courseId)
        .maybeSingle();

      // 강사가 아닌 경우 학습자 등록 여부 확인
      if (course?.owner_id !== userId) {
        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('id')
          .eq('course_id', courseId)
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle();

        if (!enrollment) {
          return respond(c, {
            ok: false,
            status: 403,
            error: {
              code: 'ACCESS_DENIED',
              message: '이 과제에 접근할 권한이 없습니다',
            },
          } as any);
        }
      }

      // 응답 데이터 변환 (snake_case → camelCase)
      const transformedAssignment = {
        id: assignment.id,
        courseId: assignment.course_id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.due_date,
        pointsWeight: assignment.points_weight,
        status: assignment.status,
        allowLate: assignment.allow_late,
        allowResubmission: assignment.allow_resubmission,
        publishedAt: assignment.published_at,
        closedAt: assignment.closed_at || null,
        createdAt: assignment.created_at,
        updatedAt: assignment.updated_at,
      };

      return respond(c, {
        ok: true,
        status: 200,
        data: transformedAssignment,
      } as any);
    } catch (error) {
      throw error;
    }
  });

  /**
   * PUT /api/assignments/:assignmentId
   * 과제 수정
   */
  app.put('/api/assignments/:assignmentId', async (c) => {
    const userId = c.get('user')?.id;
    if (!userId) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }

    try {
      const assignmentId = c.req.param('assignmentId');
      const body = await c.req.json();
      const validated = UpdateAssignmentRequestSchema.parse({
        ...body,
        assignmentId,
      });

      const supabase = getSupabase(c);
      const logger = getLogger(c);
      const result = await updateAssignmentService(
        { supabase, logger },
        userId,
        validated
      );

      return respond(c, result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ error: '유효하지 않은 입력입니다', details: error.errors }, 400);
      }
      throw error;
    }
  });

  /**
   * DELETE /api/assignments/:assignmentId
   * 과제 삭제 (소프트 삭제)
   */
  app.delete('/api/assignments/:assignmentId', async (c) => {
    const userId = c.get('user')?.id;
    if (!userId) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }

    try {
      const assignmentId = c.req.param('assignmentId');

      const supabase = getSupabase(c);
      const logger = getLogger(c);
      const result = await deleteAssignmentService(
        { supabase, logger },
        userId,
        assignmentId
      );

      return respond(c, result);
    } catch (error) {
      throw error;
    }
  });

  /**
   * PATCH /api/assignments/:assignmentId/status
   * 과제 상태 변경
   */
  app.patch('/api/assignments/:assignmentId/status', async (c) => {
    const userId = c.get('user')?.id;
    if (!userId) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }

    try {
      const assignmentId = c.req.param('assignmentId');
      const body = await c.req.json();
      const validated = UpdateAssignmentStatusRequestSchema.parse({
        ...body,
        assignmentId,
      });

      const supabase = getSupabase(c);
      const logger = getLogger(c);
      const result = await updateAssignmentStatusService(
        { supabase, logger },
        userId,
        validated.assignmentId,
        validated.status
      );

      return respond(c, result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ error: '유효하지 않은 입력입니다', details: error.errors }, 400);
      }
      throw error;
    }
  });

  // ============ Submission 라우트 ============

  /**
   * GET /api/assignments/:assignmentId/submissions
   * 과제의 제출물 목록 조회
   */
  app.get('/api/assignments/:assignmentId/submissions', async (c) => {
    const userId = c.get('user')?.id;
    if (!userId) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }

    try {
      const assignmentId = c.req.param('assignmentId');
      const limit = parseInt(c.req.query('limit') || '20');
      const offset = parseInt(c.req.query('offset') || '0');

      const supabase = getSupabase(c);
      const logger = getLogger(c);
      const result = await getAssignmentSubmissionsService(
        { supabase, logger },
        userId,
        assignmentId,
        Math.min(limit, 100),
        offset
      );

      return respond(c, result);
    } catch (error) {
      throw error;
    }
  });

  /**
   * GET /api/assignments/:assignmentId/submissions/stats
   * 제출물 통계 조회
   */
  app.get('/api/assignments/:assignmentId/submissions/stats', async (c) => {
    const userId = c.get('user')?.id;
    if (!userId) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }

    try {
      const assignmentId = c.req.param('assignmentId');

      const supabase = getSupabase(c);
      const logger = getLogger(c);
      const result = await getSubmissionStatsService(
        { supabase, logger },
        userId,
        assignmentId
      );

      return respond(c, result);
    } catch (error) {
      throw error;
    }
  });

  /**
   * PATCH /api/submissions/:submissionId/grade
   * 제출물 채점
   */
  app.patch('/api/submissions/:submissionId/grade', async (c) => {
    const userId = c.get('user')?.id;
    if (!userId) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }

    try {
      const submissionId = c.req.param('submissionId');
      const body = await c.req.json();
      const validated = GradeSubmissionRequestSchema.parse({
        ...body,
        submissionId,
      });

      const supabase = getSupabase(c);
      const logger = getLogger(c);
      const result = await gradeSubmissionService(
        { supabase, logger },
        userId,
        validated
      );

      return respond(c, result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ error: '유효하지 않은 입력입니다', details: error.errors }, 400);
      }
      throw error;
    }
  });

  // ============ Assignment 제출 라우트 (러너용) ============

  /**
   * GET /api/courses/:courseId/assignments/:assignmentId/my-submission
   * 사용자 제출 상태 조회 (러너)
   */
  app.get('/api/courses/:courseId/assignments/:assignmentId/my-submission', async (c) => {
    const userId = c.get('user')?.id;
    if (!userId) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }

    try {
      const courseId = c.req.param('courseId');
      const assignmentId = c.req.param('assignmentId');

      const supabase = getSupabase(c);

      // 사용자의 제출물 조회
      const { data: submission, error } = await supabase
        .from('submissions')
        .select('id, assignment_id, content, link, status, is_late, score, feedback, graded_at, submitted_at, updated_at')
        .eq('assignment_id', assignmentId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (error) {
        // 제출물이 없으면 null 반환
        return c.json(null);
      }

      return c.json({
        id: submission.id,
        assignmentId: submission.assignment_id,
        content: submission.content,
        link: submission.link,
        status: submission.status,
        isLate: submission.is_late,
        score: submission.score,
        feedback: submission.feedback,
        gradedAt: submission.graded_at,
        submittedAt: submission.submitted_at,
        updatedAt: submission.updated_at,
      });
    } catch (error) {
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  /**
   * POST /api/courses/:courseId/assignments/:assignmentId/submit
   * 과제 제출 (러너)
   */
  app.post('/api/courses/:courseId/assignments/:assignmentId/submit', async (c) => {
    const userId = c.get('user')?.id;
    if (!userId) {
      return c.json({ error: '인증이 필요합니다' }, 401);
    }

    try {
      const courseId = c.req.param('courseId');
      const assignmentId = c.req.param('assignmentId');
      const body = await c.req.json();
      const validated = SubmitAssignmentRequestSchema.parse(body);

      const supabase = getSupabase(c);
      const logger = getLogger(c);
      const result = await submitAssignmentService(
        { supabase, logger },
        userId,
        courseId,
        assignmentId,
        validated
      );

      return respond(c, result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ error: '유효하지 않은 입력입니다', details: error.errors }, 400);
      }
      throw error;
    }
  });
};

/**
 * 라우터 등록 함수
 */
export const registerAssignmentRoutes = (app: Hono<AppEnv>) => {
  createAssignmentRoutes(app);
};

