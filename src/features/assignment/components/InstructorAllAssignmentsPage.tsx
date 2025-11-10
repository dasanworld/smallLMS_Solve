'use client';

import { useState, useEffect, useCallback } from 'react';
import { useInstructorCoursesQuery } from '@/features/course/hooks/useCourseMutations';
import { useCourseAssignmentsQuery } from '../hooks/useAssignmentMutations';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { AssignmentResponse } from '../backend/schema';

interface AssignmentWithCourse extends AssignmentResponse {
  courseName: string;
  courseId: string;
}

interface CourseAssignmentsLoaderProps {
  courseId: string;
  courseName: string;
  onDataLoad: (assignments: AssignmentWithCourse[]) => void;
}

// Hook 호출을 분리한 서브 컴포넌트
const CourseAssignmentsLoader: React.FC<CourseAssignmentsLoaderProps> = ({
  courseId,
  courseName,
  onDataLoad,
}) => {
  const { data } = useCourseAssignmentsQuery(courseId);

  useEffect(() => {
    if (data?.assignments) {
      const assignmentsWithCourse = data.assignments.map((assignment) => ({
        ...assignment,
        courseName,
        courseId,
      }));
      onDataLoad(assignmentsWithCourse);
    }
  }, [data, courseName, courseId, onDataLoad]);

  return null;
};

export const InstructorAllAssignmentsPage = () => {
  const { data: courses = [], isLoading: coursesLoading, error: coursesError } = useInstructorCoursesQuery();
  const [allAssignments, setAllAssignments] = useState<AssignmentWithCourse[]>([]);
  const [courseAssignmentsMap, setCourseAssignmentsMap] = useState<Record<string, AssignmentWithCourse[]>>({});

  // 개별 코스의 과제 데이터 로드
  const handleCourseDataLoad = useCallback((assignments: AssignmentWithCourse[]) => {
    const courseId = assignments[0]?.courseId;
    if (courseId) {
      setCourseAssignmentsMap((prev) => ({
        ...prev,
        [courseId]: assignments,
      }));
    }
  }, []);

  // 모든 과제 데이터 수집
  useEffect(() => {
    const newAllAssignments: AssignmentWithCourse[] = [];

    Object.values(courseAssignmentsMap).forEach((assignments) => {
      newAllAssignments.push(...assignments);
    });

    setAllAssignments(newAllAssignments);
  }, [courseAssignmentsMap]);

  // 마감일 순으로 정렬
  const sortedAssignments = [...allAssignments].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  const upcomingAssignments = sortedAssignments.filter(
    (a) => new Date(a.dueDate) > new Date()
  );

  const pastAssignments = sortedAssignments.filter(
    (a) => new Date(a.dueDate) <= new Date()
  );

  const isLoadingAssignments = coursesLoading || Object.keys(courseAssignmentsMap).length < courses.length;

  if (coursesError) {
    return (
      <div className="space-y-6">
        <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">오류</h3>
            <p className="text-sm text-red-800">
              코스 목록을 불러올 수 없습니다
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 각 코스에 대해 Hook을 분리된 컴포넌트에서 호출 */}
      {courses.map((course) => (
        <CourseAssignmentsLoader
          key={course.id}
          courseId={course.id}
          courseName={course.title}
          onDataLoad={handleCourseDataLoad}
        />
      ))}

      <div>
        <h1 className="text-3xl font-bold tracking-tight">과제관리</h1>
        <p className="mt-2 text-gray-600">
          모든 코스의 과제를 한 곳에서 관리합니다
        </p>
      </div>

      {isLoadingAssignments ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">과제 목록을 불러오는 중...</span>
          </CardContent>
        </Card>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">아직 코스가 없습니다</h3>
              <p className="mt-2 text-sm text-gray-600">
                코스를 먼저 생성한 후 과제를 추가하세요
              </p>
              <Link href="/courses">
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  코스 생성
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : sortedAssignments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">아직 과제가 없습니다</h3>
              <p className="mt-2 text-sm text-gray-600">
                코스에서 과제를 생성하세요
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* 마감 예정 과제 */}
          {upcomingAssignments.length > 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">마감 예정 과제</h2>
                <p className="mt-1 text-sm text-gray-600">
                  {upcomingAssignments.length}개
                </p>
              </div>

              <div className="space-y-3">
                {upcomingAssignments.map((assignment) => (
                  <Link
                    key={assignment.id}
                    href={`/courses/${assignment.courseId}/assignments`}
                  >
                    <Card className="cursor-pointer transition-shadow hover:shadow-md">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-blue-600">
                              {assignment.courseName}
                            </p>
                            <h3 className="mt-1 font-semibold text-gray-900 line-clamp-2">
                              {assignment.title}
                            </h3>
                            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                              {assignment.description}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <Badge variant="secondary">{assignment.pointsWeight}점</Badge>
                            <p className="text-sm font-medium text-gray-700">
                              {format(parseISO(assignment.dueDate), 'MM/dd HH:mm', {
                                locale: ko,
                              })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 마감된 과제 */}
          {pastAssignments.length > 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">마감된 과제</h2>
                <p className="mt-1 text-sm text-gray-600">
                  {pastAssignments.length}개
                </p>
              </div>

              <div className="space-y-3">
                {pastAssignments.map((assignment) => (
                  <Link
                    key={assignment.id}
                    href={`/courses/${assignment.courseId}/assignments`}
                  >
                    <Card className="cursor-pointer opacity-75 transition-opacity hover:opacity-100">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-500">
                              {assignment.courseName}
                            </p>
                            <h3 className="mt-1 font-semibold text-gray-700 line-clamp-2">
                              {assignment.title}
                            </h3>
                          </div>

                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <Badge variant="outline">{assignment.pointsWeight}점</Badge>
                            <p className="text-sm font-medium text-gray-600">
                              {format(parseISO(assignment.dueDate), 'MM/dd HH:mm', {
                                locale: ko,
                              })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
