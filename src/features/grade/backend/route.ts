import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authenticate } from '@/backend/middleware/auth';
import {
  respond,
  failure,
  type HandlerResult
} from '@/backend/http/response';
import {
  GetGradesRequestSchema,
  GradeResponseSchema,
  GradeSubmissionRequestSchema
} from '@/features/grade/backend/schema';
import {
  getLearnerGradesService,
  gradeSubmissionService,
  getSubmissionForGradingService,
  getAssignmentSubmissionsService
} from '@/features/grade/backend/service';
import {
  gradeErrorCodes,
  type GradeServiceError
} from '@/features/grade/backend/error';
import type { AppEnv } from '@/backend/hono/context';

export const registerGradeRoutes = (app: Hono<AppEnv>) => {
  // GET /api/grades - Get learner's grades
  app.get('/api/grades', authenticate, zValidator('query', GetGradesRequestSchema), async (c) => {
    const deps = c.get('dependencies');
    const user = c.get('user');
    
    if (!user) {
      return failure(401, gradeErrorCodes.UNAUTHORIZED, 'Unauthorized');
    }
    
    // Check if user is a learner
    if (user.role !== 'learner') {
      return failure(403, gradeErrorCodes.INSUFFICIENT_PERMISSIONS, 'Insufficient permissions');
    }
    
    const { limit, offset, courseId } = c.req.valid('query');
    
    const result = await getLearnerGradesService(
      deps.supabase,
      user.id,
      courseId,
      limit,
      offset
    );
    
    if (result.isSuccess) {
      return respond(200, result.value);
    } else {
      const errorResult = result as HandlerResult<unknown, GradeServiceError, unknown>;
      
      switch (errorResult.error.code) {
        case gradeErrorCodes.GRADES_NOT_FOUND:
          return failure(404, errorResult.error.code, errorResult.error.message);
        case gradeErrorCodes.INSUFFICIENT_PERMISSIONS:
          return failure(403, errorResult.error.code, errorResult.error.message);
        case gradeErrorCodes.UNAUTHORIZED:
          return failure(401, errorResult.error.code, errorResult.error.message);
        default:
          deps.logger.error('Failed to fetch grades', errorResult.error.message);
          return failure(500, errorResult.error.code, errorResult.error.message);
      }
    }
  });

  // GET /api/submissions/:id - Get submission details for grading
  app.get('/api/submissions/:id', authenticate, async (c) => {
    const deps = c.get('dependencies');
    const user = c.get('user');
    const submissionId = c.req.param('id');

    if (!user) {
      return failure(401, gradeErrorCodes.UNAUTHORIZED, 'Unauthorized');
    }

    // Check if user is an instructor
    if (user.role !== 'instructor') {
      return failure(403, gradeErrorCodes.INSUFFICIENT_PERMISSIONS, 'Insufficient permissions');
    }

    const result = await getSubmissionForGradingService(
      deps.supabase,
      user.id,
      submissionId
    );

    if (result.isSuccess) {
      return respond(200, result.value);
    } else {
      const errorResult = result as HandlerResult<unknown, GradeServiceError, unknown>;

      switch (errorResult.error.code) {
        case gradeErrorCodes.SUBMISSION_NOT_FOUND:
          return failure(404, errorResult.error.code, errorResult.error.message);
        case gradeErrorCodes.INSUFFICIENT_PERMISSIONS:
          return failure(403, errorResult.error.code, errorResult.error.message);
        case gradeErrorCodes.UNAUTHORIZED:
          return failure(401, errorResult.error.code, errorResult.error.message);
        default:
          deps.logger.error('Failed to fetch submission for grading', errorResult.error.message);
          return failure(500, errorResult.error.code, errorResult.error.message);
      }
    }
  });

  // PUT /api/submissions/:id/grade - Grade submission with score and feedback
  app.put('/api/submissions/:id/grade', authenticate, zValidator('json', GradeSubmissionRequestSchema), async (c) => {
    const deps = c.get('dependencies');
    const user = c.get('user');
    const submissionId = c.req.param('id');

    if (!user) {
      return failure(401, gradeErrorCodes.UNAUTHORIZED, 'Unauthorized');
    }

    // Check if user is an instructor
    if (user.role !== 'instructor') {
      return failure(403, gradeErrorCodes.INSUFFICIENT_PERMISSIONS, 'Insufficient permissions');
    }

    const { score, feedback, action } = c.req.valid('json');

    const result = await gradeSubmissionService(
      deps.supabase,
      user.id,
      submissionId,
      score,
      feedback,
      action
    );

    if (result.isSuccess) {
      return respond(200, result.value);
    } else {
      const errorResult = result as HandlerResult<unknown, GradeServiceError, unknown>;

      switch (errorResult.error.code) {
        case gradeErrorCodes.SUBMISSION_NOT_FOUND:
          return failure(404, errorResult.error.code, errorResult.error.message);
        case gradeErrorCodes.ASSIGNMENT_NOT_FOUND:
          return failure(404, errorResult.error.code, errorResult.error.message);
        case gradeErrorCodes.INVALID_SCORE_RANGE:
          return failure(400, errorResult.error.code, errorResult.error.message);
        case gradeErrorCodes.MISSING_FEEDBACK:
          return failure(400, errorResult.error.code, errorResult.error.message);
        case gradeErrorCodes.INSUFFICIENT_PERMISSIONS:
          return failure(403, errorResult.error.code, errorResult.error.message);
        case gradeErrorCodes.SUBMISSION_ALREADY_GRADED:
          return failure(400, errorResult.error.code, errorResult.error.message);
        case gradeErrorCodes.UNAUTHORIZED:
          return failure(401, errorResult.error.code, errorResult.error.message);
        default:
          deps.logger.error('Failed to grade submission', errorResult.error.message);
          return failure(500, errorResult.error.code, errorResult.error.message);
      }
    }
  });

  // GET /api/assignments/:id/submissions - Get all submissions for assignment
  app.get('/api/assignments/:id/submissions', authenticate, async (c) => {
    const deps = c.get('dependencies');
    const user = c.get('user');
    const assignmentId = c.req.param('id');

    if (!user) {
      return failure(401, gradeErrorCodes.UNAUTHORIZED, 'Unauthorized');
    }

    // Check if user is an instructor
    if (user.role !== 'instructor') {
      return failure(403, gradeErrorCodes.INSUFFICIENT_PERMISSIONS, 'Insufficient permissions');
    }

    const result = await getAssignmentSubmissionsService(
      deps.supabase,
      user.id,
      assignmentId
    );

    if (result.isSuccess) {
      return respond(200, result.value);
    } else {
      const errorResult = result as HandlerResult<unknown, GradeServiceError, unknown>;

      switch (errorResult.error.code) {
        case gradeErrorCodes.ASSIGNMENT_NOT_FOUND:
          return failure(404, errorResult.error.code, errorResult.error.message);
        case gradeErrorCodes.INSUFFICIENT_PERMISSIONS:
          return failure(403, errorResult.error.code, errorResult.error.message);
        case gradeErrorCodes.UNAUTHORIZED:
          return failure(401, errorResult.error.code, errorResult.error.message);
        default:
          deps.logger.error('Failed to fetch assignment submissions', errorResult.error.message);
          return failure(500, errorResult.error.code, errorResult.error.message);
      }
    }
  });
};