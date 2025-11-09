import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { InstructorDashboardResponseSchema, type InstructorDashboardResponse } from '@/features/dashboard/backend/instructor-schema';

export const useInstructorDashboardQuery = <T extends InstructorDashboardResponse = InstructorDashboardResponse>(): UseQueryResult<T> => {
  return useQuery({
    queryKey: ['instructor-dashboard'],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get('/api/dashboard/instructor');

        // Validate response with Zod schema
        const parsed = InstructorDashboardResponseSchema.safeParse(data);
        if (!parsed.success) {
          console.error('Instructor dashboard response validation failed:', parsed.error);
          throw new Error('Invalid dashboard data format');
        }

        return parsed.data as T;
      } catch (error) {
        const message = extractApiErrorMessage(error, 'Failed to fetch instructor dashboard data.');
        throw new Error(message);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  }) as UseQueryResult<T>;
};