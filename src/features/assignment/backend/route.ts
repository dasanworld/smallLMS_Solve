import { Hono } from 'hono';
import { AppEnv, getUser } from '@/backend/hono/context';
import { respond, failure, success } from '@/backend/http/response';
import { assignmentErrorCodes } from './error';
import {
  CreateAssignmentRequestSchema,
  UpdateAssignmentRequestSchema,
  UpdateAssignmentStatusRequestSchema,
  SubmitAssignmentRequestSchema,
  GradeSubmissionRequestSchema,
} from './schema';
import {
  getCourseAssignmentsService,
  getAssignmentByIdService,
  createAssignmentService,
  updateAssignmentService,
  submitAssignmentService,
  gradeSubmissionService,
  getUserSubmissionService,
  deleteAssignmentService,
} from './service';

export const registerAssignmentRoutes = (app: Hono<AppEnv>) => {
  // GET /api/courses/:courseId/assignments - 코스의 과제 목록 조회
  app.get('/api/courses/:courseId/assignments', async (c) => {
    try {
      const courseId = c.req.param('courseId');
      const supabase = c.get('supabase');

      const result = await getCourseAssignmentsService(supabase, courseId);
      return respond(c, result);
    } catch (error) {
      return respond(
        c,
        failure(500, assignmentErrorCodes.ASSIGNMENT_NOT_FOUND, String(error))
      );
    }
  });

  // POST /api/courses/:courseId/assignments - 새 과제 생성 (강사용)
  app.post('/api/courses/:courseId/assignments', async (c) => {
    try {
      const courseId = c.req.param('courseId');
      const user = getUser(c);

      if (!user) {
        return respond(
          c,
          failure(401, assignmentErrorCodes.UNAUTHORIZED, 'User not authenticated')
        );
      }

      if (user.role !== 'instructor') {
        return respond(
          c,
          failure(
            403,
            assignmentErrorCodes.NOT_INSTRUCTOR,
            'Only instructors can create assignments'
          )
        );
      }

      const body = await c.req.json();
      const validation = CreateAssignmentRequestSchema.safeParse(body);

      if (!validation.success) {
        return respond(
          c,
          failure(400, assignmentErrorCodes.VALIDATION_ERROR, 'Invalid request data', {
            errors: validation.error.flatten(),
          })
        );
      }

      const supabase = c.get('supabase');
      const result = await createAssignmentService(
        supabase,
        courseId,
        user.id,
        validation.data
      );
      return respond(c, result);
    } catch (error) {
      return respond(
        c,
        failure(500, assignmentErrorCodes.ASSIGNMENT_CREATION_ERROR, String(error))
      );
    }
  });

  // GET /api/courses/:courseId/assignments/:assignmentId - 과제 상세 조회
  app.get('/api/courses/:courseId/assignments/:assignmentId', async (c) => {
    try {
      const assignmentId = c.req.param('assignmentId');
      const supabase = c.get('supabase');

      const result = await getAssignmentByIdService(supabase, assignmentId);
      return respond(c, result);
    } catch (error) {
      return respond(
        c,
        failure(500, assignmentErrorCodes.ASSIGNMENT_NOT_FOUND, String(error))
      );
    }
  });

  // PUT /api/courses/:courseId/assignments/:assignmentId - 과제 수정 (강사용)
  app.put('/api/courses/:courseId/assignments/:assignmentId', async (c) => {
    try {
      const assignmentId = c.req.param('assignmentId');
      const user = getUser(c);

      if (!user) {
        return respond(
          c,
          failure(401, assignmentErrorCodes.UNAUTHORIZED, 'User not authenticated')
        );
      }

      if (user.role !== 'instructor') {
        return respond(
          c,
          failure(
            403,
            assignmentErrorCodes.NOT_INSTRUCTOR,
            'Only instructors can edit assignments'
          )
        );
      }

      const body = await c.req.json();
      const validation = UpdateAssignmentRequestSchema.safeParse(body);

      if (!validation.success) {
        return respond(
          c,
          failure(400, assignmentErrorCodes.VALIDATION_ERROR, 'Invalid request data', {
            errors: validation.error.flatten(),
          })
        );
      }

      const supabase = c.get('supabase');
      const result = await updateAssignmentService(
        supabase,
        assignmentId,
        user.id,
        validation.data
      );
      return respond(c, result);
    } catch (error) {
      return respond(
        c,
        failure(500, assignmentErrorCodes.ASSIGNMENT_UPDATE_ERROR, String(error))
      );
    }
  });

  // DELETE /api/courses/:courseId/assignments/:assignmentId - 과제 삭제 (강사용)
  app.delete('/api/courses/:courseId/assignments/:assignmentId', async (c) => {
    try {
      const assignmentId = c.req.param('assignmentId');
      const user = getUser(c);

      if (!user) {
        return respond(
          c,
          failure(401, assignmentErrorCodes.UNAUTHORIZED, 'User not authenticated')
        );
      }

      if (user.role !== 'instructor') {
        return respond(
          c,
          failure(
            403,
            assignmentErrorCodes.NOT_INSTRUCTOR,
            'Only instructors can delete assignments'
          )
        );
      }

      const supabase = c.get('supabase');
      const result = await deleteAssignmentService(supabase, assignmentId, user.id);
      return respond(c, result);
    } catch (error) {
      return respond(
        c,
        failure(500, assignmentErrorCodes.ASSIGNMENT_DELETE_ERROR, String(error))
      );
    }
  });

  // POST /api/courses/:courseId/assignments/:assignmentId/submit - 과제 제출 (학습자용)
  app.post('/api/courses/:courseId/assignments/:assignmentId/submit', async (c) => {
    try {
      const courseId = c.req.param('courseId');
      const assignmentId = c.req.param('assignmentId');
      const user = getUser(c);

      if (!user) {
        return respond(
          c,
          failure(401, assignmentErrorCodes.UNAUTHORIZED, 'User not authenticated')
        );
      }

      if (user.role !== 'learner') {
        return respond(
          c,
          failure(
            403,
            assignmentErrorCodes.NOT_LEARNER,
            'Only learners can submit assignments'
          )
        );
      }

      const body = await c.req.json();
      const validation = SubmitAssignmentRequestSchema.safeParse(body);

      if (!validation.success) {
        return respond(
          c,
          failure(400, assignmentErrorCodes.VALIDATION_ERROR, 'Invalid request data', {
            errors: validation.error.flatten(),
          })
        );
      }

      const supabase = c.get('supabase');
      const result = await submitAssignmentService(
        supabase,
        courseId,
        assignmentId,
        user.id,
        validation.data
      );
      return respond(c, result);
    } catch (error) {
      return respond(
        c,
        failure(500, assignmentErrorCodes.SUBMISSION_CREATE_ERROR, String(error))
      );
    }
  });

  // GET /api/courses/:courseId/assignments/:assignmentId/user-submission - 학습자의 제출물 조회
  app.get('/api/courses/:courseId/assignments/:assignmentId/user-submission', async (c) => {
    try {
      const courseId = c.req.param('courseId');
      const assignmentId = c.req.param('assignmentId');
      const user = getUser(c);

      if (!user) {
        return respond(
          c,
          failure(401, assignmentErrorCodes.UNAUTHORIZED, 'User not authenticated')
        );
      }

      const supabase = c.get('supabase');
      const result = await getUserSubmissionService(
        supabase,
        courseId,
        assignmentId,
        user.id
      );
      return respond(c, result);
    } catch (error) {
      return respond(
        c,
        failure(500, assignmentErrorCodes.SUBMISSION_NOT_FOUND, String(error))
      );
    }
  });

  // PATCH /api/submissions/:submissionId/grade - 과제 채점 (강사용)
  app.patch('/api/submissions/:submissionId/grade', async (c) => {
    try {
      const paramSubmissionId = c.req.param('submissionId');
      const user = getUser(c);

      if (!user) {
        return respond(
          c,
          failure(401, assignmentErrorCodes.UNAUTHORIZED, 'User not authenticated')
        );
      }

      if (user.role !== 'instructor') {
        return respond(
          c,
          failure(
            403,
            assignmentErrorCodes.NOT_INSTRUCTOR,
            'Only instructors can grade submissions'
          )
        );
      }

      const body = await c.req.json();
      const validation = GradeSubmissionRequestSchema.safeParse(body);

      if (!validation.success) {
        return respond(
          c,
          failure(400, assignmentErrorCodes.VALIDATION_ERROR, 'Invalid request data', {
            errors: validation.error.flatten(),
          })
        );
      }

      const supabase = c.get('supabase');
      const result = await gradeSubmissionService(
        supabase,
        user.id,
        validation.data.submissionId,
        {
          score: validation.data.score,
          feedback: validation.data.feedback,
          status: validation.data.status,
        }
      );
      return respond(c, result);
    } catch (error) {
      return respond(
        c,
        failure(500, assignmentErrorCodes.SUBMISSION_UPDATE_ERROR, String(error))
      );
    }
  });
};
