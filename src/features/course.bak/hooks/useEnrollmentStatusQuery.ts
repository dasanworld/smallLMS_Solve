// src/features/course/hooks/useEnrollmentStatusQuery.ts

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { EnrollmentStatus } from '../lib/dto';

export const useEnrollmentStatusQuery = (courseId: string) => {
  return useQuery({
    queryKey: ['enrollment-status', courseId],
    queryFn: async () => {
      try {
        const response = await apiClient.get<EnrollmentStatus>(`/api/enrollments/status/${courseId}`);
        return response.data;
      } catch (error) {
        // If there's an error (e.g., network issue, unauthorized), return not enrolled
        return { isEnrolled: false };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};