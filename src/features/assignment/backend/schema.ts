/**
 * 과제 관리 API의 요청/응답 스키마
 */

import { z } from 'zod';

// ============ Assignment 관련 스키마 ============

/**
 * 과제 생성 요청 스키마
 */
export const CreateAssignmentRequestSchema = z.object({
  courseId: z.string().uuid('유효한 코스 ID가 필요합니다'),
  title: z.string().min(1, '제목은 필수입니다').max(255, '제목은 255자 이하여야 합니다'),
  description: z.string().min(1, '설명은 필수입니다'),
  dueDate: z.string().datetime('유효한 날짜 형식이 필요합니다'),
  pointsWeight: z.number().min(0, '가중치는 0 이상이어야 합니다').max(1, '가중치는 1.0 이하여야 합니다'),
  allowLate: z.boolean().default(false),
  allowResubmission: z.boolean().default(false),
});

export type CreateAssignmentRequest = z.infer<typeof CreateAssignmentRequestSchema>;

/**
 * 과제 수정 요청 스키마
 */
export const UpdateAssignmentRequestSchema = CreateAssignmentRequestSchema.partial().extend({
  assignmentId: z.string().uuid('유효한 과제 ID가 필요합니다'),
});

export type UpdateAssignmentRequest = z.infer<typeof UpdateAssignmentRequestSchema>;

/**
 * 과제 상태 변경 요청 스키마
 */
export const UpdateAssignmentStatusRequestSchema = z.object({
  assignmentId: z.string().uuid('유효한 과제 ID가 필요합니다'),
  status: z.enum(['draft', 'published', 'closed'], {
    errorMap: () => ({ message: '유효한 상태는 draft, published, closed입니다' }),
  }),
});

export type UpdateAssignmentStatusRequest = z.infer<typeof UpdateAssignmentStatusRequestSchema>;

/**
 * 과제 응답 스키마
 */
export const AssignmentResponseSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  dueDate: z.string().datetime(),
  pointsWeight: z.number(),
  status: z.enum(['draft', 'published', 'closed']),
  allowLate: z.boolean(),
  allowResubmission: z.boolean(),
  publishedAt: z.string().datetime().nullable(),
  closedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type AssignmentResponse = z.infer<typeof AssignmentResponseSchema>;

/**
 * 과제 목록 응답 스키마
 */
export const AssignmentListResponseSchema = z.object({
  data: z.array(AssignmentResponseSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});

export type AssignmentListResponse = z.infer<typeof AssignmentListResponseSchema>;

// ============ Submission 관련 스키마 ============

/**
 * 제출물 채점 요청 스키마
 */
export const GradeSubmissionRequestSchema = z.object({
  submissionId: z.string().uuid('유효한 제출물 ID가 필요합니다'),
  score: z.number().min(0, '점수는 0 이상이어야 합니다').max(100, '점수는 100 이하여야 합니다'),
  feedback: z.string().min(1, '피드백은 필수입니다'),
  status: z.enum(['graded', 'resubmission_required']).default('graded'),
});

export type GradeSubmissionRequest = z.infer<typeof GradeSubmissionRequestSchema>;

/**
 * 제출물 상태 변경 요청 스키마
 */
export const UpdateSubmissionStatusRequestSchema = z.object({
  submissionId: z.string().uuid('유효한 제출물 ID가 필요합니다'),
  status: z.enum(['submitted', 'graded', 'resubmission_required'], {
    errorMap: () => ({ message: '유효한 상태는 submitted, graded, resubmission_required입니다' }),
  }),
});

export type UpdateSubmissionStatusRequest = z.infer<typeof UpdateSubmissionStatusRequestSchema>;

/**
 * 제출물 응답 스키마
 */
export const SubmissionResponseSchema = z.object({
  id: z.string().uuid(),
  assignmentId: z.string().uuid(),
  userId: z.string().uuid(),
  content: z.string(),
  link: z.string().url().nullable(),
  status: z.enum(['submitted', 'graded', 'resubmission_required']),
  isLate: z.boolean(),
  score: z.number().nullable(),
  feedback: z.string().nullable(),
  gradedAt: z.string().datetime().nullable(),
  submittedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type SubmissionResponse = z.infer<typeof SubmissionResponseSchema>;

/**
 * 제출물 목록 응답 스키마
 */
export const SubmissionListResponseSchema = z.object({
  data: z.array(SubmissionResponseSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});

export type SubmissionListResponse = z.infer<typeof SubmissionListResponseSchema>;

/**
 * 제출물 통계 응답 스키마
 */
export const SubmissionStatsResponseSchema = z.object({
  assignmentId: z.string().uuid(),
  total: z.number(),
  submitted: z.number(),
  graded: z.number(),
  late: z.number(),
  resubmissionRequired: z.number(),
  averageScore: z.number().nullable(),
});

export type SubmissionStatsResponse = z.infer<typeof SubmissionStatsResponseSchema>;

