'use client';

import { useGrades } from '@/features/grade/hooks/useGrades';
import { GradeOverview } from '@/features/grade/components/GradeOverview';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

export default function GradesPage() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data, isLoading, error, refetch } = useGrades();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

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
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Grade & Feedback</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-10 w-10"
            title="데이터 새로고침"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="mt-2 text-gray-600">
          View your assignment grades, instructor feedback, and course totals
        </p>
      </div>

      <GradeOverview grades={data} />
    </div>
  );
}