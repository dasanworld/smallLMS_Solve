import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AssignmentSubmissionRequest, AssignmentSubmissionResponse } from '../lib/dto';

interface SubmitAssignmentParams {
  assignmentId: string;
  data: AssignmentSubmissionRequest;
}

const submitAssignment = async ({ assignmentId, data }: SubmitAssignmentParams): Promise<AssignmentSubmissionResponse> => {
  const token = localStorage.getItem('sb-auth-token'); // Get token from local storage
  
  const response = await fetch(`/api/assignments/${assignmentId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, // Include token in header
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || '과제 제출에 실패했습니다.');
  }

  return response.json();
};

export const useAssignmentSubmissionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<AssignmentSubmissionResponse, Error, SubmitAssignmentParams>({
    mutationFn: submitAssignment,
    onSuccess: (data, variables) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['assignment', variables.assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['submissions', variables.assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['user-submissions'] });
      
      // Optionally show success toast notification
      console.log('Assignment submitted successfully:', data);
    },
    onError: (error) => {
      // Optionally show error toast notification
      console.error('Assignment submission error:', error.message);
      throw error;
    },
  });
};