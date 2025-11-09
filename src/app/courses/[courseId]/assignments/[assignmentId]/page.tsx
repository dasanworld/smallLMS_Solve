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
import { AlertCircle, ArrowLeft, Edit, FileText, RefreshCw } from 'lucide-react';
import type { AssignmentResponse } from '@/features/assignment/backend/schema';
import { formatDistanceToNow } from 'date-fns';

/**
 * 날짜 안전 파싱 함수
 */
const parseDate = (dateValue: string | Date | null | undefined): Date | null => {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * 로컬 날짜 문자열로 포맷팅
 */
const formatDateTime = (dateValue: string | Date | null | undefined): string => {
  const date = parseDate(dateValue);
  if (!date) return 'Invalid Date';
  return date.toLocaleString('ko-KR');
};

export default function AssignmentDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const assignmentId = params.assignmentId as string;

  // 과제 상세 조회
  const {
    data: assignment,
    isLoading,
    error,
    isError,
    refetch,
    isFetching,
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

  const handleRefresh = async () => {
    await refetch();
  };

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

  if (isError || !assignment) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <Link href={`/courses/${courseId}/assignments`}>
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            돌아가기
          </Button>
        </Link>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : '과제를 불러올 수 없습니다.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const statusConfig = {
    draft: { label: '초안', color: 'bg-gray-100 text-gray-800' },
    published: { label: '공개', color: 'bg-blue-100 text-blue-800' },
    closed: { label: '종료', color: 'bg-slate-100 text-slate-800' },
  };

  const config = statusConfig[assignment.status as keyof typeof statusConfig] || statusConfig.draft;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between gap-4">
          <Link href={`/courses/${courseId}/assignments`}>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              돌아가기
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{assignment.title}</h1>
              <Badge className={config.color} variant="outline">
                {config.label}
              </Badge>
              {/* 새로고침 버튼 */}
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isFetching}
                title="새로고침"
                className="h-9 w-9"
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <p className="text-slate-500">
              마감: {formatDateTime(assignment.dueDate)} {assignment.dueDate && parseDate(assignment.dueDate) && `(${formatDistanceToNow(parseDate(assignment.dueDate)!, { addSuffix: true })})`}
            </p>
          </div>
          <Link href={`/courses/${courseId}/assignments/${assignmentId}/edit`}>
            <Button className="gap-2">
              <Edit className="h-4 w-4" />
              수정
            </Button>
          </Link>
        </div>

        {/* 과제 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>과제 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 설명 */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">설명</h3>
              <p className="text-slate-600 whitespace-pre-wrap">
                {assignment.description}
              </p>
            </div>

            {/* 세부 정보 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500 font-medium">가중치</p>
                <p className="text-lg font-semibold text-slate-900">
                  {(assignment.pointsWeight * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">상태</p>
                <p className="text-lg font-semibold text-slate-900">
                  {assignment.status === 'draft' && '초안'}
                  {assignment.status === 'published' && '공개'}
                  {assignment.status === 'closed' && '종료'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">지각 제출 허용</p>
                <p className="text-lg font-semibold text-slate-900">
                  {assignment.allowLate ? '허용' : '불허'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">재제출 허용</p>
                <p className="text-lg font-semibold text-slate-900">
                  {assignment.allowResubmission ? '허용' : '불허'}
                </p>
              </div>
            </div>

            {/* 타임스탬프 */}
            <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-1">
              <p>생성: {formatDateTime(assignment.createdAt)}</p>
              <p>수정: {formatDateTime(assignment.updatedAt)}</p>
              {assignment.publishedAt && (
                <p>공개: {formatDateTime(assignment.publishedAt)}</p>
              )}
              {assignment.closedAt && (
                <p>종료: {formatDateTime(assignment.closedAt)}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 제출물 */}
        <Card>
          <CardHeader>
            <CardTitle>제출물</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-slate-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-slate-400" />
              <p className="text-sm">제출물 관리 기능은 준비 중입니다.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

