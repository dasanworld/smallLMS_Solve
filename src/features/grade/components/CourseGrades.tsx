'use client';

import { CourseTotal } from '@/features/grade/lib/dto';
import { AssignmentGradeCard } from '@/features/grade/components/AssignmentGradeCard';

interface CourseGradesProps {
  course: CourseTotal;
  assignments: Array<{
    id: string;
    assignmentId: string;
    assignmentTitle: string;
    assignmentDescription: string;
    courseId: string;
    courseTitle: string;
    score: number | null;
    feedback: string | null;
    gradedAt: string | null;
    isLate: boolean;
    isResubmission: boolean;
    status: 'submitted' | 'graded' | 'resubmission_required';
    pointsWeight: number;
  }>;
}

export const CourseGrades = ({ course, assignments }: CourseGradesProps) => {
  if (assignments.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800">{course.courseTitle}</h2>
        <div className="mt-2 flex items-center text-sm text-gray-600">
          <span className="mr-4">
            Overall: {course.totalScore !== null 
              ? `${course.totalScore.toFixed(1)}%` 
              : 'N/A'}
          </span>
          <span>
            {course.gradedCount} of {course.assignmentsCount} assignments graded
          </span>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <AssignmentGradeCard 
              key={assignment.id} 
              assignment={assignment} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};