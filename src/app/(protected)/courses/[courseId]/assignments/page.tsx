'use client';

import { useParams } from 'next/navigation';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { type UserProfileResponse } from '@/features/auth/lib/dto';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { InstructorAssignmentPage } from '@/features/assignment/components/InstructorAssignmentPage';
import { LearnerCourseAssignmentsPage } from '@/features/assignment/components/LearnerCourseAssignmentsPage';
import { useEnrolledCoursesQuery } from '@/features/course/hooks/useLearnerCourseQueries';

const fetchUserProfile = async () => {
  try {
    const { data } = await apiClient.get('/api/auth/profile');
    return data;
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to fetch user profile.');
    throw new Error(message);
  }
};

/**
 * 역할별 과제 페이지
 * - 강사: 과제 관리 (생성/수정/삭제)
 * - 학생: 과제 조회 및 제출 (읽기 전용)
 */
export default function AssignmentsPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useCurrentUser();

  // Fetch user profile to get the role
  const {
    data: userProfile,
    isLoading: isProfileLoading,
    isError: isProfileError
  } = useQuery<UserProfileResponse>({
    queryKey: ['user-profile', user?.id],
    queryFn: () => fetchUserProfile(),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Instructor courses (only fetch if instructor)
  const { data: instructorCourses = [], isLoading: isInstructorLoading } = useQuery({
    queryKey: ['instructor-courses-assignments'],
    queryFn: async () => {
      const response = await apiClient.get<{ courses: any[] }>('/api/courses/my');
      return response.data.courses;
    },
    enabled: userProfile?.role === 'instructor',
  });
  const instructorCourse = instructorCourses.find((c) => c.id === courseId);

  // Learner courses (only fetch if learner)
  const { data: learnerCourses = [], isLoading: isLearnerLoading } = useEnrolledCoursesQuery();
  const learnerCourse = learnerCourses.find((c) => c.id === courseId);

  const isLoading = isAuthLoading || isProfileLoading || isInstructorLoading || isLearnerLoading;

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

  if (isProfileError || !userProfile) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="flex items-center justify-center py-12 text-red-600">
            <p>사용자 정보를 불러올 수 없습니다</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 강사 페이지
  if (userProfile.role === 'instructor') {
    if (!instructorCourse) {
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
        <InstructorAssignmentPage courseId={courseId} courseName={instructorCourse.title} />
      </div>
    );
  }

  // 학생 페이지
  if (userProfile.role === 'learner') {
    if (!learnerCourse) {
      return (
        <div className="container mx-auto py-10">
          <Card>
            <CardContent className="flex items-center justify-center py-12 text-red-600">
              <p>해당 코스를 찾을 수 없습니다. 먼저 코스에 수강신청하세요.</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="container mx-auto py-10">
        <LearnerCourseAssignmentsPage courseId={courseId} courseName={learnerCourse.title} />
      </div>
    );
  }

  // Unknown role
  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardContent className="flex items-center justify-center py-12 text-red-600">
          <p>알 수 없는 사용자 역할입니다</p>
        </CardContent>
      </Card>
    </div>
  );
}
