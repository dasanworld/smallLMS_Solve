import { useQuery } from '@tanstack/react-query';
import { GradeResponse, GetGradesRequest } from '../lib/dto';

const fetchGrades = async (params: GetGradesRequest = {}): Promise<GradeResponse> => {
  const { limit, offset, courseId } = params;
  
  const queryParams = new URLSearchParams();
  
  if (limit !== undefined) queryParams.append('limit', limit.toString());
  if (offset !== undefined) queryParams.append('offset', offset.toString());
  if (courseId) queryParams.append('courseId', courseId);
  
  const response = await fetch(`/api/grades?${queryParams.toString()}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch grades: ${response.status}`);
  }
  
  const data = await response.json();
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