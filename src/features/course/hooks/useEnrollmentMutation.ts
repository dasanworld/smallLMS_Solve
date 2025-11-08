// src/features/course/hooks/useEnrollmentMutation.ts

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { Enrollment } from '../lib/dto';

type CreateEnrollmentVariables = {
  course_id: string;
};

type CancelEnrollmentVariables = {
  enrollmentId: string;
};

export const useEnrollmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<Enrollment, Error, CreateEnrollmentVariables | CancelEnrollmentVariables>({
    mutationFn: async (variables) => {
      if ('course_id' in variables) {
        // This is a create enrollment request
        const response = await apiClient.post<Enrollment>('/api/enrollments', {
          course_id: variables.course_id,
        });
        return response.data;
      } else {
        // This is a cancel enrollment request
        const response = await apiClient.delete<Enrollment>(`/api/enrollments/${variables.enrollmentId}`);
        return response.data;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment-status'] });
    },
  });
};