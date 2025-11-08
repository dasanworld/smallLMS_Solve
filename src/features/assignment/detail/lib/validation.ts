import { z } from 'zod';

// Zod schema for assignment submission form
export const assignmentSubmissionSchema = z.object({
  content: z
    .string()
    .min(1, { message: 'Content is required' })
    .max(5000, { message: 'Content must be less than 5000 characters' }),
  link: z
    .string()
    .url({ message: 'Link must be a valid URL' })
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
});

// Export the type for TypeScript
export type AssignmentSubmissionFormValues = z.infer<typeof assignmentSubmissionSchema>;