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
import { AlertCircle, Plus, FileText, Clock } from 'lucide-react';
import { AssignmentList } from '@/features/assignment/components/AssignmentList';
import type { AssignmentResponse } from '@/features/assignment/lib/dto';

export default function CourseAssignmentsPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  // 과제 목록 조회
  const { 
    data: assignments = [], 
    isLoading, 
    error,
    isError
  } = useQuery({
    queryKey: ['course-assignments', courseId],
    queryFn: async () => {
      try {
        console.log('📋 과제 목록 조회:', courseId);
        const response = await apiClient.get<{ assignments: AssignmentResponse[] }>(
          `/api/courses/${courseId}/assignments`
        );
        console.log('✅ 과제 목록 조회 완료:', response.data.assignments.length);
        return response.data.assignments;
      } catch (err) {
        const message = extractApiErrorMessage(err, 'Failed to fetch assignments.');
        console.error('❌ 과제 목록 조회 실패:', message);
        throw new Error(message);
      }
    },
    enabled: !!courseId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
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
      <div className="space-y-6">
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">과제 관리</h1>
          <p className="text-slate-500">코스의 과제를 관리하세요</p>
        </div>
        <Link href={`/courses/${courseId}/assignments/new`}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            새 과제 만들기
          </Button>
        </Link>
      </div>

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
          <div className="text-sm text-slate-500">
            총 <span className="font-semibold text-slate-900">{assignments.length}</span>개의 과제가 있습니다
          </div>
          <AssignmentList assignments={assignments} courseId={courseId} />
        </div>
      )}
    </div>
  );
}

