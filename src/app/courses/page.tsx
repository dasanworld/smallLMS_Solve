// src/app/courses/page.tsx

import { CourseList } from '@/features/course/components/CourseList';

type CoursesPageProps = {
  params: Promise<Record<string, never>>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const CoursesPage = async ({ params, searchParams }: CoursesPageProps) => {
  // Wait for params and searchParams to resolve
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  // Extract search parameters
  const search = typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : '';
  const category = typeof resolvedSearchParams.category === 'string' ? resolvedSearchParams.category : '';
  const difficulty = typeof resolvedSearchParams.difficulty === 'string' ? resolvedSearchParams.difficulty : '';
  const sort = typeof resolvedSearchParams.sort === 'string' ? resolvedSearchParams.sort : 'newest';

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">강의 과정</h1>
        <p className="text-muted-foreground mt-2">
          관심 있는 강의를 찾아 수강신청 해보세요.
        </p>
      </div>
      <CourseList 
        initialSearch={search}
        initialCategoryId={category}
        initialDifficultyId={difficulty}
        initialSort={sort as 'newest' | 'popular'}
      />
    </div>
  );
};

export default CoursesPage;