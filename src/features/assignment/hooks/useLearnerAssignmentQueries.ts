'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { AssignmentResponse } from '../backend/schema';

export const useLearnerAssignmentQueryKeys = {
  all: ['learner-assignments'] as const,
  course: (courseId: string) => [...useLearnerAssignmentQueryKeys.all, 'course', courseId] as const,
  detail: (assignmentId: string) => [...useLearnerAssignmentQueryKeys.all, 'detail', assignmentId] as const,
};

/**
 * 학습자의 등록 코스 할당 목록 조회
 * - 학습자가 수강신청한 코스의 할당만 조회
 * - 읽기 전용
 */
export const useLearnerCourseAssignmentsQuery = (courseId: string) => {
  return useQuery({
    queryKey: useLearnerAssignmentQueryKeys.course(courseId),
    queryFn: async () => {
      const response = await apiClient.get<{ assignments: AssignmentResponse[] }>(
        `/api/courses/${courseId}/assignments`
      );
      return response.data.assignments;
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

/**
 * 할당 상세 조회
 */
export const useLearnerAssignmentDetailQuery = (courseId: string, assignmentId: string) => {
  return useQuery({
    queryKey: useLearnerAssignmentQueryKeys.detail(assignmentId),
    queryFn: async () => {
      const response = await apiClient.get<AssignmentResponse>(
        `/api/courses/${courseId}/assignments/${assignmentId}`
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};
