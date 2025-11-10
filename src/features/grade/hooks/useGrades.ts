import { useQuery } from '@tanstack/react-query';
import { GradeResponse, GetGradesRequest } from '../lib/dto';
import { apiClient } from '@/lib/remote/api-client';

const fetchGrades = async (params: GetGradesRequest = {}): Promise<GradeResponse> => {
  const { limit, offset, courseId } = params;

  const queryParams = new URLSearchParams();

  if (limit !== undefined) queryParams.append('limit', limit.toString());
  if (offset !== undefined) queryParams.append('offset', offset.toString());
  if (courseId) queryParams.append('courseId', courseId);

  const { data } = await apiClient.get<{ data: GradeResponse }>(
    `/api/grades?${queryParams.toString()}`
  );

  return data.data;
};

export const useGrades = (params: GetGradesRequest = {}) => {
  return useQuery<GradeResponse, Error>({
    queryKey: ['grades', params],
    queryFn: () => fetchGrades(params),
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};