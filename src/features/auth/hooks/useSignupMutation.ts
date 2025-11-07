// src/features/auth/hooks/useSignupMutation.ts

'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { extractApiErrorMessage } from '@/lib/remote/api-client';
import { SignupResponse } from '../lib/dto';

type SignupVariables = {
  email: string;
  password: string;
  confirmPassword: string;
  role: 'learner' | 'instructor';
  name: string;
  phone: string;
  termsAgreed: boolean;
};

export const useSignupMutation = () => {
  return useMutation<SignupResponse, Error, SignupVariables>({
    mutationFn: async (signupData) => {
      const response = await apiClient.post<SignupResponse>('/api/auth/signup', signupData);
      return response.data;
    },
    onError: (error) => {
      console.error('Signup error:', error);
    },
  });
};