// src/features/course/hooks/useInstructorCoursesQuery.ts

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { Course } from '../lib/dto';

type GetInstructorCoursesOptions = {
  search?: string;
  status?: 'draft' | 'published' | 'archived';
  category_id?: string;
  difficulty_id?: string;
  sort?: 'newest' | 'popular';
  page?: number;
  limit?: number;
};

export const useInstructorCoursesQuery = (options: GetInstructorCoursesOptions = {}) => {
  const { search, status, category_id, difficulty_id, sort, page, limit } = options;

  return useQuery({
    queryKey: ['instructor-courses', { search, status, category_id, difficulty_id, sort, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (category_id) params.append('category_id', category_id);
      if (difficulty_id) params.append('difficulty_id', difficulty_id);
      if (sort) params.append('sort', sort);
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());

      const response = await apiClient.get<{
        courses: Course[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/api/courses/my?${params.toString()}`);

      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};