"use client";

import { LearnerDashboard } from "@/features/dashboard/components/LearnerDashboard";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { type UserProfileResponse } from "@/features/auth/lib/dto";

type DashboardPageProps = {
  params: Promise<Record<string, never>>;
};

const fetchUserProfile = async () => {
  try {
    const { data } = await apiClient.get('/api/auth/profile');
    return data;
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to fetch user profile.');
    throw new Error(message);
  }
};

export default function DashboardPage({ params }: DashboardPageProps) {
  void params;
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useCurrentUser();

  // Fetch user profile to get the role
  const {
    data: userProfile,
    isLoading: isProfileLoading,
    isError
  } = useQuery<UserProfileResponse>({
    queryKey: ['user-profile', user?.id],
    queryFn: () => fetchUserProfile(),
    enabled: !!user?.id, // Only run if user is authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // 리다이렉트 정책 (docs/REDIRECT_POLICY.md 참고):
  // 학습자 대시보드는 learner 역할만 접근 가능
  // instructor 역할이 접근하면 강사 대시보드로 자동 리다이렉트
  useEffect(() => {
    if (userProfile && userProfile.role === 'instructor') {
      router.replace('/instructor-dashboard');
    }
  }, [userProfile, router]);

  if (isAuthLoading || isProfileLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (isError || !userProfile) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">사용자 정보를 불러올 수 없습니다</h1>
          <p className="text-slate-500">
            다시 시도해 주세요.
          </p>
        </div>
      </div>
    );
  }

  // Check if user is a learner
  const isLearner = userProfile.role === 'learner';

  if (!isLearner) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">접근 권한이 없습니다</h1>
          <p className="text-slate-500">
            이 대시보드는 학습자 전용입니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <LearnerDashboard />
  );
}
