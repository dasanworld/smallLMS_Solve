// Error codes for operator functionality
export const operatorErrorCodes = {
  REPORT_NOT_FOUND: 'REPORT_NOT_FOUND',
  INVALID_REPORT_STATUS_TRANSITION: 'INVALID_REPORT_STATUS_TRANSITION',
  INVALID_ADMIN_ACTION: 'INVALID_ADMIN_ACTION',
  METADATA_IN_USE: 'METADATA_IN_USE',
  OPERATOR_PERMISSION_DENIED: 'OPERATOR_PERMISSION_DENIED',
} as const;

export type OperatorErrorCode = keyof typeof operatorErrorCodes;