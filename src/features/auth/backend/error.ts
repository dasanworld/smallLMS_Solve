// src/features/auth/backend/error.ts

export const signupErrorCodes = {
  validationError: 'SIGNUP_VALIDATION_ERROR',
  termsNotAgreed: 'TERMS_NOT_AGREED',
  authCreationError: 'AUTH_CREATION_ERROR',
  userAlreadyExists: 'USER_ALREADY_EXISTS',
  missingUserId: 'MISSING_USER_ID',
  profileCreationError: 'PROFILE_CREATION_ERROR',
  termsAgreementError: 'TERMS_AGREEMENT_ERROR',
} as const;

export type SignupErrorCode = keyof typeof signupErrorCodes;

export type SignupServiceError = {
  code: SignupErrorCode;
  message: string;
};