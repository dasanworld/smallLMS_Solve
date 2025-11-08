// Error codes for assignment submission operations
export const submissionErrorCodes = {
  ASSIGNMENT_NOT_FOUND: 'ASSIGNMENT_NOT_FOUND',
  ASSIGNMENT_CLOSED: 'ASSIGNMENT_CLOSED',
  SUBMISSION_PAST_DUE_DATE: 'SUBMISSION_PAST_DUE_DATE',
  INVALID_INPUT: 'INVALID_INPUT',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

// Type for error codes
export type SubmissionErrorCode = keyof typeof submissionErrorCodes;