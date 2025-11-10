'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useInstructorCoursesQuery } from '@/features/course/hooks/useCourseMutations';
import { useCourseAssignmentsQuery } from '../hooks/useAssignmentMutations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, Plus, Edit2, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { AssignmentResponse } from '../backend/schema';
import { AssignmentModalDialog } from './AssignmentModalDialog';

interface AssignmentWithCourse extends AssignmentResponse {
  courseName: string;
  courseId: string;
}

interface CourseAssignmentsLoaderProps {
  courseId: string;
  courseName: string;
  onDataLoad: (courseId: string, assignments: AssignmentWithCourse[]) => void;
  onError: (courseId: string, error: Error) => void;
}

// Hook 호출을 분리한 서브 컴포넌트
const CourseAssignmentsLoader: React.FC<CourseAssignmentsLoaderProps> = ({
  courseId,
  courseName,
  onDataLoad,
  onError,
}) => {
  const { data, isLoading, error } = useCourseAssignmentsQuery(courseId);

  useEffect(() => {
    // 에러 처리
    if (error && !isLoading) {
      onError(courseId, error);
      return;
    }

    // 데이터가 준비되었을 때만 처리
    if (!isLoading && data?.assignments && Array.isArray(data.assignments)) {
      const assignmentsWithCourse = data.assignments.map((assignment) => ({
        ...assignment,
        courseName,
        courseId,
      }));
      onDataLoad(courseId, assignmentsWithCourse);
    } else if (!isLoading && data) {
      // 데이터는 있지만 assignments가 없거나 배열이 아닌 경우 (빈 과제 목록)
      onDataLoad(courseId, []);
    }
  }, [data, courseName, courseId, onDataLoad, onError, isLoading, error]);

  return null;
};

