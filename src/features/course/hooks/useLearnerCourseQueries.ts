'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { AvailableCoursesResponse, LearnerCourse } from '../backend/learner-schema';

export const useLearnerCourseQueryKeys = {
  all: ['learner-courses'] as const,
  available: () => [...useLearnerCourseQueryKeys.all, 'available'] as const,
  available_paginated: (page: number, pageSize: number) =>
    [...useLearnerCourseQueryKeys.available(), { page, pageSize }] as const,
  enrolled: () => [...useLearnerCourseQueryKeys.all, 'enrolled'] as const,
};

/**
 * 이용 가능한 (공개된) 코스 목록 조회
 * - 학습자가 아직 수강신청하지 않은 모든 공개 코스
 */
export const useAvailableCoursesQuery = (page: number = 1, pageSize: number = 10) => {
  return useQuery({
    queryKey: useLearnerCourseQueryKeys.available_paginated(page, pageSize),
    queryFn: async () => {
      const response = await apiClient.get<AvailableCoursesResponse>(
        '/api/learner/courses/available',
        {
          params: { page, pageSize },
        }
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

/**
 * 학습자의 수강신청한 코스 목록 조회
 */
export const useEnrolledCoursesQuery = () => {
  return useQuery({
    queryKey: useLearnerCourseQueryKeys.enrolled(),
    queryFn: async () => {
      const response = await apiClient.get<{ courses: LearnerCourse[] }>(
        '/api/learner/courses/enrolled'
      );
      return response.data.courses;
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

/**
 * 코스 수강신청
 */
export const useEnrollCourseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await apiClient.post<{ success: boolean }>(
        `/api/learner/courses/${courseId}/enroll`
      );
      return response.data;
    },
    onSuccess: () => {
      // 이용 가능한 코스 목록 무효화
      queryClient.invalidateQueries({
        queryKey: useLearnerCourseQueryKeys.available(),
      });
      // 수강신청한 코스 목록 무효화
      queryClient.invalidateQueries({
        queryKey: useLearnerCourseQueryKeys.enrolled(),
      });
    },
  });
};

/**
 * 수강신청 취소
 */
export const useUnenrollCourseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await apiClient.delete<{ success: boolean }>(
        `/api/learner/courses/${courseId}/enroll`
      );
      return response.data;
    },
    onSuccess: () => {
      // 이용 가능한 코스 목록 무효화
      queryClient.invalidateQueries({
        queryKey: useLearnerCourseQueryKeys.available(),
      });
      // 수강신청한 코스 목록 무효화
      queryClient.invalidateQueries({
        queryKey: useLearnerCourseQueryKeys.enrolled(),
      });
    },
  });
};
