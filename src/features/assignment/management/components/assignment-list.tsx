"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Assignment } from "@/types/supabase";
import { AssignmentCard } from "./assignment-card";
import { AssignmentStatusBadge } from "./status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusIcon, ReloadIcon } from "@radix-ui/react-icons";

interface AssignmentListProps {
  courseId: string;
}

export function AssignmentList({ courseId }: AssignmentListProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, [courseId]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/courses/${courseId}/assignments`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to fetch assignments");
      }
      
      const data = await response.json();
      setAssignments(data.assignments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md">
          <p>Error: {error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={fetchAssignments}
          >
            <ReloadIcon className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-6 w-3/4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex items-center gap-2 mt-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Assignments</h2>
        <Button asChild>
          <Link href={`/courses/${courseId}/assignments/new`}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Assignment
          </Link>
        </Button>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No assignments found. Create your first assignment to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
          {assignments.map((assignment) => (
            <AssignmentCard 
              key={assignment.id} 
              assignment={assignment} 
              onStatusChange={fetchAssignments}
            />
          ))}
        </div>
      )}

      <div className="flex justify-between items-center pt-4">
        <div className="text-sm text-muted-foreground">
          Showing {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <AssignmentStatusBadge status="draft" />
            <span className="text-sm">Draft</span>
          </div>
          <div className="flex items-center gap-2">
            <AssignmentStatusBadge status="published" />
            <span className="text-sm">Published</span>
          </div>
          <div className="flex items-center gap-2">
            <AssignmentStatusBadge status="closed" />
            <span className="text-sm">Closed</span>
          </div>
        </div>
      </div>
    </div>
  );
}