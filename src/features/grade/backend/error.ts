export const gradeErrorCodes = {
  GRADES_FETCH_ERROR: 'GRADES_FETCH_ERROR',
  GRADES_VALIDATION_ERROR: 'GRADES_VALIDATION_ERROR',
  GRADES_NOT_FOUND: 'GRADES_NOT_FOUND',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

export type GradeErrorCode = keyof typeof gradeErrorCodes;

export type GradeServiceError = {
  code: typeof gradeErrorCodes[GradeErrorCode];
  message: string;
};