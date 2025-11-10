import { z } from 'zod';

// Assignment Request Schemas
export const CreateAssignmentRequestSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  dueDate: z.string().datetime(),
  pointsWeight: z.number().min(0).max(100),
  instructions: z.string().optional(),
});

export const UpdateAssignmentRequestSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  dueDate: z.string().datetime().optional(),
  pointsWeight: z.number().min(0).max(100).optional(),
  instructions: z.string().optional(),
});

export const UpdateAssignmentStatusRequestSchema = z.object({
  status: z.enum(['open', 'closed', 'draft']),
});

// Submission Request Schemas
export const SubmitAssignmentRequestSchema = z.object({
  content: z.string().optional(),
  link: z.string().url().optional(),
}).refine((data) => data.content || data.link, {
  message: 'Either content or link must be provided',
});

export const GradeSubmissionRequestSchema = z.object({
  submissionId: z.string(),
  score: z.number().min(0).max(100),
  feedback: z.string().min(1).max(1000),
  status: z.enum(['submitted', 'graded', 'resubmission_required']).optional(),
});

export const UpdateSubmissionStatusRequestSchema = z.object({
  status: z.enum(['submitted', 'graded', 'resubmission_required']),
});

// Assignment Response Schema
export const AssignmentResponseSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  title: z.string(),
  description: z.string(),
  dueDate: z.string(),
  pointsWeight: z.number(),
  status: z.enum(['draft', 'published', 'closed']),
  allowLate: z.boolean(),
  allowResubmission: z.boolean(),
  instructions: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  publishedAt: z.string().nullable(),
  closedAt: z.string().nullable(),
});

export const AssignmentListResponseSchema = z.object({
  assignments: z.array(AssignmentResponseSchema),
  total: z.number(),
});

// Submission Response Schema
export const SubmissionResponseSchema = z.object({
  id: z.string(),
  assignmentId: z.string(),
  courseId: z.string(),
  learnerId: z.string(),
  content: z.string().nullable(),
  link: z.string().nullable(),
  score: z.number().min(0).max(100).nullable(),
  feedback: z.string().nullable(),
  status: z.enum(['submitted', 'graded', 'resubmission_required']),
  submittedAt: z.string(),
  gradedAt: z.string().nullable(),
  updatedAt: z.string(),
});

export const SubmissionListResponseSchema = z.object({
  submissions: z.array(SubmissionResponseSchema),
  total: z.number(),
});

// Submission Stats Response Schema
export const SubmissionStatsResponseSchema = z.object({
  assignmentId: z.string(),
  totalSubmissions: z.number(),
  gradedCount: z.number(),
  pendingCount: z.number(),
  resubmissionCount: z.number(),
  averageScore: z.number().nullable(),
});

// Export types
export type CreateAssignmentRequest = z.infer<typeof CreateAssignmentRequestSchema>;
export type UpdateAssignmentRequest = z.infer<typeof UpdateAssignmentRequestSchema>;
export type UpdateAssignmentStatusRequest = z.infer<typeof UpdateAssignmentStatusRequestSchema>;
export type SubmitAssignmentRequest = z.infer<typeof SubmitAssignmentRequestSchema>;
export type GradeSubmissionRequest = z.infer<typeof GradeSubmissionRequestSchema>;
export type UpdateSubmissionStatusRequest = z.infer<typeof UpdateSubmissionStatusRequestSchema>;
export type AssignmentResponse = z.infer<typeof AssignmentResponseSchema>;
export type AssignmentListResponse = z.infer<typeof AssignmentListResponseSchema>;
export type SubmissionResponse = z.infer<typeof SubmissionResponseSchema>;
export type SubmissionListResponse = z.infer<typeof SubmissionListResponseSchema>;
export type SubmissionStatsResponse = z.infer<typeof SubmissionStatsResponseSchema>;
