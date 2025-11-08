// src/features/course/hooks/useCreateCourseMutation.ts

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { Course } from '../lib/dto';

type CreateCourseRequest = {
  title: string;
  description?: string;
  category_id?: number | null;
  difficulty_id?: number | null;
};

export const useCreateCourseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCourseRequest) => {
      const response = await apiClient.post<Course>('/api/courses', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch instructor courses
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
    },
  });
};