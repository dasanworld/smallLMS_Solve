// src/features/course/hooks/useUpdateCourseMutation.ts

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { Course } from '../lib/dto';

type UpdateCourseRequest = {
  title?: string;
  description?: string;
  category_id?: number | null;
  difficulty_id?: number | null;
};

export const useUpdateCourseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, data }: { courseId: string; data: UpdateCourseRequest }) => {
      const response = await apiClient.put<Course>(`/api/courses/${courseId}`, data);
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