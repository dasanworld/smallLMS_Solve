'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Edit } from 'lucide-react';
import type { Course } from '@/features/course/backend/schema';

export default function CourseDetailPage() {
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

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="flex-1">
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-4">
          <Link href="/courses">
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

  const statusConfig: Record<string, { label: string; color: string }> = {
    draft: { label: '초안', color: 'bg-gray-100 text-gray-800' },
    published: { label: '진행 중', color: 'bg-blue-100 text-blue-800' },
    archived: { label: '보관됨', color: 'bg-slate-100 text-slate-800' },
  };

  const config = statusConfig[course.status as keyof typeof statusConfig] || statusConfig.draft;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between gap-4">
          <Link href="/courses">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              돌아가기
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
              <Badge className={config.color} variant="outline">
                {config.label}
              </Badge>
            </div>
            <p className="text-slate-500">{course.description}</p>
          </div>
          <Link href={`/courses/${courseId}/edit`}>
            <Button className="gap-2">
              <Edit className="h-4 w-4" />
              수정
            </Button>
          </Link>
        </div>

        {/* 코스 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>코스 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 설명 */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">상세 설명</h3>
              <p className="text-slate-600 whitespace-pre-wrap">
                {course.description}
              </p>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500 font-medium">상태</p>
                <p className="text-lg font-semibold text-slate-900">
                  {config.label}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">수강생 수</p>
                <p className="text-lg font-semibold text-slate-900">
                  {course.enrollment_count}명
                </p>
              </div>
            </div>

            {/* 타임스탬프 */}
            <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-1">
              <p>생성: {new Date(course.created_at).toLocaleString('ko-KR')}</p>
              <p>수정: {new Date(course.updated_at).toLocaleString('ko-KR')}</p>
              {course.published_at && (
                <p>공개: {new Date(course.published_at).toLocaleString('ko-KR')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

