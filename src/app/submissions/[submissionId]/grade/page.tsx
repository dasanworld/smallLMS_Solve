"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { GradeSubmissionForm } from "@/features/grade/components/grade-submission-form";
import { SubmissionDetails } from "@/features/grade/components/submission-details";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ReloadIcon } from "@radix-ui/react-icons";
import { SubmissionGradingData } from "@/features/grade/types";
import { apiClient } from "@/lib/remote/api-client";

export default function GradeSubmissionPage() {
  const { submissionId } = useParams();
  const router = useRouter();
  const [submission, setSubmission] = useState<SubmissionGradingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGradeAlert, setShowGradeAlert] = useState(false);

  // Ensure submissionId is a string
  const submissionIdString = Array.isArray(submissionId) ? submissionId[0] : submissionId;

  useEffect(() => {
    if (!submissionIdString) return;

    const fetchSubmission = async () => {
      try {
        const { data } = await apiClient.get<SubmissionGradingData>(
          `/api/submissions/${submissionIdString}`
        );
        setSubmission(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "오류가 발생했습니다");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmission();
  }, [submissionIdString]);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.put(`/api/submissions/${submissionIdString}/grade`, data);

      // Show success alert before redirecting
      setShowGradeAlert(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAlertClose = () => {
    setShowGradeAlert(false);
    // Redirect to the assignment submissions page after successful grading
    if (submission) {
      router.push(`/courses/${submission.assignment_id}/assignments/${submission.assignment_id}/submissions`);
      router.refresh();
    }
  };

  if (!submissionIdString) {
    return <div>제출물 ID가 필요합니다</div>;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/4 bg-gray-200 rounded"></div>
          <div className="h-96 w-full bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="p-4 bg-destructive/10 border border-destructive text-destructive p-4 rounded-md">
          <p>에러: {error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => router.back()}
          >
            뒤로 가기
          </Button>
        </div>
      </div>
    );
  }

  if (!submission) {
    return <div>제출물을 찾을 수 없습니다</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">점수 입력</h1>
        <p className="text-muted-foreground">
          과제: {submission.assignment_title} | 코스: {submission.course_title}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SubmissionDetails submission={submission} />
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>점수 입력</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md">
                  {error}
                </div>
              )}

              <GradeSubmissionForm
                submissionId={submissionIdString}
                initialScore={submission.score}
                initialFeedback={submission.feedback || undefined}
                initialStatus={submission.status}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                >
                  취소
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={showGradeAlert} onOpenChange={setShowGradeAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {submission.status === 'resubmission_required' ? '재제출 요청됨' : '점수 제출됨'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {submission.status === 'resubmission_required'
                ? "학생에게 과제 재제출 알림이 전송되었습니다."
                : `제출물이 ${submission.score}%의 점수로 성공적으로 평가되었습니다. 학생에게 점수 안내가 전송됩니다.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleAlertClose}>
              계속
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}