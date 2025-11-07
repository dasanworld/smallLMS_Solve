// src/features/auth/backend/error.ts

export const signupErrorCodes = {
  SIGNUP_VALIDATION_ERROR: 'SIGNUP_VALIDATION_ERROR',
  TERMS_NOT_AGREED: 'TERMS_NOT_AGREED',
  AUTH_CREATION_ERROR: 'AUTH_CREATION_ERROR',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  MISSING_USER_ID: 'MISSING_USER_ID',
  PROFILE_CREATION_ERROR: 'PROFILE_CREATION_ERROR',
  TERMS_AGREEMENT_ERROR: 'TERMS_AGREEMENT_ERROR',
} as const;

export type SignupErrorCode = keyof typeof signupErrorCodes;

export type SignupServiceError = {
  code: typeof signupErrorCodes[SignupErrorCode];
  message: string;
};