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
        courseId: data.courseId,
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
          const responseData = error.response?.data;
          console.error('❌ Axios Error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            message: responseData?.error || error.message,
            details: responseData?.details,
            fullData: responseData,
            config: {
              method: error.config?.method,
              url: error.config?.url,
            },
          });
          
          // 사용자 친화적 에러 메시지 생성
          let userMessage = error.response?.status === 400 
            ? (responseData?.error || '입력 데이터가 유효하지 않습니다')
            : `요청 실패: ${error.response?.statusText || error.message}`;
          
          if (responseData?.details && Array.isArray(responseData.details)) {
            const details = responseData.details.map((d: any) => 
              `${d.path}: ${d.message}`
            ).join(', ');
            userMessage += ` (${details})`;
          }
          
          console.error('❌ User-friendly error:', userMessage);
          
          // 에러에 사용자 메시지 추가
          const errorWithMessage = new Error(userMessage);
          throw errorWithMessage;
        } else {
          console.error('❌ Non-Axios Error:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
          });
          throw error;
        }
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
      console.error('❌ Assignment creation error:', error.message);
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

