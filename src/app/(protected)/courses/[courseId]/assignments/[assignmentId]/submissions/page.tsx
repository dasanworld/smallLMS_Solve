"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { SubmissionsList } from "@/features/grade/components/submissions-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { SubmissionGradingData } from "@/features/grade/types";
import Link from "next/link";
import { apiClient } from "@/lib/remote/api-client";

export default function AssignmentSubmissionsPage() {
  const { assignmentId, courseId } = useParams();
  const [submissions, setSubmissions] = useState<SubmissionGradingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assignmentId) return;

    const fetchSubmissions = async () => {
      try {
        const { data } = await apiClient.get<SubmissionGradingData[]>(
          `/api/assignments/${assignmentId}/submissions`
        );
        setSubmissions(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "오류가 발생했습니다";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissions();
  }, [assignmentId]);

  if (!assignmentId || !courseId) {
    return <div>과제 ID와 코스 ID가 필요합니다</div>;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/4 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 w-full bg-gray-200 rounded"></div>
            ))}
          </div>
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
            onClick={() => window.history.back()}
          >
            뒤로 가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/courses/${courseId}`} passHref>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            코스로 돌아가기
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">제출물 목록</h1>
          <p className="text-muted-foreground">
            코스 ID: {courseId} | 과제 ID: {assignmentId}
          </p>
        </div>
      </div>

      <SubmissionsList
        submissions={submissions}
        assignmentId={assignmentId as string}
        courseId={courseId as string}
      />
    </div>
  );
}
