import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { 
  assignmentDetailResponseSchema, 
  assignmentSubmissionRequestSchema,
  assignmentSubmissionResponseSchema 
} from './schema';
import { 
  getAssignmentDetailService, 
  submitAssignmentService 
} from './service';
import { ASSIGNMENT_DETAIL_ERROR_CODES, AssignmentDetailError } from './error';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';
import { verifyAuth } from '@/backend/hono/middlewares/verify-auth';

export function registerAssignmentDetailRoutes(app: Hono) {
  // GET /api/assignments/:id - Fetch assignment details
  app.get('/assignments/:id', verifyAuth, async (c) => {
    try {
      const { id: assignmentId } = c.req.param();
      const userId = c.get('user').id;

      const supabase = getSupabaseServiceClient();

      const assignmentDetail = await getAssignmentDetailService(
        supabase,
        assignmentId,
        userId
      );

      // Transform the data to match the response schema
      const response = {
        id: assignmentDetail.id,
        title: assignmentDetail.title,
        description: assignmentDetail.description || undefined,
        deadline: assignmentDetail.deadline,
        score_weight: assignmentDetail.score_weight,
        submission_policy: assignmentDetail.submission_policy,
        created_at: assignmentDetail.created_at,
        updated_at: assignmentDetail.updated_at,
        course_id: assignmentDetail.course_id,
        course_title: assignmentDetail.course_title,
        is_submitted: assignmentDetail.is_submitted,
        submission_id: assignmentDetail.submission_id,
        submission_content: assignmentDetail.submission_content,
        submission_link: assignmentDetail.submission_link,
        submission_status: assignmentDetail.submission_status || undefined,
        submission_created_at: assignmentDetail.submission_created_at || undefined,
        submission_updated_at: assignmentDetail.submission_updated_at || undefined,
      };

      // Validate the response against the schema
      const validatedResponse = assignmentDetailResponseSchema.parse(response);
      
      return c.json(validatedResponse);
    } catch (error) {
      if (error instanceof AssignmentDetailError) {
        return c.json(
          { error: { code: error.code, message: error.message } },
          400
        );
      }
      console.error('Error fetching assignment detail:', error);
      return c.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
        500
      );
    }
  });

  // POST /api/assignments/:id/submit - Submit assignment
  app.post(
    '/assignments/:id/submit',
    verifyAuth,
    zValidator('json', assignmentSubmissionRequestSchema),
    async (c) => {
      try {
        const { id: assignmentId } = c.req.param();
        const userId = c.get('user').id;
        const { content, link } = c.req.valid('json');

        const supabase = getSupabaseServiceClient();

        const result = await submitAssignmentService(
          supabase,
          assignmentId,
          userId,
          { content, link: link || undefined }
        );

        const response = {
          success: true,
          submission_id: result.submission_id,
          message: 'Assignment submitted successfully',
          submitted_at: result.submitted_at,
        };

        // Validate the response against the schema
        const validatedResponse = assignmentSubmissionResponseSchema.parse(response);
        
        return c.json(validatedResponse, 200);
      } catch (error) {
        if (error instanceof AssignmentDetailError) {
          return c.json(
            { error: { code: error.code, message: error.message } },
            400
          );
        }
        console.error('Error submitting assignment:', error);
        return c.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
          500
        );
      }
    }
  );

  return app;
}