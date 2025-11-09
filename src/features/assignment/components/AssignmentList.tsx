/**
 * 과제 목록 컴포넌트
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { AssignmentListResponse, AssignmentResponse } from '../lib/dto';
import { formatDistanceToNow } from 'date-fns';

interface AssignmentListProps {
  courseId: string;
  onEdit?: (assignment: AssignmentResponse) => void;
  onDelete?: (assignmentId: string) => void;
}

/**
 * 상태별 배지 색상
 */
const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  published: 'bg-blue-100 text-blue-800',
  closed: 'bg-red-100 text-red-800',
};

/**
 * 과제 목록 컴포넌트
 */
export const AssignmentList = ({
  courseId,
  onEdit,
  onDelete,
}: AssignmentListProps) => {
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
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
        과제 목록을 불러올 수 없습니다
      </div>
    );
  }

  if (!data?.data || data.data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        과제가 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.data.map((assignment) => (
        <Card key={assignment.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold">{assignment.title}</h3>
                <Badge className={statusColors[assignment.status]}>
                  {assignment.status === 'draft' && '초안'}
                  {assignment.status === 'published' && '공개'}
                  {assignment.status === 'closed' && '마감'}
                </Badge>
              </div>

              <p className="text-sm text-gray-600 mb-3">{assignment.description}</p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">마감일:</span>
                  <span className="ml-2">
                    {formatDistanceToNow(new Date(assignment.dueDate), { addSuffix: true })}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">가중치:</span>
                  <span className="ml-2">{(assignment.pointsWeight * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div className="flex gap-3 mt-3 text-xs text-gray-500">
                {assignment.allowLate && <span>지각 허용</span>}
                {assignment.allowResubmission && <span>재제출 허용</span>}
              </div>
            </div>

            <div className="flex gap-2 ml-4">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(assignment)}
                >
                  수정
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(assignment.id)}
                >
                  삭제
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

