import { z } from 'zod';

// Course information for instructor dashboard
export const InstructorCourseSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(['draft', 'published', 'archived']),
  enrollmentCount: z.number(),
  assignmentCount: z.number(),
  createdAt: z.string().optional(), // ISO date string
});

export type InstructorCourse = z.infer<typeof InstructorCourseSchema>;

// Recent submission information
export const RecentSubmissionSchema = z.object({
  id: z.string(),
  assignmentId: z.string(),
  assignmentTitle: z.string(),
  courseId: z.string(),
  courseTitle: z.string(),
  studentName: z.string(),
  submittedAt: z.string(), // ISO date string
  status: z.string(), // submitted, graded, resubmission_required, etc.
  isLate: z.boolean().optional().default(false),
});

export type RecentSubmission = z.infer<typeof RecentSubmissionSchema>;

// Instructor Dashboard Response
export const InstructorDashboardResponseSchema = z.object({
  courses: z.array(InstructorCourseSchema),
  pendingGradingCount: z.number(),
  recentSubmissions: z.array(RecentSubmissionSchema).optional().default([]),
});

export type InstructorDashboardResponse = z.infer<typeof InstructorDashboardResponseSchema>;

// Instructor Dashboard Request (with optional filters)
export const InstructorDashboardRequestSchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(10),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export type InstructorDashboardRequest = z.infer<typeof InstructorDashboardRequestSchema>;