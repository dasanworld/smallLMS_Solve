import { z } from 'zod';

// Submission request schema
export const submissionRequestSchema = z.object({
  content: z.string().min(1, '내용은 필수입니다.'),
  link: z.string().url('링크는 유효한 URL 형식이어야 합니다.').optional().nullable(),
});

// Submission response schema
export const submissionResponseSchema = z.object({
  success: z.boolean(),
  submission_id: z.string(),
  message: z.string(),
  submitted_at: z.string(),
});

// Submission detail response schema
export const submissionDetailSchema = z.object({
  id: z.string(),
  assignment_id: z.string(),
  user_id: z.string(),
  content: z.string(),
  link: z.string().nullable().optional(),
  status: z.enum(['submitted', 'graded', 'resubmission_required']),
  is_late: z.boolean(),
  submitted_at: z.string(),
  updated_at: z.string(),
});

// Type inference
export type SubmissionRequest = z.infer<typeof submissionRequestSchema>;
export type SubmissionResponse = z.infer<typeof submissionResponseSchema>;
export type SubmissionDetail = z.infer<typeof submissionDetailSchema>;