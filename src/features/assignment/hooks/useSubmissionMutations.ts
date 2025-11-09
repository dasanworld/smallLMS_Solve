/**
 * 제출물 관리 Mutations Hook
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type {
  GradeSubmissionRequest,
  SubmitAssignmentRequest,
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

/**
 * 과제 제출 Mutation Hook (러너용)
 */
export const useSubmitAssignmentMutation = (courseId: string, assignmentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SubmitAssignmentRequest) => {
      const response = await apiClient.post<SubmissionResponse>(
        `/api/courses/${courseId}/assignments/${assignmentId}/submit`,
        {
          content: data.content,
          link: data.link,
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      // 캐시 업데이트
      queryClient.invalidateQueries({
        queryKey: ['assignment', courseId, assignmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['user-submissions', courseId, assignmentId],
      });
    },
  });
};

