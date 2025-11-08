'use client';

import { GradeResponse } from '@/features/grade/lib/dto';
import { CourseGrades } from '@/features/grade/components/CourseGrades';

interface GradeOverviewProps {
  grades: GradeResponse;
}

export const GradeOverview = ({ grades }: GradeOverviewProps) => {
  const { assignments, courseTotals } = grades;

  if (assignments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Grades</h2>
        <p className="text-gray-600">No assignments have been graded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Course Totals Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Course Totals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courseTotals.map((course) => (
            <div 
              key={course.courseId} 
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <h3 className="font-medium text-gray-900">{course.courseTitle}</h3>
              <div className="mt-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Overall Grade</span>
                  <span>
                    {course.totalScore !== null 
                      ? `${course.totalScore.toFixed(1)}%` 
                      : 'N/A'}
                  </span>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: course.totalScore !== null 
                        ? `${Math.min(course.totalScore, 100)}%` 
                        : '0%' 
                    }}
                  ></div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {course.gradedCount} of {course.assignmentsCount} assignments graded
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Individual Course Grades */}
      <div className="space-y-6">
        {courseTotals.map((course) => {
          const courseAssignments = assignments.filter(
            assignment => assignment.courseId === course.courseId
          );
          
          return (
            <CourseGrades 
              key={course.courseId} 
              course={course} 
              assignments={courseAssignments} 
            />
          );
        })}
      </div>
    </div>
  );
};