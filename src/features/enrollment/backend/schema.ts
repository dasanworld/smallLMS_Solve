import { z } from 'zod';

/**
 * 수강신청 요청 스키마
 */
export const createEnrollmentRequestSchema = z.object({
  courseId: z.string().uuid('유효한 코스 ID를 입력해주세요.'),
});

export type CreateEnrollmentRequest = z.infer<typeof createEnrollmentRequestSchema>;

/**
 * 수강신청 응답 스키마
 */
export const enrollmentResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
  status: z.enum(['active', 'cancelled']),
  enrolledAt: z.string().datetime(),
});

export type EnrollmentResponse = z.infer<typeof enrollmentResponseSchema>;

/**
 * 수강신청 목록 응답 스키마
 */
export const enrollmentListResponseSchema = z.object({
  enrollments: z.array(enrollmentResponseSchema),
});

export type EnrollmentListResponse = z.infer<typeof enrollmentListResponseSchema>;




