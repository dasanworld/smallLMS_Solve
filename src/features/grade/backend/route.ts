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
  GradeResponseSchema 
} from '@/features/grade/backend/schema';
import { 
  getLearnerGradesService 
} from '@/features/grade/backend/service';
import { 
  gradeErrorCodes,
  type GradeServiceError
} from '@/features/grade/backend/error';
import type { AppContext } from '@/backend/hono/context';

export const registerGradeRoutes = (app: Hono<AppContext>) => {
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
};