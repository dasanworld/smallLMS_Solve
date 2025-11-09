import { Hono } from 'hono';
import { z } from 'zod';
import { authenticate } from '@/backend/middleware/auth';
import {
  respond,
  failure,
  type HandlerResult
} from '@/backend/http/response';
import {
  GetGradesRequestSchema,
  GradeSubmissionRequestSchema
} from '@/features/grade/backend/schema';
import {
  getLearnerGradesService,
  gradeSubmissionService,
  getSubmissionForGradingService,
  getAssignmentSubmissionsService,
  getInstructorSubmissionsService
} from '@/features/grade/backend/service';
import {
  gradeErrorCodes,
  type GradeServiceError
} from '@/features/grade/backend/error';
import type { AppEnv } from '@/backend/hono/context';

export const registerGradeRoutes = (app: Hono<AppEnv>) => {
  // GET /api/grades - Get learner's grades
  app.get('/api/grades', authenticate, async (c) => {
    const supabase = c.get('supabase');
    const logger = c.get('logger');
    const user = c.get('user');

    if (!user) {
      return respond(c, failure(401, gradeErrorCodes.UNAUTHORIZED, 'Unauthorized'));
    }

    // Check if user is a learner
    if (user.role !== 'learner') {
      return respond(c, failure(403, gradeErrorCodes.INSUFFICIENT_PERMISSIONS, 'Insufficient permissions'));
    }

    // Get query parameters
    const limit = Number(c.req.query('limit')) || 20;
    const offset = Number(c.req.query('offset')) || 0;
    const courseId = c.req.query('courseId') || undefined;

    const result = await getLearnerGradesService(
      supabase,
      user.id,
      courseId,
      limit,
      offset
    );

    return respond(c, result as any);
  });

  // GET /api/instructor/submissions - Get all submissions for instructor's courses
  app.get('/api/instructor/submissions', authenticate, async (c) => {
    const supabase = c.get('supabase');
    const user = c.get('user');

    if (!user) {
      return respond(c, failure(401, gradeErrorCodes.UNAUTHORIZED, 'Unauthorized'));
    }

    // Check if user is an instructor
    if (user.role !== 'instructor') {
      return respond(c, failure(403, gradeErrorCodes.INSUFFICIENT_PERMISSIONS, 'Insufficient permissions'));
    }

    const result = await getInstructorSubmissionsService(
      supabase,
      user.id
    );

    return respond(c, result as any);
  });

  // GET /api/submissions/:id - Get submission details for grading
  app.get('/api/submissions/:id', authenticate, async (c) => {
    const supabase = c.get('supabase');
    const user = c.get('user');
    const submissionId = c.req.param('id');

    if (!user) {
      return respond(c, failure(401, gradeErrorCodes.UNAUTHORIZED, 'Unauthorized'));
    }

    // Check if user is an instructor
    if (user.role !== 'instructor') {
      return respond(c, failure(403, gradeErrorCodes.INSUFFICIENT_PERMISSIONS, 'Insufficient permissions'));
    }

    const result = await getSubmissionForGradingService(
      supabase,
      user.id,
      submissionId
    );

    return respond(c, result as any);
  });

  // PUT /api/submissions/:id/grade - Grade submission with score and feedback
  app.put('/api/submissions/:id/grade', authenticate, async (c) => {
    const supabase = c.get('supabase');
    const user = c.get('user');
    const submissionId = c.req.param('id');

    if (!user) {
      return respond(c, failure(401, gradeErrorCodes.UNAUTHORIZED, 'Unauthorized'));
    }

    // Check if user is an instructor
    if (user.role !== 'instructor') {
      return respond(c, failure(403, gradeErrorCodes.INSUFFICIENT_PERMISSIONS, 'Insufficient permissions'));
    }

    try {
      const body = await c.req.json();
      const parsed = GradeSubmissionRequestSchema.safeParse(body);

      if (!parsed.success) {
        return respond(c, failure(400, gradeErrorCodes.INVALID_SCORE_RANGE, 'Invalid request body'));
      }

      const { score, feedback, action } = parsed.data;

      const result = await gradeSubmissionService(
        supabase,
        user.id,
        submissionId,
        score,
        feedback,
        action
      );

      return respond(c, result as any);
    } catch (error) {
      return respond(c, failure(400, gradeErrorCodes.INVALID_SCORE_RANGE, 'Invalid request body'));
    }
  });

  // GET /api/assignments/:id/submissions - Get all submissions for assignment
  app.get('/api/assignments/:id/submissions', authenticate, async (c) => {
    const supabase = c.get('supabase');
    const user = c.get('user');
    const assignmentId = c.req.param('id');

    if (!user) {
      return respond(c, failure(401, gradeErrorCodes.UNAUTHORIZED, 'Unauthorized'));
    }

    // Check if user is an instructor
    if (user.role !== 'instructor') {
      return respond(c, failure(403, gradeErrorCodes.INSUFFICIENT_PERMISSIONS, 'Insufficient permissions'));
    }

    const result = await getAssignmentSubmissionsService(
      supabase,
      user.id,
      assignmentId
    );

    return respond(c, result as any);
  });
};
