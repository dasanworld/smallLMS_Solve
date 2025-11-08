import { z } from 'zod';

// Grade response schema
export const GradeAssignmentSchema = z.object({
  id: z.string(), // submission ID
  assignmentId: z.string(),
  assignmentTitle: z.string(),
  assignmentDescription: z.string(),
  courseId: z.string(),
  courseTitle: z.string(),
  score: z.number().min(0).max(100).nullable(),
  feedback: z.string().nullable(),
  gradedAt: z.string().nullable(), // ISO date string
  isLate: z.boolean(),
  isResubmission: z.boolean(),
  status: z.enum(['submitted', 'graded', 'resubmission_required']),
  pointsWeight: z.number().min(0).max(100) // Assignment weight percentage
});

// Course total schema
export const CourseTotalSchema = z.object({
  courseId: z.string(),
  courseTitle: z.string(),
  totalScore: z.number().min(0).max(100).nullable(), // Calculated based on weighted scores
  assignmentsCount: z.number(),
  gradedCount: z.number()
});

// Main grade response schema
export const GradeResponseSchema = z.object({
  assignments: z.array(GradeAssignmentSchema),
  courseTotals: z.array(CourseTotalSchema)
});

// Request schema for query parameters
export const GetGradesRequestSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  courseId: z.string().optional()
});