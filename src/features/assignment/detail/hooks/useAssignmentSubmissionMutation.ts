import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AssignmentSubmissionRequest, AssignmentSubmissionResponse } from '../lib/dto';
import { getAssignmentDetailQueryKey } from './useAssignmentDetailQuery';

// Define the submit function
const submitAssignment = async ({
  assignmentId,
  submissionData
}: {
  assignmentId: string;
  submissionData: AssignmentSubmissionRequest;
}): Promise<AssignmentSubmissionResponse> => {
  const response = await fetch(`/api/assignments/${assignmentId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(submissionData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to submit assignment');
  }

  return response.json();
};

// Define the custom hook
export const useAssignmentSubmissionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<AssignmentSubmissionResponse, Error, { assignmentId: string; submissionData: AssignmentSubmissionRequest }>({
    mutationFn: submitAssignment,
    onSuccess: (data, variables) => {
      // Invalidate and refetch the assignment detail query to update the UI
      queryClient.invalidateQueries({ queryKey: getAssignmentDetailQueryKey(variables.assignmentId) });
    },
  });
};