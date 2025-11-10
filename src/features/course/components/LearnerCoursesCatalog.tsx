'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

/**
 * 학습자용 코스 카탈로그 컴포넌트
 * - 모든 활성 코스 표시
 * - 수강신청 기능
 */
export const LearnerCoursesCatalog = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">코스 둘러보기</h1>
        <p className="mt-2 text-gray-600">
          모든 활성 코스를 확인하고 수강신청하세요
        </p>
      </div>

      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">코스 목록을 불러오는 중...</span>
        </CardContent>
      </Card>
    </div>
  );
};
