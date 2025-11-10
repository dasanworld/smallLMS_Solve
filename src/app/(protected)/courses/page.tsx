'use client';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { LearnerCoursesCatalog } from '@/features/course/components/LearnerCoursesCatalog';
import { CoursesPage as InstructorCoursesPage } from '@/features/course/components/CoursesPage';

/**
 * 코스 페이지 (역할별 분기)
 * - 학습자: 코스 카탈로그 표시
 * - 강사: 강사 코스 관리 페이지 표시
 */
export default function CoursesPage() {
  const { user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p>로딩 중...</p>
      </div>
    );
  }

  // 강사: 강사 코스 관리 페이지 표시
  if (user && (user as any).role === 'instructor') {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <InstructorCoursesPage />
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
