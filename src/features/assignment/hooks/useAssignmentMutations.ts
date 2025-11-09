/**
 * 과제 관리 Mutations Hook
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type {
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  UpdateAssignmentStatusRequest,
  AssignmentResponse,
} from '../backend/schema';

/**
 * 과제 생성 Mutation Hook
 */
export const useCreateAssignmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAssignmentRequest) => {
      const response = await apiClient.post<AssignmentResponse>(
        `/api/courses/${data.courseId}/assignments`,
        {
          title: data.title,
          description: data.description,
          dueDate: data.dueDate,
          pointsWeight: data.pointsWeight,
          allowLate: data.allowLate,
          allowResubmission: data.allowResubmission,
        }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      // 과제 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ['course-assignments', variables.courseId],
      });
    },
  });
};

/**
 * 과제 수정 Mutation Hook
 */
export const useUpdateAssignmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateAssignmentRequest) => {
      const { assignmentId, ...updateData } = data;
      const response = await apiClient.put<AssignmentResponse>(
        `/api/assignments/${assignmentId}`,
        updateData
      );
      return response.data;
    },
    onSuccess: (data) => {
      // 과제 캐시 업데이트
      queryClient.invalidateQueries({
        queryKey: ['assignment', data.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['course-assignments', data.courseId],
      });
    },
  });
};

/**
 * 과제 삭제 Mutation Hook
 */
export const useDeleteAssignmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      await apiClient.delete(`/api/assignments/${assignmentId}`);
    },
    onSuccess: (_, assignmentId) => {
      // 과제 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ['assignment', assignmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['course-assignments'],
      });
    },
  });
};

/**
 * 과제 상태 변경 Mutation Hook
 */
export const useUpdateAssignmentStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateAssignmentStatusRequest) => {
      const response = await apiClient.patch<AssignmentResponse>(
        `/api/assignments/${data.assignmentId}/status`,
        { status: data.status }
      );
      return response.data;
    },
    onSuccess: (data) => {
      // 과제 캐시 업데이트
      queryClient.invalidateQueries({
        queryKey: ['assignment', data.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['course-assignments', data.courseId],
      });
    },
  });
};

