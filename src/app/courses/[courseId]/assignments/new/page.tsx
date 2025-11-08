"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { AssignmentForm } from "../../components/assignment-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReloadIcon } from "@radix-ui/react-icons";

export default function CreateAssignmentPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ensure courseId is a string
  const courseIdString = Array.isArray(courseId) ? courseId[0] : courseId;

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/courses/${courseIdString}/assignments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to create assignment");
      }

      // Redirect to the assignment list page after successful creation
      router.push(`/courses/${courseIdString}/assignments`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!courseIdString) {
    return <div>Course ID is required</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Create New Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          )}
          <AssignmentForm 
            courseId={courseIdString} 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting}
            submitButtonText={isSubmitting ? "Creating..." : "Create Assignment"}
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
    </div>
  );
}