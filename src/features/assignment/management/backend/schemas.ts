import { z } from "zod";

// Assignment schemas
export const createAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  due_date: z.string().datetime({ message: "Due date must be a valid datetime" }),
  points_weight: z.number()
    .min(0, "Points weight must be at least 0")
    .max(1, "Points weight cannot exceed 1 (100%)"),
  status: z.enum(["draft", "published", "closed"]).default("draft"),
  allow_late: z.boolean().default(false),
  allow_resubmission: z.boolean().default(false),
});

export const updateAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required").max(255).optional(),
  description: z.string().optional(),
  due_date: z.string().datetime({ message: "Due date must be a valid datetime" }).optional(),
  points_weight: z.number()
    .min(0, "Points weight must be at least 0")
    .max(1, "Points weight cannot exceed 1 (100%)")
    .optional(),
  status: z.enum(["draft", "published", "closed"]).optional(),
  allow_late: z.boolean().optional(),
  allow_resubmission: z.boolean().optional(),
});

export const updateAssignmentStatusSchema = z.object({
  status: z.enum(["draft", "published", "closed"]),
});

// Submission schemas
export const updateSubmissionStatusSchema = z.object({
  status: z.enum(["pending", "graded", "resubmission_required"]),
});

export const gradeSubmissionSchema = z.object({
  grade: z.number()
    .min(0, "Grade must be at least 0")
    .max(100, "Grade cannot exceed 100"),
  feedback: z.string().optional(),
});

export const submitAssignmentSchema = z.object({
  content: z.string().min(1, "Content is required"),
});

// Query parameter schemas
export const courseIdParamSchema = z.object({
  courseId: z.string().uuid("Course ID must be a valid UUID"),
});

export const assignmentIdParamSchema = z.object({
  assignmentId: z.string().uuid("Assignment ID must be a valid UUID"),
});

export const submissionIdParamSchema = z.object({
  submissionId: z.string().uuid("Submission ID must be a valid UUID"),
});