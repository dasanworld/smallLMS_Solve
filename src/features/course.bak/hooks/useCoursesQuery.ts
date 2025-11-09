// src/features/course/hooks/useCoursesQuery.ts

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { Course } from '../lib/dto';

type GetPublishedCoursesOptions = {
  search?: string;
  category_id?: string;
  difficulty_id?: string;
  sort?: 'newest' | 'popular';
  page?: number;
  limit?: number;
};

export const useCoursesQuery = (options: GetPublishedCoursesOptions = {}) => {
  const { search, category_id, difficulty_id, sort, page, limit } = options;
  
  return useQuery({
    queryKey: ['courses', { search, category_id, difficulty_id, sort, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (search) params.append('search', search);
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
      }>(`/api/courses?${params.toString()}`);
      
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};