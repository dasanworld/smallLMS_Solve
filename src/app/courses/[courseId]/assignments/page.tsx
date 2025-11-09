'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Plus, FileText, Clock, Check } from 'lucide-react';
import { AssignmentList } from '@/features/assignment/components/AssignmentList';
import { useUpdateAssignmentStatusMutation } from '@/features/assignment/hooks/useAssignmentMutations';
import { useToast } from '@/hooks/use-toast';
import type { AssignmentResponse } from '@/features/assignment/lib/dto';
import type { Course } from '@/features/course/backend/schema';

export default function CourseAssignmentsPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { toast } = useToast();
  const updateStatusMutation = useUpdateAssignmentStatusMutation();

  // 강사의 모든 코스 조회
  const {
    data: courses = [],
    isLoading: coursesLoading,
  } = useQuery({
    queryKey: ['instructor-courses-list'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ courses: Course[] }>('/api/courses');
        return response.data.courses;
      } catch (err) {
        return [];
      }
    },
  });

  // 현재 코스 정보 조회
  const {
    data: currentCourse,
    isLoading: courseLoading,
  } = useQuery({
    queryKey: ['current-course', courseId],
    queryFn: async () => {
      try {
        const course = courses.find(c => c.id === courseId);
        return course || null;
      } catch (err) {
        return null;
      }
    },
    enabled: courses.length > 0 && !!courseId,
  });

  // 과제 목록 조회
  const { 
    data: assignments = [], 
    isLoading: assignmentsLoading, 
    error,
    isError
  } = useQuery({
    queryKey: ['course-assignments', courseId],
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ data: AssignmentResponse[]; total: number; limit: number; offset: number }>(
          `/api/courses/${courseId}/assignments`
        );
        return response.data.data;
      } catch (err) {
        const message = extractApiErrorMessage(err, 'Failed to fetch assignments.');
        throw new Error(message);
      }
    },
    enabled: !!courseId,
  });

  const isLoading = coursesLoading || assignmentsLoading;

  // 과제 상태 변경 핸들러
  const handleStatusChange = (assignmentId: string, newStatus: 'draft' | 'published' | 'closed') => {
    updateStatusMutation.mutate(
      { assignmentId, status: newStatus },
      {
        onSuccess: () => {
          const statusLabel = newStatus === 'published' ? '발행' : newStatus === 'closed' ? '마감' : '초안';
          toast({
            title: '성공',
            description: `과제가 ${statusLabel} 상태로 변경되었습니다.`,
          });
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : '상태 변경에 실패했습니다.';
          toast({
            title: '오류',
            description: message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div>
          <Skeleton className="h-8 w-1/4 mb-2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError && error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">과제 관리</h1>
          <p className="text-slate-500">코스의 과제를 관리하세요</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-2">
            <span className="font-semibold">과제 목록을 불러올 수 없습니다</span>
            <span className="text-sm">
              {error instanceof Error ? error.message : '서버 오류가 발생했습니다.'}
            </span>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">과제 관리</h1>
            <p className="text-slate-500 mt-1">
              {currentCourse ? `${currentCourse.title} - 과제를 생성하고 관리하세요` : '코스의 과제를 생성하고 관리하세요'}
            </p>
          </div>
          <Link href={`/courses/${courseId}/assignments/new`}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              새 과제 만들기
            </Button>
          </Link>
        </div>

        {/* 코스 목록 네비게이션 */}
        {courses.length > 1 && (
          <Card className="bg-slate-50">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">다른 코스의 과제 관리:</p>
                <div className="flex flex-wrap gap-2">
                  {courses.map((course) => (
                    <Link
                      key={course.id}
                      href={`/courses/${course.id}/assignments`}
                    >
                      <Button
                        variant={course.id === courseId ? 'default' : 'outline'}
                        size="sm"
                        className={course.id === courseId ? 'gap-2' : 'gap-1'}
                      >
                        {course.id === courseId && <Check className="h-4 w-4" />}
                        {course.title}
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {assignments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-slate-400 mb-3" />
              <h3 className="text-lg font-medium text-slate-900">
                아직 과제가 없습니다
              </h3>
              <p className="text-slate-500 text-sm mt-2 text-center max-w-xs">
                과제를 만들어서 학생들에게 과제를 부여하세요.
              </p>
              <Link href={`/courses/${courseId}/assignments/new`} className="mt-4">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  첫 과제 만들기
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600">
                총 <span className="font-semibold text-slate-900">{assignments.length}</span>개의 과제
              </span>
            </div>
            <AssignmentList 
              assignments={assignments} 
              courseId={courseId}
              onStatusChange={handleStatusChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}

