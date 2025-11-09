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

export const authenticationErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EXPIRED_TOKEN: 'EXPIRED_TOKEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
} as const;

export type SignupErrorCode = keyof typeof signupErrorCodes;
export type AuthenticationErrorCode = keyof typeof authenticationErrorCodes;

export type SignupServiceError = {
  code: typeof signupErrorCodes[SignupErrorCode];
  message: string;
};

export type AuthenticationServiceError = {
  code: typeof authenticationErrorCodes[AuthenticationErrorCode];
  message: string;
};

export const AUTHENTICATION_ERROR = authenticationErrorCodes;