'use client';

import Link from 'next/link';
import { useInstructorDashboardQuery } from '@/features/dashboard/hooks/useInstructorDashboardQuery';
import { type InstructorDashboardResponse } from '@/features/dashboard/backend/instructor-schema';
import { DashboardMetrics } from '@/features/dashboard/components/DashboardMetrics';
import { CourseStatusCard, type CourseStatusCardProps } from '@/features/dashboard/components/CourseStatusCard';
import { PendingGradingCounter } from '@/features/dashboard/components/PendingGradingCounter';
import { RecentSubmissionsList, type RecentSubmissionsListProps } from '@/features/dashboard/components/RecentSubmissionsList';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Users, BookOpen, FileText, Clock, Plus, RefreshCw, Calendar, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';

export default function InstructorDashboard() {
  const { data, isLoading, error, refetch, isFetching } = useInstructorDashboardQuery<InstructorDashboardResponse>();
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    // 페이지 전체 새로고침
    window.location.reload();
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
  const assignments = (data?.assignments || []) as InstructorDashboardResponse['assignments'];
  const pendingGradingCount = data?.pendingGradingCount || 0;
  const recentSubmissions = (data?.recentSubmissions || []) as InstructorDashboardResponse['recentSubmissions'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">강사 대시보드</h1>
            {/* ✅ 새로고침 버튼 (아이콘만, 제목 옆) */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              title="페이지 새로고침"
              className="h-10 w-10"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-muted-foreground mt-1">코스와 과제를 관리하세요</p>
        </div>
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
            <div className="flex items-center gap-2">
              <CardTitle>내 코스</CardTitle>
              <Badge variant="secondary">{courses.length}개 코스</Badge>
            </div>
            <div className="flex items-center gap-2">
              {/* ✅ 코스 만들기 버튼 */}
              <Link href="/courses">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  코스 만들기
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="mx-auto h-12 w-12" />
              <p className="mt-2">아직 코스가 없습니다.</p>
              <p className="text-sm mb-4">코스를 만들어서 시작하세요.</p>
              <Link href="/courses">
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  첫 코스 만들기
                </Button>
              </Link>
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

      {/* Assignment Management Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>과제 관리</CardTitle>
              <Badge variant="secondary">{assignments.length}개 과제</Badge>
            </div>
            <Link href="/courses/assignments">
              <Button variant="outline" size="sm" className="gap-2">
                모든 과제 보기 →
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12" />
              <p className="mt-2">아직 과제가 없습니다.</p>
              <p className="text-sm">코스에 과제를 추가해서 시작하세요.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Assignment List */}
              <div className="space-y-2">
                {assignments.slice(0, 5).map((assignment) => {
                  const course = courses.find(c => c.id === assignment.courseId);
                  const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
                  const isOverdue = dueDate && dueDate < new Date();
                  
                  return (
                    <Link
                      key={assignment.id}
                      href={`/courses/${assignment.courseId}/assignments/${assignment.id}`}
                    >
                      <div className="p-3 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{assignment.title}</p>
                            <p className="text-xs text-slate-500">{course?.title}</p>
                          </div>
                          {assignment.status === 'published' && (
                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                        {dueDate && (
                          <div className="flex items-center gap-1 mt-2 text-xs">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <span className={isOverdue ? 'text-red-600 font-medium' : 'text-slate-500'}>
                              {isOverdue ? '기한 종료: ' : '기한: '}
                              {formatDistanceToNow(dueDate, { addSuffix: true })}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
              {assignments.length > 5 && (
                <p className="text-xs text-slate-500 text-center pt-2">
                  +{assignments.length - 5}개의 과제가 더 있습니다 <Link href="/courses/assignments" className="text-blue-600 hover:underline">전체 보기</Link>
                </p>
              )}
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