"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { AssignmentForm } from "../../components/assignment-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReloadIcon } from "@radix-ui/react-icons";

export default function EditAssignmentPage() {
  const { courseId, assignmentId } = useParams();
  const router = useRouter();
  const [assignment, setAssignment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ensure courseId and assignmentId are strings
  const courseIdString = Array.isArray(courseId) ? courseId[0] : courseId;
  const assignmentIdString = Array.isArray(assignmentId) ? assignmentId[0] : assignmentId;

  useEffect(() => {
    if (!assignmentIdString) return;

    const fetchAssignment = async () => {
      try {
        const response = await fetch(`/api/assignments/${assignmentIdString}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Failed to fetch assignment");
        }
        
        const data = await response.json();
        setAssignment(data.assignment);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignment();
  }, [assignmentIdString]);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/assignments/${assignmentIdString}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to update assignment");
      }

      // Redirect to the assignment list page after successful update
      router.push(`/courses/${courseIdString}/assignments`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!courseIdString || !assignmentIdString) {
    return <div>Course ID and Assignment ID are required</div>;
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

  if (!assignment) {
    return <div>Assignment not found</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Edit Assignment: {assignment.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          )}
          <AssignmentForm 
            courseId={courseIdString} 
            initialData={assignment}
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting}
            submitButtonText={isSubmitting ? "Updating..." : "Update Assignment"}
          />
          <div className="mt-4 flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={async () => {
                if (confirm("Are you sure you want to delete this assignment?")) {
                  try {
                    const response = await fetch(`/api/assignments/${assignmentIdString}`, {
                      method: "DELETE",
                    });

                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(errorData.error?.message || "Failed to delete assignment");
                    }

                    router.push(`/courses/${courseIdString}/assignments`);
                    router.refresh();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "An error occurred");
                  }
                }
              }}
            >
              Delete Assignment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}