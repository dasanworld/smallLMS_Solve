import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { 
  createAssignmentSchema, 
  updateAssignmentSchema, 
  updateAssignmentStatusSchema,
  updateSubmissionStatusSchema,
  gradeSubmissionSchema,
  submitAssignmentSchema,
  courseIdParamSchema,
  assignmentIdParamSchema,
  submissionIdParamSchema
} from './schemas';
import {
  createAssignmentService,
  updateAssignmentService,
  deleteAssignmentService,
  updateAssignmentStatusService,
  getCourseAssignmentsService,
  getAssignmentDetailsService,
  validateAssignmentWeightsService,
} from './service';
import {
  getAssignmentSubmissionsService,
  updateSubmissionStatusService,
  gradeSubmissionService,
  getSubmissionStatsService,
  submitAssignmentService,
} from './submission-service';
import { AssignmentManagementError } from './error';
import { SubmissionManagementError } from './error';
import { authenticate, requireRole } from '@/backend/middleware/auth';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';

export function registerAssignmentManagementRoutes(app: Hono) {
  // GET /api/courses/:courseId/assignments - List assignments for a course
  app.get('/courses/:courseId/assignments', authenticate, async (c) => {
    try {
      const { courseId } = courseIdParamSchema.parse(c.req.param());
      const userId = c.get('user').id;

      const assignments = await getCourseAssignmentsService(userId, courseId);

      return c.json({ assignments });
    } catch (error) {
      if (error instanceof AssignmentManagementError) {
        return c.json(
          { error: { code: error.code, message: error.message } },
          400
        );
      }
      console.error('Error fetching course assignments:', error);
      return c.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
        500
      );
    }
  });

  // POST /api/courses/:courseId/assignments - Create new assignment
  app.post(
    '/courses/:courseId/assignments',
    authenticate,
    zValidator('json', createAssignmentSchema),
    async (c) => {
      try {
        const { courseId } = courseIdParamSchema.parse(c.req.param());
        const userId = c.get('user').id;
        const assignmentData = c.req.valid('json');

        const assignment = await createAssignmentService(
          userId,
          courseId,
          assignmentData
        );

        return c.json({ assignment }, 201);
      } catch (error) {
        if (error instanceof AssignmentManagementError) {
          return c.json(
            { error: { code: error.code, message: error.message } },
            400
          );
        }
        console.error('Error creating assignment:', error);
        return c.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
          500
        );
      }
    }
  );

  // GET /api/assignments/:id - Get assignment details
  app.get('/assignments/:id', authenticate, async (c) => {
    try {
      const { id: assignmentId } = assignmentIdParamSchema.parse(c.req.param());
      const userId = c.get('user').id;

      const assignment = await getAssignmentDetailsService(userId, assignmentId);

      return c.json({ assignment });
    } catch (error) {
      if (error instanceof AssignmentManagementError) {
        return c.json(
          { error: { code: error.code, message: error.message } },
          400
        );
      }
      console.error('Error fetching assignment details:', error);
      return c.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
        500
      );
    }
  });

  // PUT /api/assignments/:id - Update assignment
  app.put(
    '/assignments/:id',
    authenticate,
    zValidator('json', updateAssignmentSchema),
    async (c) => {
      try {
        const { id: assignmentId } = assignmentIdParamSchema.parse(c.req.param());
        const userId = c.get('user').id;
        const assignmentData = c.req.valid('json');

        const assignment = await updateAssignmentService(
          userId,
          assignmentId,
          assignmentData
        );

        return c.json({ assignment });
      } catch (error) {
        if (error instanceof AssignmentManagementError) {
          return c.json(
            { error: { code: error.code, message: error.message } },
            400
          );
        }
        console.error('Error updating assignment:', error);
        return c.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
          500
        );
      }
    }
  );

  // DELETE /api/assignments/:id - Delete assignment (soft delete)
  app.delete('/assignments/:id', authenticate, async (c) => {
    try {
      const { id: assignmentId } = assignmentIdParamSchema.parse(c.req.param());
      const userId = c.get('user').id;

      await deleteAssignmentService(userId, assignmentId);

      return c.json({ message: 'Assignment deleted successfully' });
    } catch (error) {
      if (error instanceof AssignmentManagementError) {
        return c.json(
          { error: { code: error.code, message: error.message } },
          400
        );
      }
      console.error('Error deleting assignment:', error);
      return c.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
        500
      );
    }
  });

  // PUT /api/assignments/:id/status - Update assignment status
  app.put(
    '/assignments/:id/status',
    authenticate,
    zValidator('json', updateAssignmentStatusSchema),
    async (c) => {
      try {
        const { id: assignmentId } = assignmentIdParamSchema.parse(c.req.param());
        const userId = c.get('user').id;
        const { status } = c.req.valid('json');

        const assignment = await updateAssignmentStatusService(
          userId,
          assignmentId,
          status
        );

        return c.json({ assignment });
      } catch (error) {
        if (error instanceof AssignmentManagementError) {
          return c.json(
            { error: { code: error.code, message: error.message } },
            400
          );
        }
        console.error('Error updating assignment status:', error);
        return c.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
          500
        );
      }
    }
  );

  // GET /api/courses/:courseId/assignments/stats - Get assignment statistics for course
  app.get('/courses/:courseId/assignments/stats', authenticate, async (c) => {
    try {
      const { courseId } = courseIdParamSchema.parse(c.req.param());
      const userId = c.get('user').id;

      // For now, just return a placeholder - in a real implementation we'd calculate actual stats
      const supabase = getSupabaseServiceClient();
      
      const { count: totalAssignments } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId)
        .is('deleted_at', null);

      const { count: publishedAssignments } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId)
        .eq('status', 'published')
        .is('deleted_at', null);

      const stats = {
        totalAssignments: totalAssignments || 0,
        publishedAssignments: publishedAssignments || 0,
        draftAssignments: (totalAssignments || 0) - (publishedAssignments || 0),
      };

      return c.json({ stats });
    } catch (error) {
      if (error instanceof AssignmentManagementError) {
        return c.json(
          { error: { code: error.code, message: error.message } },
          400
        );
      }
      console.error('Error fetching assignment stats:', error);
      return c.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
        500
      );
    }
  });

  // GET /api/assignments/:assignmentId/submissions - List submissions for assignment
  app.get('/assignments/:assignmentId/submissions', authenticate, async (c) => {
    try {
      const { assignmentId } = assignmentIdParamSchema.parse(c.req.param());
      const userId = c.get('user').id;

      const submissions = await getAssignmentSubmissionsService(userId, assignmentId);

      return c.json({ submissions });
    } catch (error) {
      if (error instanceof SubmissionManagementError) {
        return c.json(
          { error: { code: error.code, message: error.message } },
          400
        );
      }
      console.error('Error fetching assignment submissions:', error);
      return c.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
        500
      );
    }
  });

  // GET /api/assignments/:assignmentId/submissions/stats - Get submission statistics
  app.get('/assignments/:assignmentId/submissions/stats', authenticate, async (c) => {
    try {
      const { assignmentId } = assignmentIdParamSchema.parse(c.req.param());
      const userId = c.get('user').id;

      const stats = await getSubmissionStatsService(userId, assignmentId);

      return c.json({ stats });
    } catch (error) {
      if (error instanceof SubmissionManagementError) {
        return c.json(
          { error: { code: error.code, message: error.message } },
          400
        );
      }
      console.error('Error fetching submission stats:', error);
      return c.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
        500
      );
    }
  });

  // PUT /api/submissions/:id/status - Update submission status
  app.put(
    '/submissions/:id/status',
    authenticate,
    zValidator('json', updateSubmissionStatusSchema),
    async (c) => {
      try {
        const { id: submissionId } = submissionIdParamSchema.parse(c.req.param());
        const userId = c.get('user').id;
        const { status } = c.req.valid('json');

        const submission = await updateSubmissionStatusService(
          userId,
          submissionId,
          status
        );

        return c.json({ submission });
      } catch (error) {
        if (error instanceof SubmissionManagementError) {
          return c.json(
            { error: { code: error.code, message: error.message } },
            400
          );
        }
        console.error('Error updating submission status:', error);
        return c.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
          500
        );
      }
    }
  );

  // PUT /api/submissions/:id/grade - Grade submission
  app.put(
    '/submissions/:id/grade',
    authenticate,
    zValidator('json', gradeSubmissionSchema),
    async (c) => {
      try {
        const { id: submissionId } = submissionIdParamSchema.parse(c.req.param());
        const userId = c.get('user').id;
        const { grade, feedback } = c.req.valid('json');

        const submission = await gradeSubmissionService(
          userId,
          submissionId,
          grade,
          feedback
        );

        return c.json({ submission });
      } catch (error) {
        if (error instanceof SubmissionManagementError) {
          return c.json(
            { error: { code: error.code, message: error.message } },
            400
          );
        }
        console.error('Error grading submission:', error);
        return c.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
          500
        );
      }
    }
  );

  return app;
}