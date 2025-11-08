import { z } from 'zod';

// Report filtering schema
export const getReportsRequestSchema = z.object({
  type: z.enum(['course', 'assignment', 'submission', 'user']).optional(),
  status: z.enum(['received', 'investigating', 'resolved']).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
});

// Report status update schema
export const updateReportStatusRequestSchema = z.object({
  newStatus: z.enum(['received', 'investigating', 'resolved']),
});

// Administrative action schema
export const takeReportActionRequestSchema = z.object({
  action: z.enum(['resolve', 'escalate', 'dismiss', 'contact_user']),
  notes: z.string().optional(),
});

// Metadata creation/update schema
export const createCategoryRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const createDifficultyRequestSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  sort_order: z.number().int().optional().default(0),
});

export const updateCategoryRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const updateDifficultyRequestSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(500).optional(),
  sort_order: z.number().int().optional(),
});

// Report response schema
export const reportSchema = z.object({
  id: z.string().uuid(),
  reporter_id: z.string().uuid(),
  target_type: z.enum(['course', 'assignment', 'submission', 'user']),
  target_id: z.string().uuid(),
  reason: z.string().max(100),
  content: z.string().max(1000),
  status: z.enum(['received', 'investigating', 'resolved']),
  resolved_at: z.string().datetime().nullable().optional(),
  resolved_by: z.string().uuid().nullable().optional(),
  created_at: z.string().datetime(),
});

// Category response schema
export const categorySchema = z.object({
  id: z.number().int(),
  name: z.string().max(100),
  description: z.string().max(500).optional(),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Difficulty response schema
export const difficultySchema = z.object({
  id: z.number().int(),
  name: z.string().max(50),
  description: z.string().max(500).optional(),
  sort_order: z.number().int(),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Input validation schemas for all operator operations
export const operatorSchemas = {
  getReportsRequest: getReportsRequestSchema,
  updateReportStatusRequest: updateReportStatusRequestSchema,
  takeReportActionRequest: takeReportActionRequestSchema,
  createCategoryRequest: createCategoryRequestSchema,
  createDifficultyRequest: createDifficultyRequestSchema,
  updateCategoryRequest: updateCategoryRequestSchema,
  updateDifficultyRequest: updateDifficultyRequestSchema,
  report: reportSchema,
  category: categorySchema,
  difficulty: difficultySchema,
} as const;