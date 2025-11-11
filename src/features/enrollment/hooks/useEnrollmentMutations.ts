import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import type { EnrollmentResponse } from '../backend/schema';

/**
 * React Query 키 정의
 */
export const enrollmentQueryKeys = {
  all: ['enrollments'] as const,
  myEnrollments: ['enrollments', 'me'] as const,
  detail: (courseId: string) => ['enrollments', 'detail', courseId] as const,
};

/**
 * 수강신청 Mutation
 */
export const useCreateEnrollmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await apiClient.post<{ id: string; status: string }>(
        '/api/enrollments',
        { courseId }
      );
      return response.data;
    },
    onSuccess: () => {
      // 내 수강 코스 목록 재검증
      queryClient.invalidateQueries({
        queryKey: enrollmentQueryKeys.myEnrollments,
      });
    },
    onError: (error) => {
      const message = extractApiErrorMessage(error, '수강신청에 실패했습니다.');
    },
  });
};

/**
 * 수강취소 Mutation
 */
export const useCancelEnrollmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await apiClient.delete<{ status: string }>(
        `/api/enrollments/${courseId}`
      );
      return response.data;
    },
    onSuccess: () => {
      // 내 수강 코스 목록 재검증
      queryClient.invalidateQueries({
        queryKey: enrollmentQueryKeys.myEnrollments,
      });
    },
    onError: (error) => {
      const message = extractApiErrorMessage(error, '수강취소에 실패했습니다.');
    },
  });
};

/**
 * 내 수강 코스 목록 Query
 */
export const useMyEnrollmentsQuery = () => {
  return useQuery({
    queryKey: enrollmentQueryKeys.myEnrollments,
    queryFn: async () => {
      const response = await apiClient.get<{ enrollments: any[] }>(
        '/api/enrollments/me'
      );
      return response.data.enrollments;
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
};

/**
 * 특정 코스의 수강 여부 확인
 */
export const useIsEnrolled = (courseId: string) => {
  const { data: enrollments = [] } = useMyEnrollmentsQuery();
  return enrollments.some(
    (enrollment: any) =>
      enrollment.course_id === courseId && enrollment.status === 'active'
  );
};



