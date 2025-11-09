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
import { AlertCircle, Users, BookOpen, FileText, Clock, Plus, RefreshCw, CheckCircle2 } from 'lucide-react';
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
        assignmentCount={assignments.length}
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
              <Button variant="outline" size="sm">
                모든 과제 보기 →
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12" />
              <p className="mt-2">아직 코스가 없습니다.</p>
              <p className="text-sm">코스를 만들면 과제를 추가할 수 있습니다.</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12" />
              <p className="mt-2">아직 과제가 없습니다.</p>
              <p className="text-sm">과제를 추가해서 시작하세요.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => {
                const course = courses.find(c => c.id === assignment.courseId);
                const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
                const isOverdue = dueDate && dueDate < new Date();
                const statusColors: Record<string, string> = {
                  draft: 'bg-gray-100 text-gray-800',
                  published: 'bg-blue-100 text-blue-800',
                  closed: 'bg-slate-100 text-slate-800',
                };

                return (
                  <Link
                    key={assignment.id}
                    href={`/courses/${assignment.courseId}/assignments/${assignment.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-slate-900 truncate">
                          {assignment.title}
                        </h4>
                        <Badge
                          variant="outline"
                          className={statusColors[assignment.status] || 'bg-slate-100 text-slate-800'}
                        >
                          {assignment.status === 'draft'
                            ? '초안'
                            : assignment.status === 'published'
                            ? '공개'
                            : '종료'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-slate-500">{course?.title}</p>
                        <span className="text-xs text-slate-400">•</span>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {assignment.description || '설명 없음'}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-slate-500 text-right ml-4 flex-shrink-0">
                      {dueDate && (
                        <div>
                          {isOverdue ? (
                            <span className="text-red-600 font-medium">마감됨</span>
                          ) : (
                            <span>{dueDate.toLocaleDateString('ko-KR')}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
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