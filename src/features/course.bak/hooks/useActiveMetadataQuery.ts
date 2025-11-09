// src/features/course/hooks/useActiveMetadataQuery.ts

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';

type MetadataResponse = {
  categories: Array<{ id: number; name: string; description: string | null }>;
  difficulties: Array<{ id: number; name: string; description: string | null; sort_order: number }>;
};

export const useActiveMetadataQuery = () => {
  return useQuery({
    queryKey: ['active-metadata'],
    queryFn: async () => {
      const response = await apiClient.get<MetadataResponse>('/api/metadata/active');
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};