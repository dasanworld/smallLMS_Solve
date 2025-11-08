'use client';

import { useGrades } from '@/features/grade/hooks/useGrades';
import { GradeOverview } from '@/features/grade/components/GradeOverview';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function GradesPage() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useGrades();

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <p>Loading grades...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            <div className="font-medium">Error Loading Grades</div>
            <div>{error.message || "An error occurred while loading your grades."}</div>
          </AlertDescription>
        </Alert>
        <div className="mt-4 flex gap-4">
          <Button onClick={() => refetch()}>Retry</Button>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert className="border-blue-200 bg-blue-50">
          <AlertDescription className="text-blue-800">
            <div className="font-medium">No Grades Available</div>
            <div>You don't have any grades yet. Submit assignments to receive grades.</div>
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.push('/courses')}>
            Browse Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Grade & Feedback</h1>
        <p className="text-gray-600 mt-2">
          View your assignment grades, instructor feedback, and course totals
        </p>
      </div>

      <GradeOverview grades={data} />
    </div>
  );
}