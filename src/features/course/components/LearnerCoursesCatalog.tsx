'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Search, BookOpen, AlertTriangle, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Course } from '../backend/schema';

interface LearnerCoursesCatalogProps {
  // Optional props can be added here for filtering, sorting, etc.
}

/**
 * 학습자가 수강신청할 수 있는 코스 카탈로그
 * - 모든 활성 코스 표시
 * - 검색 기능
 * - 수강신청 버튼
 */
export const LearnerCoursesCatalog = ({}: LearnerCoursesCatalogProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  // 모든 활성 코스 조회
  const { 
    data: courses = [], 
    isLoading, 
    error,
    isError
  } = useQuery({
    queryKey: ['available-courses'],
    queryFn: async () => {
      try {
        console.log('📚 Fetching available courses...');
        const response = await apiClient.get<{ courses: Course[] }>('/api/courses');
        console.log('✅ Courses fetched:', response.data.courses.length);
        return response.data.courses;
      } catch (err) {
        const message = extractApiErrorMessage(err, 'Failed to fetch courses.');
        console.error('❌ Failed to fetch courses:', message);
        throw new Error(message);
      }
    },
  });

  // 검색 필터링
  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">강의 카탈로그</h1>
          <p className="text-slate-500">수강신청할 강의를 찾아보세요</p>
        </div>
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // ✅ 에러 상태: 데이터를 불러올 수 없음 (서버 문제 등)
  if (isError && error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">강의 카탈로그</h1>
          <p className="text-slate-500">수강신청할 강의를 찾아보세요</p>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-2">
            <span className="font-semibold">강의 목록을 불러올 수 없습니다</span>
            <span className="text-sm">
              {error instanceof Error ? error.message : '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'}
            </span>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">강의 카탈로그</h1>
        <p className="text-slate-500">수강신청할 강의를 찾아보세요</p>
      </div>

      {/* 검색 필터 */}
      <div className="flex items-center gap-2">
        <Search className="h-5 w-5 text-slate-400" />
        <Input
          placeholder="강의명이나 설명으로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
      </div>

      {/* ✅ 강의 목록 또는 없음 상태 표시 */}
      {courses.length === 0 ? (
        // 강의가 없음 (서버에서 정상적으로 빈 배열 반환)
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-slate-400 mb-3" />
            <h3 className="text-lg font-medium text-slate-900">
              현재 제공되는 강의가 없습니다
            </h3>
            <p className="text-slate-500 text-sm mt-2 text-center max-w-xs">
              강사가 새 강의를 등록하면 여기에 표시됩니다. 잠시 후 다시 확인해주세요.
            </p>
          </CardContent>
        </Card>
      ) : filteredCourses.length === 0 ? (
        // 검색 결과가 없음
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-slate-400 mb-3" />
            <h3 className="text-lg font-medium text-slate-900">
              검색 결과가 없습니다
            </h3>
            <p className="text-slate-500 text-sm mt-2">
              "{searchQuery}"에 해당하는 강의가 없습니다.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setSearchQuery('')}
            >
              검색 초기화
            </Button>
          </CardContent>
        </Card>
      ) : (
        // 강의 목록 표시
        <div className="space-y-4">
          <div className="text-sm text-slate-500">
            총 <span className="font-semibold text-slate-900">{filteredCourses.length}</span>개의 강의가 있습니다
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <CourseCatalogCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 학습자용 코스 카드
 * - 강사용과 다르게 편집/삭제 버튼 없음
 * - 수강신청 버튼만 표시
 */
interface CourseCatalogCardProps {
  course: Course;
}

function CourseCatalogCard({ course }: CourseCatalogCardProps) {
  const statusConfig = {
    draft: { label: '초안', color: 'bg-gray-100 text-gray-800' },
    active: { label: '진행 중', color: 'bg-blue-100 text-blue-800' },
    archived: { label: '종료', color: 'bg-gray-100 text-gray-800' },
  };

  const config = statusConfig[course.status as keyof typeof statusConfig] || statusConfig.draft;

  return (
    <Card className="flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="line-clamp-2">{course.title}</CardTitle>
            <CardDescription className="line-clamp-1 mt-1">
              강사: {course.instructor_name || '미지정'}
            </CardDescription>
          </div>
          <Badge className={config.color} variant="outline">
            {config.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4">
        {/* 설명 */}
        <p className="text-sm text-slate-600 line-clamp-3">
          {course.description || '강의 설명이 없습니다.'}
        </p>

        {/* 강의 정보 */}
        <div className="space-y-2 text-xs text-slate-500">
          {course.category && (
            <div>
              <span className="font-medium">카테고리:</span> {course.category}
            </div>
          )}
          {course.difficulty && (
            <div>
              <span className="font-medium">난이도:</span> {course.difficulty}
            </div>
          )}
        </div>

        {/* 버튼 그룹 */}
        <div className="mt-auto flex gap-2 w-full">
          <Link href={`/courses/${course.id}`} className="flex-1">
            <Button 
              className="w-full" 
              variant="outline"
            >
              상세보기
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Button 
            className="flex-1" 
            variant={course.status === 'active' ? 'default' : 'outline'}
            disabled={course.status !== 'active'}
          >
            {course.status === 'active' ? '수강신청' : '수강신청 불가'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

