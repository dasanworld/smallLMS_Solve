"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { GradeSubmissionForm } from "../components/grade-submission-form";
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

export default function GradeSubmissionPage() {
  const { submissionId } = useParams();
  const router = useRouter();
  const [submission, setSubmission] = useState<any>(null);
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
        const response = await fetch(`/api/submissions/${submissionIdString}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Failed to fetch submission");
        }
        
        const data = await response.json();
        setSubmission(data.submission);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
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
      const response = await fetch(`/api/submissions/${submissionIdString}/grade`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to grade submission");
      }

      // Show success alert before redirecting
      setShowGradeAlert(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAlertClose = () => {
    setShowGradeAlert(false);
    // Redirect to the assignment submissions page after successful grading
    if (submission) {
      router.push(`/courses/${submission.assignment.course_id}/assignments/${submission.assignment_id}/submissions`);
      router.refresh();
    }
  };

  if (!submissionIdString) {
    return <div>Submission ID is required</div>;
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
          <p>Error: {error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!submission) {
    return <div>Submission not found</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Grade Submission: {submission.user_id}</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          )}
          
          <div className="mb-6 p-4 bg-muted rounded-md">
            <h3 className="font-semibold mb-2">Submission Content</h3>
            <p className="whitespace-pre-wrap">{submission.content}</p>
          </div>
          
          <GradeSubmissionForm 
            submissionId={submissionIdString} 
            initialGrade={submission.grade}
            initialFeedback={submission.feedback}
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting}
            submitButtonText={isSubmitting ? "Grading..." : "Submit Grade"}
          />
          <div className="mt-4 flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <AlertDialog open={showGradeAlert} onOpenChange={setShowGradeAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Grade Submitted</AlertDialogTitle>
            <AlertDialogDescription>
              The submission has been successfully graded with a score of {submission.grade}%. 
              The student will be notified of the grade.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleAlertClose}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}