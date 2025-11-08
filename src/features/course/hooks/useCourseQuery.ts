// src/features/course/hooks/useCourseQuery.ts

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { Course } from '../lib/dto';

export const useCourseQuery = (courseId: string) => {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const response = await apiClient.get<Course>(`/api/courses/${courseId}`);
      return response.data;
    },
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};