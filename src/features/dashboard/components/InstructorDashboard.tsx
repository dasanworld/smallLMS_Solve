'use client';

import { useInstructorDashboardQuery } from '@/features/dashboard/hooks/useInstructorDashboardQuery';
import { DashboardMetrics } from '@/features/dashboard/components/DashboardMetrics';
import { CourseStatusCard } from '@/features/dashboard/components/CourseStatusCard';
import { PendingGradingCounter } from '@/features/dashboard/components/PendingGradingCounter';
import { RecentSubmissionsList } from '@/features/dashboard/components/RecentSubmissionsList';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Users, BookOpen, FileText, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function InstructorDashboard() {
  const { data, isLoading, error } = useInstructorDashboardQuery();

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading dashboard data: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Dashboard Metrics Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>

        {/* Pending Grading Counter Skeleton */}
        <Skeleton className="h-20 w-full rounded-xl" />

        {/* Courses Section Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Submissions Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { courses = [], pendingGradingCount = 0, recentSubmissions = [] } = data || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Instructor Dashboard</h1>
        <p className="text-muted-foreground">Manage your courses and assignments</p>
      </div>

      {/* Dashboard Metrics */}
      <DashboardMetrics 
        coursesCount={courses.length}
        pendingGradingCount={pendingGradingCount}
        enrollmentCount={courses.reduce((sum, course) => sum + course.enrollmentCount, 0)}
        assignmentCount={courses.reduce((sum, course) => sum + course.assignmentCount, 0)}
      />

      {/* Pending Grading Counter */}
      <PendingGradingCounter count={pendingGradingCount} />

      {/* Courses Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Courses</CardTitle>
            <Badge variant="secondary">{courses.length} courses</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="mx-auto h-12 w-12" />
              <p className="mt-2">You don't have any courses yet.</p>
              <p className="text-sm">Create a course to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => (
                <CourseStatusCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Submissions Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Submissions</CardTitle>
            <Badge variant="secondary">{recentSubmissions.length} submissions</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {recentSubmissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12" />
              <p className="mt-2">No recent submissions.</p>
              <p className="text-sm">Submissions will appear here when students submit work.</p>
            </div>
          ) : (
            <RecentSubmissionsList submissions={recentSubmissions} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}