'use client';

import { useParams } from 'next/navigation';
import { InstructorAssignmentPage } from '@/features/assignment/components/InstructorAssignmentPage';
import { useInstructorCoursesQuery } from '@/features/course/hooks/useCourseMutations';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function AssignmentsPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  const { data: courses = [], isLoading } = useInstructorCoursesQuery();
  const course = courses.find((c) => c.id === courseId);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">로딩 중...</span>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="flex items-center justify-center py-12 text-red-600">
            <p>해당 코스를 찾을 수 없습니다</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <InstructorAssignmentPage courseId={courseId} courseName={course.title} />
    </div>
  );
}
