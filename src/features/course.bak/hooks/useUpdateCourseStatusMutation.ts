// src/features/course/hooks/useUpdateCourseStatusMutation.ts

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { Course } from '../lib/dto';

type UpdateCourseStatusRequest = {
  status: 'draft' | 'published' | 'archived';
};

export const useUpdateCourseStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, data }: { courseId: string; data: UpdateCourseStatusRequest }) => {
      const response = await apiClient.patch<Course>(`/api/courses/${courseId}/status`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch the specific course
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      // Also invalidate the instructor courses list
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
    },
  });
};