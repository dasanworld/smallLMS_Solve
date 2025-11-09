// src/features/course/hooks/useDeleteCourseMutation.ts

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { Course } from '../lib/dto';

export const useDeleteCourseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await apiClient.delete<Course>(`/api/courses/${courseId}`);
      return response.data;
    },
    onSuccess: (_, courseId) => {
      // Invalidate and refetch instructor courses
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
      // Also invalidate the specific course if it was being viewed
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });
};