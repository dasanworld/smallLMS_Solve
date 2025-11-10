'use client';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AssignmentList } from '@/features/assignment/components/AssignmentList';

interface CourseDetailComponentProps {
  courseId: string;
}

export const CourseDetailComponent = ({ courseId }: CourseDetailComponentProps) => {
  const { user, isLoading: userLoading } = useCurrentUser();

  if (userLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">로딩 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard" passHref>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            뒤로 가기
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">코스 상세 정보</h1>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>코스 정보</CardTitle>
            <CardDescription>코스 ID: {courseId}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground">
              <p>이 페이지는 구축 중입니다.</p>
            </div>
          </CardContent>
        </Card>

        {/* 과제 목록 */}
        <AssignmentList courseId={courseId} />
      </div>
    </div>
  );
};
