import type { Hono } from 'hono';
import { 
  respond,
  failure,
  type ErrorResult 
} from '@/backend/http/response';
import { 
  getLogger, 
  getSupabase,
  type AppEnv 
} from '@/backend/hono/context';
import { 
  submissionRequestSchema 
} from './schema';
import { 
  submissionErrorCodes 
} from './error';
import { 
  submitAssignmentService 
} from './service';
import { authenticate, getAuthenticatedUser } from '@/backend/middleware/auth';

export const registerSubmissionRoutes = (app: Hono<AppEnv>) => {
  // POST /api/assignments/:id/submit - Submit or resubmit assignment
  app.post('/api/assignments/:id/submit', authenticate, async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const user = getAuthenticatedUser(c);
    
    if (!user) {
      return respond(
        c,
        failure(
          401,
          submissionErrorCodes.UNAUTHORIZED,
          '인증되지 않은 사용자입니다.',
        ),
      );
    }

    const assignmentId = c.req.param('id');

    // Parse request body
    const requestBody = await c.req.json();
    const parsedBody = submissionRequestSchema.safeParse(requestBody);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          submissionErrorCodes.INVALID_INPUT,
          '입력 데이터가 유효하지 않습니다.',
          parsedBody.error.format(),
        ),
      );
    }

    const deps = { supabase, logger };

    const result = await submitAssignmentService(
      deps,
      user.id,
      assignmentId,
      parsedBody.data
    );

    if (!result.ok) {
      const errorResult = result as unknown as ErrorResult<
        typeof submissionErrorCodes[keyof typeof submissionErrorCodes], 
        unknown
      >;

      // Log specific errors
      if (errorResult.error.code === submissionErrorCodes.ASSIGNMENT_NOT_FOUND) {
        logger.error('Assignment not found', errorResult.error.message);
      } else if (errorResult.error.code === submissionErrorCodes.ASSIGNMENT_CLOSED) {
        logger.error('Assignment is closed', errorResult.error.message);
      } else if (errorResult.error.code === submissionErrorCodes.SUBMISSION_PAST_DUE_DATE) {
        logger.error('Submission past due date', errorResult.error.message);
      } else if (errorResult.error.code === submissionErrorCodes.INSUFFICIENT_PERMISSIONS) {
        logger.error('Insufficient permissions', errorResult.error.message);
      } else if (errorResult.error.code === submissionErrorCodes.UNAUTHORIZED) {
        logger.error('Unauthorized access', errorResult.error.message);
      } else {
        logger.error('Submission process failed', errorResult.error.message);
      }

      return respond(c, result);
    }

    logger.info('Assignment submitted successfully', {
      userId: user.id,
      assignmentId,
      submissionId: result.value
    });

    // Return success response
    return respond(c, {
      ok: true,
      value: {
        success: true,
        submission_id: result.value,
        message: '과제가 성공적으로 제출되었습니다.',
        submitted_at: new Date().toISOString(),
      }
    });
  });
};