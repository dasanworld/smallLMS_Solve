'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { AssignmentListResponse } from '../lib/dto';

interface AssignmentListProps {
  courseId: string;
}

/**
 * 코스의 과제 목록 컴포넌트
 */
export const AssignmentList = ({ courseId }: AssignmentListProps) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['course-assignments', courseId],
    queryFn: async () => {
      const response = await apiClient.get<AssignmentListResponse>(
        `/api/courses/${courseId}/assignments`
      );
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">과제 목록을 불러오는 중...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="bg-red-50 border-red-200 text-red-700 p-4">
          과제 목록을 불러올 수 없습니다
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>과제</CardTitle>
        <CardDescription>
          {data?.total || 0}개의 과제
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!data?.assignments || data.assignments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            과제가 없습니다
          </div>
        ) : (
          <div className="space-y-3">
            {data.assignments.map((assignment) => (
              <div key={assignment.id} className="p-3 border rounded hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{assignment.title}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{assignment.description}</p>
                  </div>
                  <div className="text-xs text-gray-500 ml-4">
                    {assignment.pointsWeight}점
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
