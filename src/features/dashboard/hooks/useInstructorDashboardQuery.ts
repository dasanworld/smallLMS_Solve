import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { InstructorDashboardResponseSchema, type InstructorDashboardResponse } from '@/features/dashboard/backend/instructor-schema';

export const useInstructorDashboardQuery = <T extends InstructorDashboardResponse = InstructorDashboardResponse>(): UseQueryResult<T> => {
  return useQuery({
    queryKey: ['instructor-dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/instructor', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Validate response with Zod schema
      const parsed = InstructorDashboardResponseSchema.safeParse(data);
      if (!parsed.success) {
        console.error('Instructor dashboard response validation failed:', parsed.error);
        throw new Error('Invalid dashboard data format');
      }

      return parsed.data as T;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  }) as UseQueryResult<T>;
};