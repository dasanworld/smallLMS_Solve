'use client';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { LearnerCoursesCatalog } from '@/features/course/components/LearnerCoursesCatalog';
import { redirect } from 'next/navigation';

/**
 * 학습자용 코스 카탈로그 페이지
 * - 모든 활성 코스 표시
 * - 수강신청 가능
 */
export default function ExploreCourses() {
  const { user, isLoading } = useCurrentUser();

  // 강사는 이 페이지에 접근할 수 없음
  if (!isLoading && user && (user as any).role === 'instructor') {
    redirect('/dashboard');
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <LearnerCoursesCatalog />
    </div>
  );
}

