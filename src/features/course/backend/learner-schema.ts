import { z } from 'zod';
import { CourseSchema, CategorySchema, DifficultySchema } from './schema';

/**
 * 학습자용 코스 정보
 * - 강사 편집 필드 제외
 * - 카테고리, 난이도 포함
 */
export const LearnerCourseSchema = CourseSchema.extend({
  category: CategorySchema.nullable(),
  difficulty: DifficultySchema.nullable(),
  instructor_name: z.string(), // 강사명 추가
  is_enrolled: z.boolean().default(false), // 수강신청 여부
});

export type LearnerCourse = z.infer<typeof LearnerCourseSchema>;

/**
 * 이용 가능한 코스 목록 조회 응답
 */
export const AvailableCoursesResponseSchema = z.object({
  courses: z.array(LearnerCourseSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export type AvailableCoursesResponse = z.infer<typeof AvailableCoursesResponseSchema>;

/**
 * 수강신청 요청
 */
export const EnrollmentRequestSchema = z.object({
  courseId: z.string().uuid(),
});

export type EnrollmentRequest = z.infer<typeof EnrollmentRequestSchema>;

/**
 * 수강신청 응답
 */
export const EnrollmentResponseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  course_id: z.string().uuid(),
  enrolled_at: z.string().datetime(),
  status: z.enum(['active', 'completed', 'dropped']),
});

export type EnrollmentResponse = z.infer<typeof EnrollmentResponseSchema>;
