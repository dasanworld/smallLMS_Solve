"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface AssignmentStats {
  totalAssignments: number;
  publishedAssignments: number;
  draftAssignments: number;
}

interface SubmissionStats {
  totalSubmissions: number;
  gradedSubmissions: number;
  pendingSubmissions: number;
  averageGrade: number | null;
}

interface AssignmentStatsDashboardProps {
  courseId: string;
}

export function AssignmentStatsDashboard({ courseId }: AssignmentStatsDashboardProps) {
  const [assignmentStats, setAssignmentStats] = useState<AssignmentStats | null>(null);
  const [submissionStats, setSubmissionStats] = useState<SubmissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, [courseId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch assignment stats
      const assignmentResponse = await fetch(`/api/courses/${courseId}/assignments/stats`);
      if (!assignmentResponse.ok) {
        const errorData = await assignmentResponse.json();
        throw new Error(errorData.error?.message || "Failed to fetch assignment stats");
      }
      const assignmentData = await assignmentResponse.json();

      // For submission stats, we need to fetch all assignments and aggregate
      const assignmentsResponse = await fetch(`/api/courses/${courseId}/assignments`);
      if (!assignmentsResponse.ok) {
        const errorData = await assignmentsResponse.json();
        throw new Error(errorData.error?.message || "Failed to fetch assignments");
      }
      const assignmentsData = await assignmentsResponse.json();
      
      // For each assignment, fetch submission stats and aggregate
      let totalSubmissions = 0;
      let gradedSubmissions = 0;
      let pendingSubmissions = 0;
      let totalGrade = 0;
      let gradeCount = 0;
      
      for (const assignment of assignmentsData.assignments) {
        const subResponse = await fetch(`/api/assignments/${assignment.id}/submissions/stats`);
        if (subResponse.ok) {
          const subData = await subResponse.json();
          totalSubmissions += subData.stats.totalSubmissions;
          gradedSubmissions += subData.stats.gradedSubmissions;
          pendingSubmissions += subData.stats.pendingSubmissions;
          
          if (subData.stats.averageGrade !== null) {
            totalGrade += subData.stats.averageGrade;
            gradeCount++;
          }
        }
      }
      
      const averageGrade = gradeCount > 0 ? totalGrade / gradeCount : null;

      setAssignmentStats(assignmentData.stats);
      setSubmissionStats({
        totalSubmissions,
        gradedSubmissions,
        pendingSubmissions,
        averageGrade
      });
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
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                <Skeleton className="h-4 w-3/4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calculate completion percentage
  const assignmentCompletion = assignmentStats 
    ? assignmentStats.publishedAssignments / (assignmentStats.totalAssignments || 1) * 100
    : 0;
    
  const submissionGrading = submissionStats
    ? submissionStats.gradedSubmissions / (submissionStats.totalSubmissions || 1) * 100
    : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Course Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Assignment Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assignmentStats?.totalAssignments || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {assignmentStats?.publishedAssignments || 0} published
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {submissionStats?.totalSubmissions || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {submissionStats?.gradedSubmissions || 0} graded
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {submissionStats?.averageGrade !== null 
                ? `${submissionStats.averageGrade.toFixed(1)}%` 
                : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              Course average
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assignmentStats ? `${Math.round(assignmentCompletion)}%` : "0%"}
            </div>
            <Progress value={assignmentCompletion} className="mt-2" />
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Assignment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Published</span>
                  <span>{assignmentStats?.publishedAssignments || 0}</span>
                </div>
                <Progress 
                  value={assignmentStats ? assignmentStats.publishedAssignments / assignmentStats.totalAssignments * 100 : 0} 
                  className="h-2" 
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Draft</span>
                  <span>{assignmentStats?.draftAssignments || 0}</span>
                </div>
                <Progress 
                  value={assignmentStats ? assignmentStats.draftAssignments / assignmentStats.totalAssignments * 100 : 0} 
                  className="h-2" 
                  indicatorColor="bg-yellow-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Submission Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Graded</span>
                  <span>{submissionStats?.gradedSubmissions || 0}</span>
                </div>
                <Progress 
                  value={submissionStats ? submissionStats.gradedSubmissions / submissionStats.totalSubmissions * 100 : 0} 
                  className="h-2" 
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Pending</span>
                  <span>{submissionStats?.pendingSubmissions || 0}</span>
                </div>
                <Progress 
                  value={submissionStats ? submissionStats.pendingSubmissions / submissionStats.totalSubmissions * 100 : 0} 
                  className="h-2" 
                  indicatorColor="bg-yellow-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}