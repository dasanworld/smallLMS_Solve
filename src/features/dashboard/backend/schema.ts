import { z } from 'zod';

// Course Progress Information
export const CourseProgressSchema = z.object({
  courseId: z.string(),
  courseTitle: z.string(),
  completedAssignments: z.number(),
  totalAssignments: z.number(),
  progressPercentage: z.number(),
  status: z.string(), // draft, published, archived
});

export type CourseProgress = z.infer<typeof CourseProgressSchema>;

// Assignment Information
export const AssignmentInfoSchema = z.object({
  id: z.string(),
  title: z.string(),
  courseId: z.string(),
  courseTitle: z.string(),
  dueDate: z.string(), // ISO date string
  status: z.string(), // submitted, graded, resubmission_required, etc.
  isLate: z.boolean().optional().default(false),
});

export type AssignmentInfo = z.infer<typeof AssignmentInfoSchema>;

// Feedback Summary Information
export const FeedbackSummarySchema = z.object({
  id: z.string(),
  assignmentId: z.string(),
  assignmentTitle: z.string(),
  courseId: z.string(),
  courseTitle: z.string(),
  feedback: z.string().optional(),
  score: z.number().optional(),
  gradedAt: z.string().optional(), // ISO date string
});

export type FeedbackSummary = z.infer<typeof FeedbackSummarySchema>;

// Assignment Submission Status
export const SubmissionStatusSchema = z.object({
  id: z.string(),
  assignmentId: z.string(),
  assignmentTitle: z.string(),
  courseId: z.string(),
  courseTitle: z.string(),
  status: z.string(), // not_submitted, submitted, graded, resubmission_required
  isLate: z.boolean().optional().default(false),
  score: z.number().optional(),
  submittedAt: z.string().optional(), // ISO date string
});

export type SubmissionStatus = z.infer<typeof SubmissionStatusSchema>;

// Learner Dashboard Response
export const LearnerDashboardResponseSchema = z.object({
  enrolledCourses: z.array(CourseProgressSchema),
  upcomingAssignments: z.array(AssignmentInfoSchema).optional().default([]),
  recentFeedback: z.array(FeedbackSummarySchema).optional().default([]),
  allAssignmentsStatus: z.array(SubmissionStatusSchema).optional().default([]),
});

export type LearnerDashboardResponse = z.infer<typeof LearnerDashboardResponseSchema>;

// No specific request schema needed for GET /api/dashboard/learner
export const LearnerDashboardRequestSchema = z.object({});