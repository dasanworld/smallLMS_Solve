import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { CreateAssignmentRequest, UpdateAssignmentRequest, AssignmentListResponse, AssignmentResponse } from '../backend/schema';

const assignmentQueryKeys = {
  all: ['assignments'] as const,
  lists: () => [...assignmentQueryKeys.all, 'list'] as const,
  list: (courseId: string) => [...assignmentQueryKeys.lists(), courseId] as const,
  details: () => [...assignmentQueryKeys.all, 'detail'] as const,
  detail: (assignmentId: string) => [...assignmentQueryKeys.details(), assignmentId] as const,
};

/**
 * 코스의 과제 목록 조회
 */
export const useCourseAssignmentsQuery = (courseId: string) => {
  return useQuery({
    queryKey: assignmentQueryKeys.list(courseId),
    queryFn: async () => {
      console.log(`[useCourseAssignmentsQuery] Fetching assignments for course: ${courseId}`);
      try {
        const response = await apiClient.get<AssignmentListResponse>(
          `/api/courses/${courseId}/assignments`
        );
        console.log(`[useCourseAssignmentsQuery] Success for course ${courseId}:`, response.data);
        return response.data;
      } catch (error) {
        console.error(`[useCourseAssignmentsQuery] Error for course ${courseId}:`, error);
        throw error;
      }
    },
    enabled: !!courseId,
  });
};

/**
 * 과제 상세 조회
 */
export const useAssignmentDetailQuery = (courseId: string, assignmentId: string) => {
  return useQuery({
    queryKey: assignmentQueryKeys.detail(assignmentId),
    queryFn: async () => {
      const response = await apiClient.get<AssignmentResponse>(
        `/api/courses/${courseId}/assignments/${assignmentId}`
      );
      return response.data;
    },
    enabled: !!courseId && !!assignmentId,
  });
};

/**
 * 과제 생성
 */
export const useCreateAssignmentMutation = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAssignmentRequest) => {
      const response = await apiClient.post<AssignmentResponse>(
        `/api/courses/${courseId}/assignments`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // 해당 코스의 과제 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: assignmentQueryKeys.list(courseId),
      });
    },
  });
};

/**
 * 과제 수정
 */
export const useUpdateAssignmentMutation = (courseId: string, assignmentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateAssignmentRequest) => {
      const response = await apiClient.put<AssignmentResponse>(
        `/api/courses/${courseId}/assignments/${assignmentId}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // 과제 목록과 상세 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: assignmentQueryKeys.list(courseId),
      });
      queryClient.invalidateQueries({
        queryKey: assignmentQueryKeys.detail(assignmentId),
      });
    },
  });
};

/**
 * 과제 삭제
 */
export const useDeleteAssignmentMutation = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const response = await apiClient.delete<AssignmentResponse>(
        `/api/courses/${courseId}/assignments/${assignmentId}`
      );
      return response.data;
    },
    onSuccess: () => {
      // 과제 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: assignmentQueryKeys.list(courseId),
      });
    },
  });
};
