'use client';

import { useLearnerDashboardQuery } from '@/features/dashboard/hooks/useLearnerDashboardQuery';
import { CourseProgressCard } from '@/features/dashboard/components/CourseProgressCard';
import { UpcomingAssignments } from '@/features/dashboard/components/UpcomingAssignments';
import { RecentFeedback } from '@/features/dashboard/components/RecentFeedback';
import { SubmissionStatusCard } from '@/features/dashboard/components/SubmissionStatusCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const LearnerDashboard = () => {
  const { data, isLoading, isError, error } = useLearnerDashboardQuery();

  if (isError) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error.message || 'Failed to load dashboard data. Please try again later.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="mt-2 h-4 w-1/3" />
        </div>

        <div className="mb-8">
          <Skeleton className="h-6 w-1/5 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>

        <div className="mb-8">
          <Skeleton className="h-6 w-1/4 mb-4" />
          <Skeleton className="h-48 w-full" />
        </div>

        <div>
          <Skeleton className="h-6 w-1/5 mb-4" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  const hasEnrolledCourses = data?.enrolledCourses && data.enrolledCourses.length > 0;
  const hasUpcomingAssignments = data?.upcomingAssignments && data.upcomingAssignments.length > 0;
  const hasRecentFeedback = data?.recentFeedback && data.recentFeedback.length > 0;
  const hasAllAssignmentsStatus = data?.allAssignmentsStatus && data.allAssignmentsStatus.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold">학습자 대시보드</h1>
        <p className="text-slate-500">
          현재 수강 중인 강의와 과제 현황을 확인하세요
        </p>
      </header>

      {!hasEnrolledCourses ? (
        <div className="mb-10 rounded-lg border border-dashed border-slate-300 p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold">수강 중인 강의가 없습니다</h2>
          <p className="text-slate-500 mb-4">
            강의를 수강신청하고 학습을 시작해보세요
          </p>
          <a 
            href="/explore-courses" 
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            강의 둘러보기
          </a>
        </div>
      ) : (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">수강 중인 강의</h2>
            <a 
              href="/explore-courses" 
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              새 강의 수강신청
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.enrolledCourses.map((course) => (
              <CourseProgressCard key={course.courseId} course={course} />
            ))}
          </div>
        </section>
      )}

      {hasAllAssignmentsStatus && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold">과제 제출 현황</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.allAssignmentsStatus.map((submission) => (
              <SubmissionStatusCard key={submission.id} submission={submission} />
            ))}
          </div>
        </section>
      )}

      {hasUpcomingAssignments && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold">다가오는 과제</h2>
          <UpcomingAssignments assignments={data?.upcomingAssignments || []} />
        </section>
      )}

      {hasRecentFeedback && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">최근 피드백</h2>
          <RecentFeedback feedbacks={data?.recentFeedback || []} />
        </section>
      )}

      {!hasAllAssignmentsStatus && !hasUpcomingAssignments && !hasRecentFeedback && hasEnrolledCourses && (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold">최근 활동이 없습니다</h2>
          <p className="text-slate-500">
            과제 제출 후 피드백을 확인해보세요
          </p>
        </div>
      )}
    </div>
  );
};