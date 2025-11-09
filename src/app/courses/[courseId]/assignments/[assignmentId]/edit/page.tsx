'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Check } from 'lucide-react';
import { AssignmentForm } from '@/features/assignment/components/AssignmentForm';
import type { Course } from '@/features/course/backend/schema';
import type { AssignmentResponse } from '@/features/assignment/backend/schema';

export default function EditAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const assignmentId = params.assignmentId as string;

  // 강사의 모든 코스 조회
  const {
    data: courses = [],
    isLoading: coursesLoading,
  } = useQuery({
    queryKey: ['instructor-courses-list-edit'],
    queryFn: async () => {
      try {
        console.log('📚 강사 코스 목록 조회 중...');
        const response = await apiClient.get<{ courses: Course[] }>('/api/courses');
        console.log('✅ 강사 코스 목록 조회 완료:', response.data.courses.length);
        return response.data.courses;
      } catch (err) {
        const message = extractApiErrorMessage(err, 'Failed to fetch courses.');
        console.error('❌ 코스 목록 조회 실패:', message);
        return [];
      }
    },
  });

  // 현재 과제 조회
  const {
    data: assignment,
    isLoading: assignmentLoading,
  } = useQuery({
    queryKey: ['assignment', courseId, assignmentId],
    queryFn: async () => {
      try {
        console.log('📋 과제 상세 조회:', courseId, assignmentId);
        const response = await apiClient.get<AssignmentResponse>(
          `/api/courses/${courseId}/assignments/${assignmentId}`
        );
        console.log('✅ 과제 상세 조회 완료:', response.data);
        return response.data;
      } catch (err) {
        const message = extractApiErrorMessage(err, 'Failed to fetch assignment.');
        console.error('❌ 과제 조회 실패:', message);
        throw new Error(message);
      }
    },
    enabled: !!assignmentId && !!courseId,
  });

  // 현재 코스 정보
  const currentCourse = courses.find(c => c.id === courseId);

  const handleSuccess = () => {
    router.push(`/courses/${courseId}/assignments/${assignmentId}`);
  };

  if (assignmentLoading || coursesLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="flex-1">
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="space-y-4">
          <Link href={`/courses/${courseId}/assignments`}>
            <Button variant="outline" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <p className="text-red-600">과제를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center gap-4">
          <Link href={`/courses/${courseId}/assignments/${assignmentId}`}>
            <Button variant="outline" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">과제 수정</h1>
            <p className="text-slate-500 mt-1">
              {currentCourse ? `${currentCourse.title} - ${assignment.title}을(를) 수정하세요` : '과제를 수정하세요'}
            </p>
          </div>
        </div>

        {/* 코스 목록 네비게이션 */}
        {courses.length > 1 && (
          <Card className="bg-slate-50">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">다른 코스에서 과제 수정:</p>
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

        {/* 과제 폼 */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">과제 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <AssignmentForm 
              courseId={courseId}
              assignment={assignment}
              onSuccess={handleSuccess}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

