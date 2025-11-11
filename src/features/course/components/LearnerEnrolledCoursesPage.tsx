'use client';

import { useEnrolledCoursesQuery } from '@/features/course/hooks/useLearnerCourseQueries';
import { CourseCard } from '@/features/course/components/CourseCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * 학습자의 수강신청한 코스 목록 페이지
 * - 수강신청한 모든 코스를 표시
 * - 코스 카드로 표시하여 상세 페이지로 이동 가능
 */
export const LearnerEnrolledCoursesPage = () => {
  const { data: courses, isLoading, isError, error } = useEnrolledCoursesQuery();

  if (isError) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : '수강신청한 코스를 불러올 수 없습니다.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 space-y-2">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const hasCourses = courses && courses.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">내 강의</h1>
        <p className="text-slate-600">
          {hasCourses
            ? `${courses?.length || 0}개의 강의를 수강 중입니다`
            : '아직 수강신청한 강의가 없습니다'}
        </p>
      </header>

      {!hasCourses ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold">수강신청한 강의가 없습니다</h2>
          <p className="text-slate-500 mb-6">
            강의를 둘러보고 수강신청해보세요
          </p>
          <Link href="/explore-courses">
            <Button>강의 둘러보기</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="group"
            >
              <div className="h-full rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-blue-600">
                  {course.title}
                </h3>
                <p className="text-slate-600 text-sm line-clamp-3 mb-3">
                  {course.description}
                </p>
                <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
                  <span>{course.instructor_name}</span>
                  <span>{course.enrollment_count}명</span>
                </div>
                <div className="flex gap-2">
                  {course.category && (
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                      {course.category.name}
                    </span>
                  )}
                  {course.difficulty && (
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                      {course.difficulty.name}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
