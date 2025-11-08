import { useQuery } from '@tanstack/react-query';
import { InstructorDashboardResponseSchema } from '@/features/dashboard/backend/instructor-schema';

export const useInstructorDashboardQuery = () => {
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

      return parsed.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};