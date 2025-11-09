// src/features/course/components/CourseList.tsx

'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { useCoursesQuery } from '../hooks/useCoursesQuery';
import { CourseCard } from './CourseCard';
import { Skeleton } from '@/components/ui/skeleton';

type CourseListProps = {
  initialSearch?: string;
  initialCategoryId?: string;
  initialDifficultyId?: string;
  initialSort?: 'newest' | 'popular';
};

export const CourseList = ({
  initialSearch = '',
  initialCategoryId = 'all',
  initialDifficultyId = 'all',
  initialSort = 'newest',
}: CourseListProps) => {
  const [search, setSearch] = useState(initialSearch);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [difficultyId, setDifficultyId] = useState(initialDifficultyId);
  const [sort, setSort] = useState<'newest' | 'popular'>(initialSort);
  const [page, setPage] = useState(1);
  const [limit] = useState(12); // Fixed limit for this component

  const { data, isLoading, isError, isRefetching } = useCoursesQuery({
    search,
    category_id: categoryId !== 'all' ? categoryId : undefined,
    difficulty_id: difficultyId !== 'all' ? difficultyId : undefined,
    sort,
    page,
    limit,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
  };

  if (isError) {
    return (
      <div className="text-center py-10">
        <p className="text-destructive">코스 목록을 불러오는데 실패했습니다.</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="코스 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" className="whitespace-nowrap">
            <Search className="h-4 w-4 mr-2" />
            검색
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 카테고리</SelectItem>
                <SelectItem value="1">프로그래밍</SelectItem>
                <SelectItem value="2">디자인</SelectItem>
                <SelectItem value="3">비즈니스</SelectItem>
                <SelectItem value="4">외국어</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Select value={difficultyId} onValueChange={setDifficultyId}>
              <SelectTrigger>
                <SelectValue placeholder="난이도" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 난이도</SelectItem>
                <SelectItem value="1">입문</SelectItem>
                <SelectItem value="2">초급</SelectItem>
                <SelectItem value="3">중급</SelectItem>
                <SelectItem value="4">고급</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Select value={sort} onValueChange={(v: 'newest' | 'popular') => setSort(v)}>
              <SelectTrigger>
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">최신순</SelectItem>
                <SelectItem value="popular">인기순</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </form>

      {/* Results info */}
      {data && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            총 <span className="font-medium">{data.total}</span>개의 코스
          </p>
          <Badge variant="secondary">
            {search && `"${search}" 검색 결과`}
            {!search && categoryId !== 'all' && '카테고리 필터 적용'}
            {!search && categoryId === 'all' && difficultyId !== 'all' && '난이도 필터 적용'}
            {!search && categoryId === 'all' && difficultyId === 'all' && '모든 코스'}
          </Badge>
        </div>
      )}

      {/* Course Grid */}
      {isLoading || isRefetching ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: limit }).map((_, index) => (
            <Card key={index} className="h-80">
              <CardContent className="p-4 flex flex-col space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <div className="flex flex-wrap gap-1 mt-2">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-8 w-full mt-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data && data.courses.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page <= 1}
              >
                이전
              </Button>
              
              <span className="px-2 py-1 text-sm">
                {page} / {data.totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.min(prev + 1, data.totalPages))}
                disabled={page >= data.totalPages}
              >
                다음
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground">검색 조건에 맞는 코스가 없습니다.</p>
        </div>
      )}
    </div>
  );
};