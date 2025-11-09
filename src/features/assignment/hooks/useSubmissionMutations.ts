/**
 * 제출물 관리 Mutations Hook
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type {
  GradeSubmissionRequest,
  SubmissionResponse,
} from '../backend/schema';

/**
 * 제출물 채점 Mutation Hook
 */
export const useGradeSubmissionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: GradeSubmissionRequest) => {
      const response = await apiClient.patch<SubmissionResponse>(
        `/api/submissions/${data.submissionId}/grade`,
        {
          score: data.score,
          feedback: data.feedback,
          status: data.status,
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      // 제출물 캐시 업데이트
      queryClient.invalidateQueries({
        queryKey: ['submission', data.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['assignment-submissions', data.assignmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['submission-stats', data.assignmentId],
      });
    },
  });
};

