'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { Course, CreateCourseRequest, UpdateCourseRequest, UpdateCourseStatusRequest, CourseDetailResponse } from '../backend/schema';

export const useCourseQueryKeys = {
  all: ['courses'] as const,
  my: ['courses', 'my'] as const,
  detail: (id: string) => ['courses', id] as const,
  metadata: ['courses', 'metadata'] as const,
};

/**
 * 강사의 코스 목록 조회
 */
export const useInstructorCoursesQuery = () => {
  return useQuery({
    queryKey: useCourseQueryKeys.my,
    queryFn: async () => {
      const response = await apiClient.get<{ courses: Course[] }>('/api/courses/my');
      return response.data.courses;
    },
  });
};

/**
 * 코스 상세 조회
 */
export const useCourseDetailQuery = (courseId: string) => {
  return useQuery({
    queryKey: useCourseQueryKeys.detail(courseId),
    queryFn: async () => {
      const response = await apiClient.get<CourseDetailResponse>(`/api/courses/${courseId}`);
      return response.data;
    },
  });
};

/**
 * 카테고리 및 난이도 조회
 */
export const useCourseMetadataQuery = () => {
  return useQuery({
    queryKey: useCourseQueryKeys.metadata,
    queryFn: async () => {
      const response = await apiClient.get<{
        categories: Array<{ id: number; name: string }>;
        difficulties: Array<{ id: number; name: string }>;
      }>('/api/courses/metadata/options');
      return response.data;
    },
  });
};

/**
 * 새 코스 생성
 */
export const useCreateCourseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCourseRequest) => {
      const response = await apiClient.post<Course>('/api/courses', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: useCourseQueryKeys.my });
    },
  });
};

/**
 * 코스 정보 수정
 */
export const useUpdateCourseMutation = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateCourseRequest) => {
      const response = await apiClient.put<Course>(`/api/courses/${courseId}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: useCourseQueryKeys.my });
      queryClient.invalidateQueries({ queryKey: useCourseQueryKeys.detail(courseId) });
    },
  });
};

/**
 * 코스 상태 변경
 */
export const useUpdateCourseStatusMutation = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateCourseStatusRequest) => {
      const response = await apiClient.patch<Course>(`/api/courses/${courseId}/status`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: useCourseQueryKeys.my });
      queryClient.invalidateQueries({ queryKey: useCourseQueryKeys.detail(courseId) });
    },
  });
};

/**
 * 코스 삭제
 */
export const useDeleteCourseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await apiClient.delete<{ id: string }>(`/api/courses/${courseId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: useCourseQueryKeys.my });
    },
  });
};
