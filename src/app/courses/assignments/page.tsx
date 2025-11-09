'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useUpdateAssignmentStatusMutation } from '@/features/assignment/hooks/useAssignmentMutations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Plus, FileText, BookOpen, Filter, Play, Lock, Send } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AssignmentResponse } from '@/features/assignment/lib/dto';
import type { Course } from '@/features/course/backend/schema';
import type { UserProfileResponse } from '@/features/auth/backend/profile-service';

interface CourseWithAssignments extends Course {
  assignments: AssignmentResponse[];
  assignmentCount: number;
}

interface UserSubmission {
  id: string;
  status: 'submitted' | 'graded' | 'resubmission_required';
  score: number | null;
  submittedAt: string;
}

type UserRole = 'instructor' | 'learner' | 'operator';

export default function AllAssignmentsPage() {
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userSubmissions, setUserSubmissions] = useState<Map<string, UserSubmission>>(new Map());
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const updateStatusMutation = useUpdateAssignmentStatusMutation();

  // 사용자 프로필 조회 (role 포함)
  const { data: profile } = useQuery<UserProfileResponse | null>({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const response = await apiClient.get<UserProfileResponse>('/api/auth/profile');
        return response.data;
      } catch (err) {
        console.error('프로필 조회 실패:', extractApiErrorMessage(err, 'Failed to fetch profile'));
        return null;
      }
    },
    enabled: !!user?.id && mounted,
    retry: 1,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (profile?.role) {
      setUserRole((profile.role as UserRole) || 'learner');
    }
  }, [profile]);

  // 러너의 제출 정보 조회는 나중에 정의된 coursesWithAssignments를 사용하므로 별도 처리
  // coursesWithAssignments가 로드된 후에 실행하기 위해 다른 위치에서 처리

  // 과제 상태 변경 핸들러
  const handleStatusChange = (assignmentId: string, newStatus: 'draft' | 'published' | 'closed') => {
    updateStatusMutation.mutate(
      { assignmentId, status: newStatus },
      {
        onSuccess: () => {
          const statusLabel = newStatus === 'published' ? '발행' : newStatus === 'closed' ? '마감' : '초안';
          toast({
            title: '성공',
            description: `과제가 ${statusLabel} 상태로 변경되었습니다.`,
          });
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : '상태 변경에 실패했습니다.';
          toast({
            title: '오류',
            description: message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  // 역할별 코스 조회 (강사는 관리 코스, 러너는 등록 코스)
  const {
    data: courses = [],
    isLoading: coursesLoading,
  } = useQuery({
    queryKey: ['user-courses', userRole],
    queryFn: async () => {
      try {
        if (userRole === 'instructor') {
          console.log('📚 강사 코스 목록 조회 중...');
          const response = await apiClient.get<{ courses: Course[] }>('/api/courses');
          console.log('✅ 강사 코스 목록 조회 완료:', response.data.courses.length);
          return response.data.courses;
        } else if (userRole === 'learner') {
          console.log('📚 러너 등록 코스 목록 조회 중...');
          const response = await apiClient.get<{ enrollments: Array<{ courses: Course }> }>('/api/enrollments/me');
          const enrolledCourses = response.data.enrollments
            .filter(e => e.courses) // courses 필드 존재 확인
            .map(e => e.courses);
          console.log('✅ 러너 등록 코스 목록 조회 완료:', enrolledCourses.length);
          return enrolledCourses;
        }
        return [];
      } catch (err) {
        const message = extractApiErrorMessage(err, 'Failed to fetch courses.');
        console.error('❌ 코스 목록 조회 실패:', message);
        throw new Error(message);
      }
    },
    enabled: !!userRole,
  });

  // 모든 코스의 과제 조회
  const {
    data: coursesWithAssignments = [],
    isLoading: assignmentsLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ['all-assignments', courses.map(c => c.id).join(',')],
    queryFn: async () => {
      try {
        if (courses.length === 0) return [];

        console.log('📋 모든 과제 목록 조회 중...');
        const results = await Promise.all(
          courses.map(async (course) => {
            try {
              const response = await apiClient.get<{
                data: AssignmentResponse[];
                total: number;
              }>(`/api/courses/${course.id}/assignments`);
              return {
                ...course,
                assignments: response.data.data || [],
                assignmentCount: response.data.total || 0,
              };
            } catch (err) {
              console.warn(`Failed to fetch assignments for course ${course.id}:`, err);
              return {
                ...course,
                assignments: [],
                assignmentCount: 0,
              };
            }
          })
        );
        console.log('✅ 모든 과제 목록 조회 완료');
        return results;
      } catch (err) {
        const message = extractApiErrorMessage(err, 'Failed to fetch assignments.');
        console.error('❌ 과제 목록 조회 실패:', message);
        throw new Error(message);
      }
    },
    enabled: courses.length > 0,
  });

  // 필터링된 과제 목록
  const filteredCourses = selectedCourseId === 'all'
    ? coursesWithAssignments.filter(c => c.assignmentCount > 0)
    : coursesWithAssignments.filter(c => c.id === selectedCourseId);

  const totalAssignments = filteredCourses.reduce(
    (sum, course) => sum + course.assignmentCount,
    0
  );

  const isLoading = coursesLoading || assignmentsLoading;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div>
          <Skeleton className="h-8 w-1/4 mb-2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError && error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">모든 과제</h1>
          <p className="text-slate-500 mt-1">모든 코스의 과제를 한눈에 관리하세요</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-2">
            <span className="font-semibold">과제 목록을 불러올 수 없습니다</span>
            <span className="text-sm">
              {error instanceof Error ? error.message : '서버 오류가 발생했습니다.'}
            </span>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // 강사만 과제 생성 가능
  const isInstructor = userRole === 'instructor';
  const pageTitle = isInstructor ? '모든 과제' : '나의 과제';
  const pageDescription = isInstructor ? '모든 코스의 과제를 한눈에 관리하세요' : '등록한 코스의 과제를 확인하고 제출하세요';

  // coursesWithAssignments가 로드된 후 러너의 제출 정보 조회
  useEffect(() => {
    if (userRole === 'learner' && coursesWithAssignments.length > 0) {
      const fetchSubmissions = async () => {
        const submissions = new Map<string, UserSubmission>();

        for (const course of coursesWithAssignments) {
          for (const assignment of course.assignments) {
            try {
              const response = await apiClient.get<UserSubmission>(
                `/api/courses/${course.id}/assignments/${assignment.id}/my-submission`
              );
              submissions.set(assignment.id, response.data);
            } catch (err) {
              // 제출이 없는 경우 무시
              console.debug(`No submission found for assignment ${assignment.id}`);
            }
          }
        }

        setUserSubmissions(submissions);
      };

      fetchSubmissions();
    }
  }, [userRole, coursesWithAssignments]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
            <p className="text-slate-500 mt-1">{pageDescription}</p>
          </div>
          {isInstructor && (
            <Link href="/courses/assignments/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                새 과제 만들기
              </Button>
            </Link>
          )}
        </div>

        {/* 필터 및 통계 */}
        {courses.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="코스 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 과제 ({coursesWithAssignments.reduce((sum, c) => sum + c.assignmentCount, 0)})</SelectItem>
                  {coursesWithAssignments
                    .filter(c => c.assignmentCount > 0)
                    .map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title} ({course.assignmentCount})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600">
                총 <span className="font-semibold text-slate-900">{totalAssignments}</span>개
              </span>
            </div>
          </div>
        )}

        {/* 콘텐츠 */}
        {coursesWithAssignments.length === 0 || (selectedCourseId === 'all' && filteredCourses.length === 0) ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-slate-400 mb-3" />
              <h3 className="text-lg font-medium text-slate-900">
                {isInstructor ? '아직 과제가 없습니다' : '등록된 과제가 없습니다'}
              </h3>
              <p className="text-slate-500 text-sm mt-2 text-center max-w-xs">
                {isInstructor
                  ? '과제를 만들어서 학생들에게 과제를 부여하세요.'
                  : '강사가 공개한 과제를 기다리고 있습니다.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden">
                <CardHeader className="bg-slate-50 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <p className="text-sm text-slate-500 mt-1">
                        {course.assignmentCount}개의 과제
                      </p>
                    </div>
                    <Link href={`/courses/${course.id}/assignments`}>
                      <Button variant="outline" size="sm">
                        관리 →
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {course.assignments.length === 0 ? (
                    <div className="text-center py-6 text-slate-500">
                      <p className="text-sm">이 코스에 과제가 없습니다.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {course.assignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                          <Link
                            href={`/courses/${course.id}/assignments/${assignment.id}`}
                            className="flex-1"
                          >
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-slate-900">
                                {assignment.title}
                              </h4>
                              {isInstructor ? (
                                <Badge
                                  variant="outline"
                                  className={
                                    assignment.status === 'draft'
                                      ? 'bg-gray-100 text-gray-800'
                                      : assignment.status === 'published'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-slate-100 text-slate-800'
                                  }
                                >
                                  {assignment.status === 'draft'
                                    ? '초안'
                                    : assignment.status === 'published'
                                    ? '공개'
                                    : '종료'}
                                </Badge>
                              ) : (
                                assignment.status === 'published' && (
                                  <Badge className="bg-green-100 text-green-800">제출 가능</Badge>
                                )
                              )}
                            </div>
                            <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                              {assignment.description}
                            </p>
                          </Link>
                          <div className="flex items-center gap-2 ml-4">
                            {isInstructor ? (
                              <>
                                {/* 강사용: 상태 변경 버튼 */}
                                {assignment.status === 'draft' && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="gap-1"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleStatusChange(assignment.id, 'published');
                                    }}
                                  >
                                    <Play className="h-3 w-3" />
                                    발행
                                  </Button>
                                )}
                                {assignment.status === 'published' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleStatusChange(assignment.id, 'closed');
                                    }}
                                  >
                                    <Lock className="h-3 w-3" />
                                    마감
                                  </Button>
                                )}
                                <div className="text-sm text-slate-500 text-right min-w-24">
                                  {new Date(assignment.dueDate) < new Date() ? (
                                    <span className="text-red-600">마감됨</span>
                                  ) : (
                                    <span>
                                      {new Date(assignment.dueDate).toLocaleDateString('ko-KR')}
                                    </span>
                                  )}
                                </div>
                              </>
                            ) : (
                              <>
                                {/* 러너용: 제출 상태 및 버튼 */}
                                <div className="flex items-center gap-3">
                                  {userSubmissions.has(assignment.id) ? (
                                    <>
                                      {/* 제출 완료 상태 */}
                                      <div className="text-right">
                                        <div className="text-sm font-medium text-green-600">제출 완료</div>
                                        {userSubmissions.get(assignment.id)?.score !== null && userSubmissions.get(assignment.id)?.score !== undefined && (
                                          <div className="text-sm text-slate-600">
                                            점수: <span className="font-semibold">{userSubmissions.get(assignment.id)?.score}점</span>
                                          </div>
                                        )}
                                        {userSubmissions.get(assignment.id)?.status === 'resubmission_required' && (
                                          <div className="text-sm text-orange-600">재제출 필요</div>
                                        )}
                                      </div>
                                      {/* 재제출 또는 보기 버튼 */}
                                      {assignment.allowResubmission && assignment.status === 'published' && (
                                        <Link href={`/courses/${course.id}/assignments/${assignment.id}`}>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1"
                                          >
                                            <Send className="h-3 w-3" />
                                            재제출
                                          </Button>
                                        </Link>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      {/* 미제출 상태 */}
                                      {assignment.status === 'published' && (
                                        <Link href={`/courses/${course.id}/assignments/${assignment.id}`}>
                                          <Button
                                            variant="default"
                                            size="sm"
                                            className="gap-1"
                                          >
                                            <Send className="h-3 w-3" />
                                            과제 제출
                                          </Button>
                                        </Link>
                                      )}
                                    </>
                                  )}
                                </div>
                                <div className="text-sm text-slate-500 text-right min-w-24">
                                  {new Date(assignment.dueDate) < new Date() ? (
                                    <span className="text-red-600">마감됨</span>
                                  ) : (
                                    <span>
                                      {new Date(assignment.dueDate).toLocaleDateString('ko-KR')}
                                    </span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

