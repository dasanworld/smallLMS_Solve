'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { LearnerDashboardResponseSchema } from '@/features/dashboard/lib/dto';

const fetchLearnerDashboard = async () => {
  try {
    const { data } = await apiClient.get('/api/dashboard/learner');
    return LearnerDashboardResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to fetch dashboard data.');
    throw new Error(message);
  }
};

export const useLearnerDashboardQuery = () => {
  return useQuery({
    queryKey: ['learner-dashboard'],
    queryFn: () => fetchLearnerDashboard(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};