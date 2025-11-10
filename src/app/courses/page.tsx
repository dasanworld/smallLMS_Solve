'use client';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { LearnerCoursesCatalog } from '@/features/course/components/LearnerCoursesCatalog';
import { redirect } from 'next/navigation';

/**
 * 코스 페이지 (역할별 분기)
 * - 학습자: 코스 카탈로그 표시
 * - 강사: 강사 대시보드로 리다이렉트
 * - 비로그인: 랜딩페이지로 리다이렉트
 */
export default function CoursesPage() {
  const { user, isLoading } = useCurrentUser();

  // 비로그인 사용자는 랜딩페이지로 리다이렉트
  if (!isLoading && !user) {
    redirect('/');
  }

  // 강사는 강사 대시보드로 리다이렉트
  if (!isLoading && user && (user as any).role === 'instructor') {
    redirect('/instructor-dashboard');
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p>로딩 중...</p>
      </div>
    );
  }

  // 학습자: 코스 카탈로그 표시
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <LearnerCoursesCatalog />
    </div>
  );
}
