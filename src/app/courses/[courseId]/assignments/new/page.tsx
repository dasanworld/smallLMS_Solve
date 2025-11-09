'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Check } from 'lucide-react';
import { AssignmentForm } from '@/features/assignment/components/AssignmentForm';
import type { Course } from '@/features/course/backend/schema';

export default function NewAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  // 강사의 모든 코스 조회
  const {
    data: courses = [],
    isLoading: coursesLoading,
  } = useQuery({
    queryKey: ['instructor-courses-list-new'],
    queryFn: async () => {
      try {
        console.log('📚 강사 코스 목록 조회 중...');
        const response = await apiClient.get<{ courses: Course[] }>('/api/courses');
        console.log('✅ 강사 코스 목록 조회 완료:', response.data.courses.length);
        return response.data.courses;
      } catch (err) {
        const message = extractApiErrorMessage(err, 'Failed to fetch courses.');
        console.error('❌ 코스 목록 조회 실패:', message);
        return [];
      }
    },
  });

  // 현재 코스 정보
  const currentCourse = courses.find(c => c.id === courseId);

  const handleSuccess = () => {
    router.push(`/courses/${courseId}/assignments`);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center gap-4">
          <Link href={`/courses/${courseId}/assignments`}>
            <Button variant="outline" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">새 과제 만들기</h1>
            <p className="text-slate-500 mt-1">
              {currentCourse ? `${currentCourse.title} - 학생들을 위한 새로운 과제를 생성하세요` : '학생들을 위한 새로운 과제를 생성하세요'}
            </p>
          </div>
        </div>

        {/* 코스 목록 네비게이션 */}
        {courses.length > 1 && (
          <Card className="bg-slate-50">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">다른 코스에서 과제 만들기:</p>
                <div className="flex flex-wrap gap-2">
                  {courses.map((course) => (
                    <Link
                      key={course.id}
                      href={`/courses/${course.id}/assignments/new`}
                    >
                      <Button
                        variant={course.id === courseId ? 'default' : 'outline'}
                        size="sm"
                        className={course.id === courseId ? 'gap-2' : 'gap-1'}
                      >
                        {course.id === courseId && <Check className="h-4 w-4" />}
                        {course.title}
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 과제 폼 */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">과제 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <AssignmentForm 
              courseId={courseId}
              onSuccess={handleSuccess}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

