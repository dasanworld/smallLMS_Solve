'use client';

import { useRouter } from 'next/navigation';
import { useInstructorDashboardQuery } from '@/features/dashboard/hooks/useInstructorDashboardQuery';
import { type InstructorDashboardResponse } from '@/features/dashboard/backend/instructor-schema';
import { DashboardMetrics } from '@/features/dashboard/components/DashboardMetrics';
import { CourseStatusCard, type CourseStatusCardProps } from '@/features/dashboard/components/CourseStatusCard';
import { PendingGradingCounter } from '@/features/dashboard/components/PendingGradingCounter';
import { RecentSubmissionsList, type RecentSubmissionsListProps } from '@/features/dashboard/components/RecentSubmissionsList';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Users, BookOpen, FileText, Clock, RefreshCw, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function InstructorDashboard() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data, isLoading, error, refetch } = useInstructorDashboardQuery<InstructorDashboardResponse>();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading dashboard data: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Dashboard Metrics Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>

        {/* Pending Grading Counter Skeleton */}
        <Skeleton className="h-20 w-full rounded-xl" />

        {/* Courses Section Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Submissions Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const courses = (data?.courses || []) as InstructorDashboardResponse['courses'];
  const pendingGradingCount = data?.pendingGradingCount || 0;
  const recentSubmissions = (data?.recentSubmissions || []) as InstructorDashboardResponse['recentSubmissions'];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">강사 대시보드</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-10 w-10"
            title="데이터 새로고침"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-muted-foreground">코스와 과제를 관리하세요</p>
      </div>

      {/* Dashboard Metrics */}
      <DashboardMetrics
        coursesCount={courses.length}
        pendingGradingCount={pendingGradingCount}
        enrollmentCount={courses.reduce((sum, course) => sum + (course?.enrollmentCount || 0), 0)}
        assignmentCount={courses.reduce((sum, course) => sum + (course?.assignmentCount || 0), 0)}
      />

      {/* Pending Grading Counter */}
      <PendingGradingCounter count={pendingGradingCount} />

      {/* Courses Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>내 코스</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{courses.length}개 코스</Badge>
              <Button
                onClick={() => router.push('/courses')}
                size="sm"
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                코스 관리
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="mx-auto h-12 w-12" />
              <p className="mt-2">아직 코스가 없습니다.</p>
              <p className="text-sm">코스를 만들어서 시작하세요.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => course.id && (
                <CourseStatusCard key={course.id} course={course as CourseStatusCardProps['course']} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Submissions Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>최근 제출</CardTitle>
            <Badge variant="secondary">{recentSubmissions.length}개 제출</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {recentSubmissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12" />
              <p className="mt-2">최근 제출이 없습니다.</p>
              <p className="text-sm">학생들이 작업을 제출하면 여기에 표시됩니다.</p>
            </div>
          ) : (
            <RecentSubmissionsList submissions={recentSubmissions as RecentSubmissionsListProps['submissions']} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}