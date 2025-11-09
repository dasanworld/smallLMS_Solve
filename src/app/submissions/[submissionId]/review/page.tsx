'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { SubmissionDetails } from '@/features/grade/components/submission-details';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { SubmissionGradingData } from '@/features/grade/types';

export default function ReviewSubmissionPage() {
  const { submissionId } = useParams();
  const router = useRouter();
  const [submission, setSubmission] = useState<SubmissionGradingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ensure submissionId is a string
  const submissionIdString = Array.isArray(submissionId) ? submissionId[0] : submissionId;

  useEffect(() => {
    if (!submissionIdString) return;

    const fetchSubmission = async () => {
      try {
        const response = await fetch(`/api/submissions/${submissionIdString}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to fetch submission');
        }

        const data = await response.json();
        setSubmission(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmission();
  }, [submissionIdString]);

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SubmissionDetails submission={submission} />
        </div>

        <div>
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
        </div>
      </div>
    </div>
  );
}
