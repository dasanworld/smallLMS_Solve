'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useUpdateAssignmentStatusMutation } from '@/features/assignment/hooks/useAssignmentMutations';
import { useSubmitAssignmentMutation } from '@/features/assignment/hooks/useSubmissionMutations';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Edit, FileText, RefreshCw, Play, Lock, Send, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { AssignmentResponse } from '@/features/assignment/backend/schema';
import type { UserProfileResponse } from '@/features/auth/backend/profile-service';
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
  const router = useRouter();
  const courseId = params.courseId as string;
  const assignmentId = params.assignmentId as string;
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const updateStatusMutation = useUpdateAssignmentStatusMutation();
  const submitMutation = useSubmitAssignmentMutation(courseId, assignmentId);

  // 제출 폼 상태
  const [submitContent, setSubmitContent] = useState('');
  const [submitLink, setSubmitLink] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isEditingSubmission, setIsEditingSubmission] = useState(false);

  // 사용자 제출 상태 조회
  const { data: userSubmission, refetch: refetchSubmission } = useQuery({
    queryKey: ['user-submission', courseId, assignmentId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const response = await apiClient.get(
          `/api/courses/${courseId}/assignments/${assignmentId}/my-submission`
        );
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: !!user?.id && !!assignmentId && !!courseId,
  });

  // 사용자 프로필 조회 (역할 확인)
  const { data: profile } = useQuery<UserProfileResponse | null>({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const response = await apiClient.get<UserProfileResponse>('/api/auth/profile');
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: !!user?.id,
  });

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
        const response = await apiClient.get<AssignmentResponse>(
          `/api/courses/${courseId}/assignments/${assignmentId}`
        );
        return response.data;
      } catch (err) {
        const message = extractApiErrorMessage(err, 'Failed to fetch assignment.');
        throw new Error(message);
      }
    },
    enabled: !!assignmentId && !!courseId,
  });

  const handleRefresh = async () => {
    await refetch();
  };

  // 과제 제출 핸들러
  const handleSubmit = async () => {
    if (!submitContent.trim()) {
      toast({
        title: '오류',
        description: '제출 내용은 필수입니다.',
        variant: 'destructive',
      });
      return;
    }

    submitMutation.mutate(
      {
        content: submitContent,
        link: submitLink || undefined,
      },
      {
        onSuccess: async () => {
          setShowSuccessDialog(true);
          setSubmitContent('');
          setSubmitLink('');
          setIsEditingSubmission(false);
          // 제출 상태 갱신
          await refetchSubmission();
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : '제출에 실패했습니다.';
          toast({
            title: '오류',
            description: message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  // 과제 상태 변경 핸들러
  const handleStatusChange = (newStatus: 'draft' | 'published' | 'closed') => {
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
          {/* 강사만 관리 버튼 표시 */}
          {profile?.role === 'instructor' && (
            <div className="flex gap-2">
              {/* 상태 변경 버튼 */}
              {assignment.status === 'draft' && (
                <Button
                  variant="default"
                  className="gap-2"
                  onClick={() => handleStatusChange('published')}
                  disabled={updateStatusMutation.isPending}
                >
                  <Play className="h-4 w-4" />
                  발행
                </Button>
              )}
              {assignment.status === 'published' && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handleStatusChange('closed')}
                  disabled={updateStatusMutation.isPending}
                >
                  <Lock className="h-4 w-4" />
                  마감
                </Button>
              )}
              {/* 수정 버튼 */}
              <Link href={`/courses/${courseId}/assignments/${assignmentId}/edit`}>
                <Button className="gap-2">
                  <Edit className="h-4 w-4" />
                  수정
                </Button>
              </Link>
            </div>
          )}
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

        {/* 제출물 - 강사는 제출 폼 숨김 */}
        {profile?.role !== 'instructor' && assignment?.status === 'published' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>과제 제출</CardTitle>
                {userSubmission && (
                  <Badge className="bg-green-100 text-green-800">제출 완료</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {userSubmission && !isEditingSubmission ? (
                // 제출 완료 상태 (읽기 모드)
                <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">제출 내용</p>
                    <div className="p-3 bg-white border border-slate-200 rounded-md text-slate-700 whitespace-pre-wrap">
                      {userSubmission.content}
                    </div>
                  </div>
                  {userSubmission.link && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">관련 링크</p>
                      <a
                        href={userSubmission.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        {userSubmission.link}
                      </a>
                    </div>
                  )}
                  <div className="text-sm text-slate-600">
                    <p>제출일: {new Date(userSubmission.submittedAt).toLocaleString('ko-KR')}</p>
                    {userSubmission.isLate && (
                      <p className="text-red-600 font-medium">지각 제출</p>
                    )}
                  </div>
                  <Button
                    variant="default"
                    onClick={() => {
                      setSubmitContent(userSubmission.content);
                      setSubmitLink(userSubmission.link || '');
                      setIsEditingSubmission(true);
                    }}
                    className="w-full gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    수정하기
                  </Button>
                </div>
              ) : (
                // 미제출 상태
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      제출 내용 <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      value={submitContent}
                      onChange={(e) => setSubmitContent(e.target.value)}
                      placeholder="과제 내용을 입력하세요"
                      className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={6}
                      disabled={submitMutation.isPending}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      관련 링크 (선택사항)
                    </label>
                    <input
                      type="url"
                      value={submitLink}
                      onChange={(e) => setSubmitLink(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={submitMutation.isPending}
                    />
                  </div>

                  {new Date() > new Date(assignment.dueDate) && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        마감일을 넘었습니다. {assignment.allowLate ? '지각 제출이 허용됩니다.' : '지각 제출은 허용되지 않습니다.'}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubmit}
                      disabled={submitMutation.isPending || !submitContent.trim()}
                      className="flex-1 gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {submitMutation.isPending ? '제출 중...' : isEditingSubmission ? '수정 제출' : '제출하기'}
                    </Button>
                    {isEditingSubmission && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditingSubmission(false);
                          setSubmitContent('');
                          setSubmitLink('');
                        }}
                        disabled={submitMutation.isPending}
                        className="flex-1"
                      >
                        취소
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* 강사용 제출물 안내 */}
        {profile?.role === 'instructor' && (
          <Card>
            <CardHeader>
              <CardTitle>제출물</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                <p className="text-sm">학생 제출물 관리는 과제 관리 페이지에서 진행하세요.</p>
                <Link href={`/courses/${courseId}/assignments/${assignmentId}/submissions`}>
                  <Button variant="outline" className="mt-4">
                    제출물 관리
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 제출 성공 Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <DialogTitle>제출 완료</DialogTitle>
                  <DialogDescription>
                    과제가 성공적으로 제출되었습니다.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <div className="rounded-lg bg-green-50 p-4 text-sm text-green-900">
                <p className="font-medium mb-1">✓ {isEditingSubmission ? '수정 제출 완료' : '제출 완료'}</p>
                <p className="text-green-800">
                  과제가 제출되었으며, 강사가 검토하면 피드백을 받을 수 있습니다.
                </p>
              </div>
            </div>
            <DialogFooter className="flex gap-2 sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setShowSuccessDialog(false)}
              >
                닫기
              </Button>
              <Link href="/dashboard">
                <Button className="gap-2">
                  대시보드로 돌아가기
                </Button>
              </Link>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

