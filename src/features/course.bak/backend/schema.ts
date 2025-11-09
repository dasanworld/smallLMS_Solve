import { z } from 'zod';

// Course query filters schema
export const getPublishedCoursesRequestSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(), // Only 'published' by default
  category_id: z.string().optional(),
  difficulty_id: z.string().optional(),
  sort: z.enum(['newest', 'popular']).optional().default('newest'),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
});

// Course response schema
export const courseSchema = z.object({
  id: z.string().uuid(),
  owner_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  category_id: z.number().nullable(),
  difficulty_id: z.number().nullable(),
  status: z.enum(['draft', 'published', 'archived']),
  enrollment_count: z.number().default(0),
  created_at: z.string(),
  updated_at: z.string(),
  published_at: z.string().nullable(),
  archived_at: z.string().nullable(),
  category_name: z.string().nullable(),
  difficulty_name: z.string().nullable(),
});

export type Course = z.infer<typeof courseSchema>;

// Course list response schema
export const getPublishedCoursesResponseSchema = z.object({
  courses: z.array(courseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

// Create course request schema
export const createCourseRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  category_id: z.number().nullable(),
  difficulty_id: z.number().nullable(),
});

// Update course request schema
export const updateCourseRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255).optional(),
  description: z.string().optional(),
  category_id: z.number().nullable().optional(),
  difficulty_id: z.number().nullable().optional(),
});

// Update course status request schema
export const updateCourseStatusRequestSchema = z.object({
  status: z.enum(['draft', 'published', 'archived']),
});

// Course list response schema for instructor
export const getInstructorCoursesResponseSchema = z.object({
  courses: z.array(courseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

// Enrollment request schema
export const createEnrollmentRequestSchema = z.object({
  course_id: z.string().uuid(),
});

// Enrollment response schema
export const enrollmentSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  course_id: z.string().uuid(),
  enrolled_at: z.string(),
  status: z.enum(['active', 'cancelled']),
});

export type Enrollment = z.infer<typeof enrollmentSchema>;

export const enrollmentStatusSchema = z.object({
  isEnrolled: z.boolean(),
  enrollment: enrollmentSchema.optional(),
});

export type EnrollmentStatus = z.infer<typeof enrollmentStatusSchema>;

export const createEnrollmentResponseSchema = enrollmentSchema;
export const cancelEnrollmentResponseSchema = enrollmentSchema;
export const checkEnrollmentStatusResponseSchema = enrollmentStatusSchema;