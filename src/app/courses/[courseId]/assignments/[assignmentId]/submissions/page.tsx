"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { SubmissionsList } from "@/features/grade/components/submissions-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { SubmissionGradingData } from "@/features/grade/types";
import Link from "next/link";

export default function AssignmentSubmissionsPage() {
  const { assignmentId, courseId } = useParams();
  const [submissions, setSubmissions] = useState<SubmissionGradingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assignmentId) return;

    const fetchSubmissions = async () => {
      try {
        const response = await fetch(`/api/assignments/${assignmentId}/submissions`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Failed to fetch submissions");
        }

        const data = await response.json();
        setSubmissions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissions();
  }, [assignmentId]);

  if (!assignmentId || !courseId) {
    return <div>Assignment ID and Course ID are required</div>;
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
          <p>Error: {error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => window.history.back()}
          >
            Go Back
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
            Back to Course
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Assignment Submissions</h1>
          <p className="text-muted-foreground">
            Course ID: {courseId} | Assignment ID: {assignmentId}
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