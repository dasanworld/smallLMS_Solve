'use client';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { CoursesPage } from '@/features/course/components/CoursesPage';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { useQuery } from '@tanstack/react-query';
import type { UserProfileResponse } from '@/features/auth/lib/dto';

/**
 * 강사용 코스 관리 페이지
 * - 강사만 접근 가능
 * - 코스 생성, 수정, 삭제, 상태 변경 가능
 */
export default function CoursesPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useCurrentUser();

  // 사용자 프로필 조회 (역할 확인)
  const fetchUserProfile = async () => {
    try {
      const { data } = await apiClient.get('/api/auth/profile');
      return data;
    } catch (error) {
      const message = extractApiErrorMessage(error, 'Failed to fetch user profile.');
      throw new Error(message);
    }
  };

  const {
    data: userProfile,
    isLoading: isProfileLoading,
  } = useQuery<UserProfileResponse>({
    queryKey: ['user-profile', user?.id],
    queryFn: () => fetchUserProfile(),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // ✅ 강사 권한 확인
  useEffect(() => {
    if (!isAuthLoading && !isProfileLoading) {
      // 미인증 사용자는 로그인 페이지로 리다이렉트
      if (!user) {
        router.replace('/login');
        return;
      }

      // 학습자는 학습자 대시보드로 리다이렉트
      if (userProfile && userProfile.role !== 'instructor') {
        router.replace('/dashboard');
        return;
      }
    }
  }, [user, userProfile, isAuthLoading, isProfileLoading, router]);

  // 로딩 중
  if (isAuthLoading || isProfileLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="text-center">
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  // 강사가 아니면 접근 불가
  if (!userProfile || userProfile.role !== 'instructor') {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">접근 권한이 없습니다</h1>
          <p className="text-slate-500">
            이 페이지는 강사 전용입니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <CoursesPage />
    </div>
  );
}
