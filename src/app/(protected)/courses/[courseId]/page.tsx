'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Users, BarChart3, BookOpen, Check } from 'lucide-react';
import { 
  useCreateEnrollmentMutation, 
  useCancelEnrollmentMutation, 
  useIsEnrolled 
} from '@/features/enrollment/hooks/useEnrollmentMutations';
import type { Course } from '@/features/course/backend/schema';

/**
 * 코스 상세 페이지
 * - 모든 사용자가 접근 가능 (published 상태의 코스만 표시)
 * - 코스 정보: 제목, 설명, 강사, 카테고리, 난이도, 등록 수, 평점
 * - 수강신청/취소 버튼
 */
export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { toast } = useToast();
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);

  // 코스 정보 조회
  const {
    data: course,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      try {
        console.log('📚 코스 상세 정보 조회:', courseId);
        const response = await apiClient.get<{ data: Course }>(`/api/courses/${courseId}`);
        console.log('✅ 코스 정보 조회 완료:', response.data);
        return response.data.data;
      } catch (err) {
        const message = extractApiErrorMessage(err, '코스 정보를 불러올 수 없습니다.');
        console.error('❌ 코스 정보 조회 실패:', message);
        throw new Error(message);
      }
    },
  });

  // 수강신청/취소 Mutation
  const createEnrollmentMutation = useCreateEnrollmentMutation();
  const cancelEnrollmentMutation = useCancelEnrollmentMutation();

  // 현재 수강 여부 확인
  const isEnrolled = useIsEnrolled(courseId);

  // 수강신청 핸들러
  const handleEnroll = async () => {
    try {
      setEnrollmentError(null);
      await createEnrollmentMutation.mutateAsync(courseId);
      toast({
        title: '수강신청 완료',
        description: '코스에 등록되었습니다.',
        variant: 'default',
      });
    } catch (err) {
      const message = extractApiErrorMessage(err, '수강신청에 실패했습니다.');
      setEnrollmentError(message);
      toast({
        title: '수강신청 실패',
        description: message,
        variant: 'destructive',
      });
    }
  };

  // 수강취소 핸들러
  const handleCancel = async () => {
    if (!window.confirm('정말로 이 코스를 취소하시겠습니까?')) {
      return;
    }

    try {
      setEnrollmentError(null);
      await cancelEnrollmentMutation.mutateAsync(courseId);
      toast({
        title: '수강취소 완료',
        description: '코스가 취소되었습니다.',
        variant: 'default',
      });
    } catch (err) {
      const message = extractApiErrorMessage(err, '수강취소에 실패했습니다.');
      setEnrollmentError(message);
      toast({
        title: '수강취소 실패',
        description: message,
        variant: 'destructive',
      });
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : '코스를 불러올 수 없습니다.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // 코스가 없음
  if (!course) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>코스를 찾을 수 없습니다.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // 공개되지 않은 코스
  if (course.status !== 'published' && course.status !== 'active') {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {course.status === 'archived' 
              ? '이 코스는 종료되었습니다.' 
              : '이 코스는 아직 공개되지 않았습니다.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      {/* 헤더 섹션 */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{course.title}</h1>
            <p className="text-lg text-slate-600">
              강사: {course.instructor_name || '미지정'}
            </p>
          </div>
          <Badge variant="default" className="px-3 py-1">
            {course.status === 'published' ? '진행 중' : '종료'}
          </Badge>
        </div>

        {/* 메타정보 */}
        <div className="flex flex-wrap gap-4 text-sm">
          {course.category && (
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-slate-500" />
              <span className="text-slate-600">{course.category}</span>
            </div>
          )}
          {course.difficulty && (
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-slate-500" />
              <span className="text-slate-600">{course.difficulty}</span>
            </div>
          )}
          {course.enrollment_count !== undefined && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-500" />
              <span className="text-slate-600">
                {course.enrollment_count}명 수강 중
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 주요 정보 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">
              카테고리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{course.category || '미분류'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">
              난이도
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{course.difficulty || '미지정'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">
              수강생
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {course.enrollment_count || 0}명
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 코스 설명 */}
      <Card>
        <CardHeader>
          <CardTitle>코스 소개</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
            {course.description || '코스 설명이 없습니다.'}
          </p>
        </CardContent>
      </Card>

      {/* 수강신청 섹션 */}
      <Card className={`border-2 ${isEnrolled ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
        <CardHeader>
          <CardTitle className={isEnrolled ? 'text-green-900' : 'text-blue-900'}>
            {isEnrolled ? '이미 수강 중입니다' : '코스 수강하기'}
          </CardTitle>
          <CardDescription className={isEnrolled ? 'text-green-800' : 'text-blue-800'}>
            {isEnrolled 
              ? '이 코스에 등록되어 있습니다. 학습을 시작하거나 수강을 취소할 수 있습니다.'
              : '이 코스에 등록하여 학습을 시작하세요.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {enrollmentError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{enrollmentError}</AlertDescription>
            </Alert>
          )}
          <div className="flex gap-3">
            {isEnrolled ? (
              <>
                <Button 
                  size="lg" 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled
                >
                  <Check className="mr-2 h-4 w-4" />
                  수강 등록됨
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleCancel}
                  disabled={cancelEnrollmentMutation.isPending}
                >
                  {cancelEnrollmentMutation.isPending ? '취소 중...' : '수강 취소'}
                </Button>
              </>
            ) : (
              <>
                <Button 
                  size="lg" 
                  className="flex-1"
                  onClick={handleEnroll}
                  disabled={
                    createEnrollmentMutation.isPending || 
                    course?.status !== 'published'
                  }
                >
                  {createEnrollmentMutation.isPending ? '신청 중...' : '지금 수강신청'}
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => window.history.back()}
                >
                  돌아가기
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 커리큘럼 플레이스홀더 */}
      <Card>
        <CardHeader>
          <CardTitle>커리큘럼</CardTitle>
          <CardDescription>
            이 코스의 과제 및 학습 계획
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 text-slate-500">
          <p className="text-sm">
            과제 관리 기능은 곧 제공될 예정입니다.
          </p>
        </CardContent>
      </Card>

      {/* 강사 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>강사 소개</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-slate-300" />
            <div>
              <p className="font-semibold">{course.instructor_name || '미지정'}</p>
              <p className="text-sm text-slate-600">강사</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

