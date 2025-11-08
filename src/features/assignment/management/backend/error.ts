// Assignment Management Error Codes
export const ASSIGNMENT_MANAGEMENT_ERROR_CODES = {
  ASSIGNMENT_WEIGHT_EXCEEDED: "ASSIGNMENT_WEIGHT_EXCEEDED",
  ASSIGNMENT_PAST_DEADLINE: "ASSIGNMENT_PAST_DEADLINE",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  ASSIGNMENT_NOT_FOUND: "ASSIGNMENT_NOT_FOUND",
  COURSE_NOT_FOUND: "COURSE_NOT_FOUND",
  SUBMISSION_NOT_FOUND: "SUBMISSION_NOT_FOUND",
  ASSIGNMENT_CLOSED: "ASSSIGNMENT_CLOSED",
} as const;

export type AssignmentManagementErrorCode = keyof typeof ASSIGNMENT_MANAGEMENT_ERROR_CODES;

// Custom error class for assignment management errors
export class AssignmentManagementError extends Error {
  code: AssignmentManagementErrorCode;
  constructor(message: string, code: AssignmentManagementErrorCode) {
    super(message);
    this.name = "AssignmentManagementError";
    this.code = code;
  }
}

// Submission-specific error codes
export const SUBMISSION_MANAGEMENT_ERROR_CODES = {
  ...ASSIGNMENT_MANAGEMENT_ERROR_CODES,
  SUBMISSION_NOT_FOUND: "SUBMISSION_NOT_FOUND",
  ASSIGNMENT_CLOSED: "ASSIGNMENT_CLOSED",
} as const;

export type SubmissionManagementErrorCode = keyof typeof SUBMISSION_MANAGEMENT_ERROR_CODES;

// Custom error class for submission management errors
export class SubmissionManagementError extends Error {
  code: SubmissionManagementErrorCode;
  constructor(message: string, code: SubmissionManagementErrorCode) {
    super(message);
    this.name = "SubmissionManagementError";
    this.code = code;
  }
}