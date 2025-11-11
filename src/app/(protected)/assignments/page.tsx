'use client';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { type UserProfileResponse } from '@/features/auth/lib/dto';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { InstructorAllAssignmentsPage } from '@/features/assignment/components/InstructorAllAssignmentsPage';

const fetchUserProfile = async () => {
  try {
    const { data } = await apiClient.get('/api/auth/profile');
    return data;
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to fetch user profile.');
    throw new Error(message);
  }
};

/**
 * 과제 대시보드 페이지
 * - 강사: 모든 코스의 과제 목록 (InstructorAllAssignmentsPage)
 * - 학생: 접근 불가
 */
export default function AssignmentsPage() {
  const { user, isLoading: isAuthLoading } = useCurrentUser();

  const {
    data: userProfile,
    isLoading: isProfileLoading,
    isError: isProfileError
  } = useQuery<UserProfileResponse>({
    queryKey: ['user-profile', user?.id],
    queryFn: () => fetchUserProfile(),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = isAuthLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">로딩 중...</span>
        </div>
      </div>
    );
  }

  if (isProfileError || !userProfile) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="flex items-center justify-center py-12 text-red-600">
            <p>사용자 정보를 불러올 수 없습니다</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 강사만 접근 가능
  if (userProfile.role !== 'instructor') {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="flex items-center justify-center py-12 text-red-600">
            <p>이 페이지는 강사 전용입니다</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <InstructorAllAssignmentsPage />
    </div>
  );
}
