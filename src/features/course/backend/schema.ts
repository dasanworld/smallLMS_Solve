import { z } from 'zod';

// 기존 코스 조회 응답
export const CourseSchema = z.object({
  id: z.string().uuid(),
  owner_id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  category_id: z.number().nullable(),
  difficulty_id: z.number().nullable(),
  status: z.enum(['draft', 'published', 'archived']),
  enrollment_count: z.number().default(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  published_at: z.string().datetime().nullable(),
  archived_at: z.string().datetime().nullable(),
  deleted_at: z.string().datetime().nullable(),
});

export type Course = z.infer<typeof CourseSchema>;

// 코스 생성 요청
export const CreateCourseRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less'),
  description: z.string().max(2000, 'Description must be 2000 characters or less').optional(),
  category_id: z.number().nullable().optional(),
  difficulty_id: z.number().nullable().optional(),
});

export type CreateCourseRequest = z.infer<typeof CreateCourseRequestSchema>;

// 코스 수정 요청
export const UpdateCourseRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less').optional(),
  description: z.string().max(2000, 'Description must be 2000 characters or less').nullable().optional(),
  category_id: z.number().nullable().optional(),
  difficulty_id: z.number().nullable().optional(),
});

export type UpdateCourseRequest = z.infer<typeof UpdateCourseRequestSchema>;

// 코스 상태 변경 요청
export const UpdateCourseStatusRequestSchema = z.object({
  status: z.enum(['draft', 'published', 'archived'], {
    errorMap: () => ({ message: 'Invalid status. Must be draft, published, or archived' }),
  }),
});

export type UpdateCourseStatusRequest = z.infer<typeof UpdateCourseStatusRequestSchema>;

// 카테고리 및 난이도 조회용 스키마
export const CategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  is_active: z.boolean(),
});

export type Category = z.infer<typeof CategorySchema>;

export const DifficultySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  is_active: z.boolean(),
});

export type Difficulty = z.infer<typeof DifficultySchema>;

// 강사의 코스 목록 조회 응답
export const InstructorCoursesResponseSchema = z.object({
  courses: z.array(CourseSchema),
});

export type InstructorCoursesResponse = z.infer<typeof InstructorCoursesResponseSchema>;

// 코스 상세 조회 응답 (카테고리, 난이도 정보 포함)
export const CourseDetailResponseSchema = CourseSchema.extend({
  category: CategorySchema.nullable(),
  difficulty: DifficultySchema.nullable(),
});

export type CourseDetailResponse = z.infer<typeof CourseDetailResponseSchema>;
