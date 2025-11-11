'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, Heart, ArrowRight } from 'lucide-react';
import { useAvailableCoursesQuery, useEnrollCourseMutation } from '../hooks/useLearnerCourseQueries';
import { extractApiErrorMessage } from '@/lib/remote/api-client';
import Link from 'next/link';

/**
 * 학습자용 코스 카탈로그
 * - 이용 가능한 (공개된) 코스 목록 표시
 * - 수강신청 기능
 */
export const LearnerCoursesCatalog = () => {
  const [page, setPage] = useState(1);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useAvailableCoursesQuery(page, 10);
  const enrollMutation = useEnrollCourseMutation();

  const courses = data?.courses || [];
  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  const handleEnroll = async (courseId: string) => {
    try {
      await enrollMutation.mutateAsync(courseId);
    } catch (err) {
      // 에러는 UI에서 처리됨
    }
  };

  const toggleFavorite = (courseId: string) => {
    setFavoriteIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">코스 둘러보기</h1>
          <p className="mt-2 text-gray-600">
            모든 활성 코스를 확인하고 수강신청하세요
          </p>
        </div>

        <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">오류</h3>
            <p className="text-sm text-red-800">
              {extractApiErrorMessage(error, '코스 목록을 불러올 수 없습니다')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">코스 둘러보기</h1>
        <p className="mt-2 text-gray-600">
          {data ? `총 ${data.total}개의 코스` : '모든 활성 코스를 확인하고 수강신청하세요'}
        </p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">코스 목록을 불러오는 중...</span>
          </CardContent>
        </Card>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">이용 가능한 코스가 없습니다</h3>
              <p className="mt-2 text-sm text-gray-600">
                나중에 다시 확인해주세요
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id} className="flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex gap-2 mb-2">
                        {course.category && (
                          <Badge variant="secondary" className="text-xs">
                            {course.category.name}
                          </Badge>
                        )}
                        {course.difficulty && (
                          <Badge variant="outline" className="text-xs">
                            {course.difficulty.name}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="line-clamp-2 text-lg">
                        {course.title}
                      </CardTitle>
                      <CardDescription className="mt-2 line-clamp-1 text-xs">
                        강사: {course.instructor_name}
                      </CardDescription>
                    </div>
                    <button
                      onClick={() => toggleFavorite(course.id)}
                      className="flex-shrink-0"
                    >
                      <Heart
                        className={`h-5 w-5 transition-colors ${
                          favoriteIds.has(course.id)
                            ? 'fill-red-500 text-red-500'
                            : 'text-gray-400 hover:text-red-500'
                        }`}
                      />
                    </button>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-4 flex flex-col">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {course.description || '설명이 없습니다'}
                    </p>
                  </div>

                  <div className="pt-4 border-t space-y-3">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEnroll(course.id)}
                        disabled={enrollMutation.isPending || course.is_enrolled}
                        className="flex-1"
                      >
                        {enrollMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            신청중...
                          </>
                        ) : course.is_enrolled ? (
                          '수강중'
                        ) : (
                          '수강신청'
                        )}
                      </Button>
                      <Link href={`/courses/${course.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          상세보기
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                이전
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={p === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                다음
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
