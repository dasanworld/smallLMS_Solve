import { z } from 'zod';

// Common validation schemas
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// UUID validation schema
export const uuidSchema = z
  .string()
  .regex(UUID_REGEX, { message: 'Invalid UUID format' });

// Pagination schema
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(['created_at', 'updated_at', 'title', 'name', 'enrollment_count']).optional(),
  order: z.enum(['asc', 'desc']).default('desc')
});

// Common validation schemas
export const emailSchema = z.string().min(1, { message: 'Email is required' });

export const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters long' })
  .max(128, { message: 'Password must be at most 128 characters long' });

export const nameSchema = z
  .string()
  .min(1, { message: 'Name is required' })
  .max(100, { message: 'Name must be at most 100 characters long' });

export const titleSchema = z
  .string()
  .min(1, { message: 'Title is required' })
  .max(200, { message: 'Title must be at most 200 characters long' });

export const descriptionSchema = z
  .string()
  .max(5000, { message: 'Description must be at most 5000 characters long' })
  .optional()
  .or(z.literal(''));

// Role validation schema
export const roleSchema = z.enum(['admin', 'instructor', 'learner']);

// Course related schemas
export const courseIdSchema = uuidSchema;
export const assignmentIdSchema = uuidSchema;
export const submissionIdSchema = uuidSchema;
export const userIdSchema = uuidSchema;

// Assignment weight validation (0 to 1 inclusive)
export const assignmentWeightSchema = z
  .number()
  .min(0, { message: 'Weight must be between 0 and 1' })
  .max(1, { message: 'Weight must be between 0 and 1' });

// Grade validation (0 to 100)
export const gradeSchema = z
  .number()
  .min(0, { message: 'Grade must be between 0 and 100' })
  .max(100, { message: 'Grade must be between 0 and 100' });

// Date validation
export const dateSchema = z.string().datetime({ message: 'Invalid date format' });

// Boolean validation
export const booleanSchema = z
  .union([z.literal('true'), z.literal('false'), z.boolean()])
  .transform((val) => val === true || val === 'true');

// Validation middleware helper
export const validateWithSchema = <T extends z.ZodSchema<any>>(schema: T) => {
  return async (data: z.infer<T>) => {
    try {
      return { success: true, data: schema.parse(data) } as const;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        } as const;
      }
      throw error;
    }
  };
};

// Common validation functions
export const isValidUUID = (id: string): boolean => {
  return UUID_REGEX.test(id);
};

export const validatePaginationParams = (params: unknown) => {
  return paginationSchema.safeParse(params);
};

export const validateEmail = (email: string) => {
  return emailSchema.safeParse(email);
};

export const validatePassword = (password: string) => {
  return passwordSchema.safeParse(password);
};

// Export all schemas for easy import
export const schemas = {
  uuid: uuidSchema,
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  title: titleSchema,
  description: descriptionSchema,
  role: roleSchema,
  courseId: courseIdSchema,
  assignmentId: assignmentIdSchema,
  submissionId: submissionIdSchema,
  userId: userIdSchema,
  assignmentWeight: assignmentWeightSchema,
  grade: gradeSchema,
  date: dateSchema,
  boolean: booleanSchema,
  pagination: paginationSchema,
};

// Type exports
export type { z };
export type PaginationParams = z.infer<typeof paginationSchema>;
export type Role = z.infer<typeof roleSchema>;