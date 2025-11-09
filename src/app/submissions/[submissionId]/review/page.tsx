'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { SubmissionDetails } from '@/features/grade/components/submission-details';
import { GradeSubmissionForm } from '@/features/grade/components/grade-submission-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/remote/api-client';
import { useGradeSubmission } from '@/features/grade/hooks/useGradeSubmission';
import { SubmissionGradingData } from '@/features/grade/types';

export default function ReviewSubmissionPage() {
  const { submissionId } = useParams();
  const router = useRouter();
  const [submission, setSubmission] = useState<SubmissionGradingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const { mutateAsync: gradeSubmission, isPending: isSubmitting } = useGradeSubmission();

  // Ensure submissionId is a string
  const submissionIdString = Array.isArray(submissionId) ? submissionId[0] : submissionId;

  useEffect(() => {
    if (!submissionIdString) return;

    const fetchSubmission = async () => {
      try {
        const response = await apiClient.get<SubmissionGradingData>(`/api/submissions/${submissionIdString}`);
        setSubmission(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmission();
  }, [submissionIdString]);

  const handleGradeSubmit = async (data: { score?: number; feedback?: string; action?: 'grade' | 'resubmission_required' }): Promise<void> => {
    try {
      await gradeSubmission({
        submissionId: submissionIdString,
        data: {
          score: data.score ?? 0,
          feedback: data.feedback ?? '',
          action: data.action ?? 'grade'
        }
      });

      const actionLabel = data.action === 'grade' ? '점수 제공' : '재제출 요청';
      setSuccessMessage(`${actionLabel}이 완료되었습니다.`);
      setShowSuccessDialog(true);

      // Refresh submission data
      setTimeout(() => {
        const fetchSubmission = async () => {
          try {
            const response = await apiClient.get<SubmissionGradingData>(`/api/submissions/${submissionIdString}`);
            setSubmission(response.data);
          } catch (err) {
            console.error('Failed to refresh submission:', err);
          }
        };
        fetchSubmission();
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`채점 중 오류가 발생했습니다: ${errorMessage}`);
    }
  };

  if (!submissionIdString) {
    return <div>Submission ID is required</div>;
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/4 bg-gray-200 rounded"></div>
          <div className="h-96 w-full bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            돌아가기
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            제출물을 찾을 수 없습니다.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 mb-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          돌아가기
        </Button>
        <h1 className="text-3xl font-bold">제출물 검토</h1>
        <p className="text-slate-500 mt-2">
          과제: {submission.assignment_title} | 강의: {submission.course_title}
        </p>
      </div>

      {/* Success Dialog */}
      {showSuccessDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-sm w-full animate-in fade-in zoom-in-95">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div>
                <h2 className="font-semibold text-lg text-slate-900">완료!</h2>
                <p className="text-slate-600 text-sm mt-1">{successMessage}</p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => router.back()}
                >
                  목록으로 돌아가기
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SubmissionDetails submission={submission} />
        </div>

        <div className="space-y-6">
          {/* 제출 정보 카드 */}
          <Card>
            <CardHeader>
              <CardTitle>제출 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-600 font-medium">상태</p>
                <div className="mt-1">
                  {submission.status === 'graded' && (
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      채점완료
                    </span>
                  )}
                  {submission.status === 'submitted' && (
                    <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      제출됨
                    </span>
                  )}
                  {submission.status === 'resubmission_required' && (
                    <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                      재제출 필요
                    </span>
                  )}
                </div>
              </div>

              {submission.score !== null && submission.score !== undefined && (
                <div>
                  <p className="text-sm text-slate-600 font-medium">점수</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {submission.score}점
                  </p>
                </div>
              )}

              {submission.feedback && (
                <div>
                  <p className="text-sm text-slate-600 font-medium mb-2">강사 피드백</p>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-700 whitespace-pre-wrap">
                    {submission.feedback}
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.back()}
              >
                돌아가기
              </Button>
            </CardContent>
          </Card>

          {/* 채점 폼 카드 */}
          {submission.status !== 'graded' && (
            <Card>
              <CardHeader>
                <CardTitle>채점하기</CardTitle>
              </CardHeader>
              <CardContent>
                <GradeSubmissionForm
                  submissionId={submission.id}
                  initialScore={submission.score}
                  initialFeedback={submission.feedback}
                  initialStatus={submission.status}
                  onSubmit={handleGradeSubmit}
                  isSubmitting={isSubmitting}
                />
              </CardContent>
            </Card>
          )}

          {/* 이미 채점된 경우 메시지 */}
          {submission.status === 'graded' && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                이 제출물은 이미 채점되었습니다.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
