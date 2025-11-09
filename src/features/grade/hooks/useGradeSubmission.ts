import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';

interface GradeSubmissionPayload {
  score: number;
  feedback: string;
  action: 'grade' | 'resubmission_required';
}

interface GradeSubmissionResponse {
  id: string;
  status: 'submitted' | 'graded' | 'resubmission_required';
  score: number | null;
  feedback: string | null;
}

export const useGradeSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { submissionId: string; data: GradeSubmissionPayload }) => {
      const response = await apiClient.put<GradeSubmissionResponse>(
        `/api/submissions/${params.submissionId}/grade`,
        params.data
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['submission', variables.submissionId] });
      queryClient.invalidateQueries({ queryKey: ['instructor-submissions'] });
    },
  });
};