export const InstructorAllAssignmentsPage = () => {
  const router = useRouter();
  const { data: courses = [], isLoading: coursesLoading, error: coursesError } = useInstructorCoursesQuery();
  const [courseAssignmentsMap, setCourseAssignmentsMap] = useState<Record<string, AssignmentWithCourse[]>>({});
  const [loadedCourseIds, setLoadedCourseIds] = useState<Set<string>>(new Set());
  const [courseErrors, setCourseErrors] = useState<Record<string, Error>>({});
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentResponse | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<{ id: string; name: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 개별 코스의 과제 데이터 로드
  const handleCourseDataLoad = useCallback((courseId: string, assignments: AssignmentWithCourse[]) => {
    setCourseAssignmentsMap((prev) => ({
      ...prev,
      [courseId]: assignments,
    }));

    setLoadedCourseIds((prev) => new Set([...prev, courseId]));

    // 에러 상태 초기화
    setCourseErrors((prev) => {
      const updated = { ...prev };
      delete updated[courseId];
      return updated;
    });
  }, []);

  // 코스 데이터 로드 실패 처리
  const handleCourseDataError = useCallback((courseId: string, error: Error) => {
    setCourseErrors((prev) => ({
      ...prev,
      [courseId]: error,
    }));

    setLoadedCourseIds((prev) => new Set([...prev, courseId]));
  }, []);

  // 과제 카드 클릭 핸들러 (읽기 전용)
  const handleAssignmentCardClick = useCallback((assignment: AssignmentWithCourse) => {
    setSelectedAssignment(assignment);
    setSelectedCourse({ id: assignment.courseId, name: assignment.courseName });
    setIsModalOpen(true);
  }, []);

  // 초안 과제 수정 (과제 관리 페이지로 이동)
  const handleEditDraft = useCallback((assignment: AssignmentWithCourse) => {
    router.push(`/courses/${assignment.courseId}/assignments`);
  }, [router]);

  // 모달 닫기 핸들러
  const handleModalOpenChange = useCallback((open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setSelectedAssignment(null);
      setSelectedCourse(null);
    }
  }, []);

  // 모든 과제 수집
  const allAssignments = Object.values(courseAssignmentsMap).flat();

  // 마감일 순으로 정렬
  const sortedAssignments = [...allAssignments].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  // 초안 과제
  const draftAssignments = sortedAssignments.filter(
    (a) => a.status === 'draft'
  );

  // 마감 예정 과제 (초안 제외)
  const upcomingAssignments = sortedAssignments.filter(
    (a) => a.status !== 'draft' && new Date(a.dueDate) > new Date()
  );

  // 마감된 과제
  const closedAssignments = sortedAssignments.filter(
    (a) => a.status === 'closed'
  );

  // 모든 코스가 로드되었는지 확인 (에러가 있어도 로드 완료로 간주)
  const isLoadingAssignments = coursesLoading || loadedCourseIds.size < courses.length;

  // 로드 완료 후 과제가 모두 로드되지 않은 경우만 에러 표시
  const hasLoadErrors = Object.keys(courseErrors).length > 0;

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
          onError={handleCourseDataError}
        />
      ))}

      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">전체 과제 관리</h1>
        <p className="mt-2 text-gray-600">
          모든 코스의 과제를 한 곳에서 관리합니다
        </p>
      </div>

      {/* 일부 코스에서 과제 로드 실패한 경우 경고 표시 */}
      {hasLoadErrors && !isLoadingAssignments && (
        <Card>
          <CardContent className="flex gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-900">일부 과제를 불러올 수 없습니다</h3>
              <p className="text-sm text-yellow-800 mt-1">
                {Object.keys(courseErrors).length}개 코스의 과제 목록을 불러오지 못했습니다. 페이지를 새로고침해주세요.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
          {/* 초안 과제 섹션 */}
          {draftAssignments.length > 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">초안 과제</h2>
                <p className="mt-1 text-sm text-gray-600">
                  {draftAssignments.length}개 (아직 공개되지 않음)
                </p>
              </div>

              <div className="space-y-3">
                {draftAssignments.map((assignment) => (
                  <Card key={assignment.id} className="border-amber-200 bg-amber-50">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-amber-700">
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
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                            초안
                          </Badge>
                          <p className="text-sm font-medium text-gray-700">
                            {format(parseISO(assignment.dueDate), 'MM/dd HH:mm', {
                              locale: ko,
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 border-t mt-4 pt-4">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleEditDraft(assignment)}
                          className="flex-1"
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          수정
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* 마감 예정 과제 섹션 */}
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
                  <button
                    key={assignment.id}
                    onClick={() => handleAssignmentCardClick(assignment)}
                    className="w-full text-left"
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
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 과목별 과제 현황 섹션 */}
          {courses.length > 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">과목별 과제 현황</h2>
                <p className="mt-1 text-sm text-gray-600">
                  각 과목의 과제를 관리하세요
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map((course) => {
                  const courseAssignments = courseAssignmentsMap[course.id] || [];
                  const draftCount = courseAssignments.filter(a => a.status === 'draft').length;
                  const publishedCount = courseAssignments.filter(a => a.status !== 'draft' && a.status !== 'closed').length;
                  const closedCount = courseAssignments.filter(a => a.status === 'closed').length;

                  return (
                    <Card key={course.id}>
                      <CardHeader>
                        <CardTitle className="flex items-start justify-between gap-4">
                          <span className="flex-1 line-clamp-2">{course.title}</span>
                          <Badge variant="secondary">{courseAssignments.length}</Badge>
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-3 text-center text-sm">
                          <div className="rounded-lg bg-blue-50 p-2">
                            <p className="text-blue-600 font-semibold">{publishedCount}</p>
                            <p className="text-xs text-blue-600">공개</p>
                          </div>
                          <div className="rounded-lg bg-amber-50 p-2">
                            <p className="text-amber-600 font-semibold">{draftCount}</p>
                            <p className="text-xs text-amber-600">초안</p>
                          </div>
                          <div className="rounded-lg bg-gray-100 p-2">
                            <p className="text-gray-600 font-semibold">{closedCount}</p>
                            <p className="text-xs text-gray-600">마감</p>
                          </div>
                        </div>

                        {courseAssignments.length > 0 && (
                          <div className="space-y-2 border-t pt-3">
                            <p className="text-xs font-semibold text-gray-600">최근 과제</p>
                            <div className="space-y-1 max-h-24 overflow-y-auto">
                              {courseAssignments.slice(0, 3).map((assignment) => (
                                <p key={assignment.id} className="text-xs text-gray-600 line-clamp-1">
                                  • {assignment.title}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        <Link href={`/courses/${course.id}/assignments`}>
                          <Button variant="outline" size="sm" className="w-full">
                            <BookOpen className="mr-2 h-4 w-4" />
                            개별 과제 관리
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* 마감된 과제 섹션 */}
          {closedAssignments.length > 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">마감된 과제</h2>
                <p className="mt-1 text-sm text-gray-600">
                  {closedAssignments.length}개
                </p>
              </div>

              <div className="space-y-3">
                {closedAssignments.map((assignment) => (
                  <button
                    key={assignment.id}
                    onClick={() => handleAssignmentCardClick(assignment)}
                    className="w-full text-left"
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
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 과제 상세 정보 모달 */}
      {selectedAssignment && selectedCourse && (
        <AssignmentModalDialog
          isOpen={isModalOpen}
          onOpenChange={handleModalOpenChange}
          assignment={selectedAssignment}
          courseId={selectedCourse.id}
          courseName={selectedCourse.name}
          onSuccess={() => {
            handleModalOpenChange(false);
          }}
        />
      )}
    </div>
  );
};
