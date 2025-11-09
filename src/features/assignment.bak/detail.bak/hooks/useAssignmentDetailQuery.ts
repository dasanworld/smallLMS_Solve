import { useQuery } from '@tanstack/react-query';
import { AssignmentDetailResponse } from '../lib/dto';

// Define the query key for assignment detail
const getAssignmentDetailQueryKey = (assignmentId: string) => ['assignment-detail', assignmentId];

// Define the fetch function
const fetchAssignmentDetail = async (assignmentId: string): Promise<AssignmentDetailResponse> => {
  const response = await fetch(`/api/assignments/${assignmentId}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to fetch assignment detail');
  }
  
  return response.json();
};

// Define the custom hook
export const useAssignmentDetailQuery = (assignmentId: string) => {
  const result = useQuery({
    queryKey: getAssignmentDetailQueryKey(assignmentId),
    queryFn: () => fetchAssignmentDetail(assignmentId),
    enabled: !!assignmentId, // Only run the query if assignmentId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (cacheTime was renamed to gcTime in recent versions)
  });
  
  // Ensure the data is properly typed
  return {
    ...result,
    data: result.data as AssignmentDetailResponse | undefined,
  };
};

// Export the query key for potential external invalidation
export { getAssignmentDetailQueryKey };
