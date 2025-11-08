export class AssignmentDetailError extends Error {
  public readonly code: string;
  public readonly details?: any;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.code = code;
    this.details = details;
    
    // Set the prototype explicitly to maintain instanceof behavior
    Object.setPrototypeOf(this, AssignmentDetailError.prototype);
  }
}

// Assignment detail related error codes
export const ASSIGNMENT_DETAIL_ERROR_CODES = {
  ASSIGNMENT_NOT_FOUND: 'ASSIGNMENT_NOT_FOUND',
  ASSIGNMENT_NOT_PUBLISHED: 'ASSIGNMENT_NOT_PUBLISHED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  ASSIGNMENT_CLOSED: 'ASSIGNMENT_CLOSED',
  INVALID_SUBMISSION_DATA: 'INVALID_SUBMISSION_DATA',
  SUBMISSION_ALREADY_EXISTS: 'SUBMISSION_ALREADY_EXISTS',
  SUBMISSION_NOT_FOUND: 'SUBMISSION_NOT_FOUND',
  SUBMISSION_DEADLINE_PASSED: 'SUBMISSION_DEADLINE_PASSED',
  STUDENT_NOT_ENROLLED: 'STUDENT_NOT_ENROLLED',
} as const;

export type AssignmentDetailErrorCode = keyof typeof ASSIGNMENT_DETAIL_ERROR_CODES;