import { z } from 'zod';

// Assignment detail response schema
export const assignmentDetailResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  deadline: z.string().datetime(),
  score_weight: z.number().min(0).max(100),
  submission_policy: z.object({
    allow_text_submission: z.boolean(),
    allow_link_submission: z.boolean(),
    allow_file_submission: z.boolean(),
    max_file_size: z.number().optional(),
    allowed_file_types: z.array(z.string()).optional(),
  }),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  course_id: z.string().uuid(),
  course_title: z.string(),
  is_submitted: z.boolean(),
  submission_id: z.string().uuid().nullable(),
  submission_content: z.string().nullable(),
  submission_link: z.string().url().nullable(),
  submission_status: z.string().nullable(),
  submission_created_at: z.string().datetime().nullable(),
  submission_updated_at: z.string().datetime().nullable(),
});

// Assignment submission request schema
export const assignmentSubmissionRequestSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  link: z.string().url('Link must be a valid URL').optional().nullable(),
});

// Assignment submission response schema
export const assignmentSubmissionResponseSchema = z.object({
  success: z.boolean(),
  submission_id: z.string().uuid(),
  message: z.string(),
  submitted_at: z.string().datetime(),
});

// Export types
export type AssignmentDetailResponse = z.infer<typeof assignmentDetailResponseSchema>;
export type AssignmentSubmissionRequest = z.infer<typeof assignmentSubmissionRequestSchema>;
export type AssignmentSubmissionResponse = z.infer<typeof assignmentSubmissionResponseSchema>;