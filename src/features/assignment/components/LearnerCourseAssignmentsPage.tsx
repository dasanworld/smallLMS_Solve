'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { useLearnerCourseAssignmentsQuery } from '../hooks/useLearnerAssignmentQueries';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

interface LearnerCourseAssignmentsPageProps {
  courseId: string;
  courseName: string;
}

/**
 * 학습자용 과제 페이지
 * - 등록한 코스의 과제 목록 조회
 * - 과제 제출 기능
 * - 읽기 전용 (생성/수정/삭제 불가)
 */
export const LearnerCourseAssignmentsPage = ({
  courseId,
  courseName,
}: LearnerCourseAssignmentsPageProps) => {
  const router = useRouter();
  const { data: assignments = [], isLoading, error } = useLearnerCourseAssignmentsQuery(courseId);

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">과제</h1>
          <p className="mt-2 text-gray-600">
            <span className="font-semibold text-blue-600">{courseName}</span>의 과제를 확인하고 제출합니다
          </p>
        </div>

        <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">오류</h3>
            <p className="text-sm text-red-800">
              {error instanceof Error ? error.message : '과제 목록을 불러올 수 없습니다'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">과제</h1>
        <p className="mt-2 text-gray-600">
          <span className="font-semibold text-blue-600">{courseName}</span>의 과제를 확인하고 제출합니다
        </p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">과제 목록을 불러오는 중...</span>
          </CardContent>
        </Card>
      ) : assignments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">아직 과제가 없습니다</h3>
              <p className="mt-2 text-sm text-gray-600">
                강사가 과제를 생성하면 여기에 표시됩니다
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="line-clamp-2">{assignment.title}</CardTitle>
                    <CardDescription className="mt-2 line-clamp-2">
                      {assignment.description}
                    </CardDescription>
                  </div>
                  <Badge className="flex-shrink-0">
                    {assignment.pointsWeight}점
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm text-gray-600">
                  <div>
                    <p className="font-semibold text-gray-900">마감일</p>
                    <p>{format(parseISO(assignment.dueDate), 'PPpp', { locale: ko })}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">상태</p>
                    <p className="capitalize">{assignment.status}</p>
                  </div>
                </div>

                {assignment.instructions && (
                  <div>
                    <p className="font-semibold text-sm text-gray-900">지시사항</p>
                    <p className="text-sm text-gray-600 line-clamp-3">{assignment.instructions}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => router.push(
                      `/courses/${courseId}/assignments/${assignment.id}/submissions`
                    )}
                  >
                    제출 보기
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
