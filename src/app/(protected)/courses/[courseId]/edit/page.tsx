'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { CourseForm } from '@/features/course/components/CourseForm';
import type { Course } from '@/features/course/backend/schema';

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  // 코스 상세 조회
  const {
    data: course,
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      try {
        console.log('📚 코스 상세 조회:', courseId);
        const response = await apiClient.get<Course>(
          `/api/courses/${courseId}`
        );
        console.log('✅ 코스 상세 조회 완료:', response.data);
        return response.data;
      } catch (err) {
        const message = extractApiErrorMessage(err, 'Failed to fetch course.');
        console.error('❌ 코스 조회 실패:', message);
        throw new Error(message);
      }
    },
    enabled: !!courseId,
  });

  const handleSuccess = () => {
    router.push(`/courses/${courseId}`);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      console.log('📝 코스 수정 요청:', data);
      const response = await apiClient.put(`/api/courses/${courseId}`, data);
      console.log('✅ 코스 수정 완료:', response.data);
      handleSuccess();
    } catch (err) {
      const message = extractApiErrorMessage(err, 'Failed to update course.');
      console.error('❌ 코스 수정 실패:', message);
      throw new Error(message);
    }
  };

  if (isLoading) {
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

  if (isError || !course) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="space-y-4">
          <Link href={`/courses/${courseId}`}>
            <Button variant="outline" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error instanceof Error ? error.message : '코스를 불러올 수 없습니다.'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center gap-4">
          <Link href={`/courses/${courseId}`}>
            <Button variant="outline" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">코스 수정</h1>
            <p className="text-slate-500 mt-1">
              {course.title}을(를) 수정하세요
            </p>
          </div>
        </div>

        {/* 코스 폼 */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">코스 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <CourseForm 
              isEditing={true}
              initialData={{
                title: course?.title,
                description: course?.description,
                category_id: course?.category_id,
                difficulty_id: course?.difficulty_id,
              }}
              isLoading={isLoading}
              onSubmit={handleFormSubmit}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

