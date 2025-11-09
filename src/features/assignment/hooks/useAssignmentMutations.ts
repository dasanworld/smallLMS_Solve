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
      console.log('📝 Creating assignment with data:', data);
      
      const payload = {
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        pointsWeight: data.pointsWeight,
        allowLate: data.allowLate,
        allowResubmission: data.allowResubmission,
      };
      
      console.log('📤 API Request payload:', payload);
      console.log('📍 API Endpoint:', `/api/courses/${data.courseId}/assignments`);
      
      try {
        const response = await apiClient.post<{ data: AssignmentResponse }>(
          `/api/courses/${data.courseId}/assignments`,
          payload
        );
        console.log('✅ API response status:', response.status);
        console.log('✅ API response data:', response.data);
        console.log('✅ Assignment created:', response.data.data);
        return response.data.data;
      } catch (error: any) {
        console.error('❌ API call failed - error type:', typeof error, error.constructor.name);
        console.error('❌ API call failed - error itself:', error);
        
        // Axios 에러인 경우
        if (error.isAxiosError) {
          console.error('❌ Axios Error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            headers: error.response?.headers,
            config: {
              method: error.config?.method,
              url: error.config?.url,
              data: error.config?.data,
            },
          });
        } else {
          console.error('❌ Non-Axios Error:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
          });
        }
        
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      console.log('🔄 Invalidating cache for course:', variables.courseId);
      // 과제 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ['course-assignments', variables.courseId],
      });
    },
    onError: (error: any) => {
      console.error('❌ Assignment creation error - Full error object:', error);
      console.error('❌ Assignment creation error - Details:', {
        isAxiosError: error.isAxiosError,
        status: error.status || error.response?.status,
        statusText: error.statusText || error.response?.statusText,
        data: error.data || error.response?.data,
        config: error.config,
        message: error.message,
        toString: error.toString(),
        keys: Object.keys(error),
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

