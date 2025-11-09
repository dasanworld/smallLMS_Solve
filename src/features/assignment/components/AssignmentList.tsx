/**
 * 과제 목록 컴포넌트
 */

'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { AssignmentResponse } from '../lib/dto';
import { formatDistanceToNow } from 'date-fns';
import { Play, Lock } from 'lucide-react';

interface AssignmentListProps {
  assignments: AssignmentResponse[];
  courseId: string;
  onEdit?: (assignment: AssignmentResponse) => void;
  onDelete?: (assignmentId: string) => void;
  onStatusChange?: (assignmentId: string, newStatus: 'draft' | 'published' | 'closed') => void;
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
  assignments,
  courseId,
  onEdit,
  onDelete,
  onStatusChange,
}: AssignmentListProps) => {
  if (!assignments || assignments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        과제가 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {assignments.map((assignment) => (
        <Link key={assignment.id} href={`/courses/${courseId}/assignments/${assignment.id}`}>
          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-slate-900">{assignment.title}</h3>
                  <Badge className={statusColors[assignment.status]}>
                    {assignment.status === 'draft' && '초안'}
                    {assignment.status === 'published' && '공개'}
                    {assignment.status === 'closed' && '마감'}
                  </Badge>
                </div>

                <p className="text-sm text-slate-600 mb-3 line-clamp-2">{assignment.description}</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">마감일:</span>
                    <span className="ml-2">
                      {formatDistanceToNow(new Date(assignment.dueDate), { addSuffix: true })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">가중치:</span>
                    <span className="ml-2">{(assignment.pointsWeight * 100).toFixed(1)}%</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-3 text-xs text-slate-500">
                  {assignment.allowLate && <span>지각 허용</span>}
                  {assignment.allowResubmission && <span>재제출 허용</span>}
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                {/* 상태 변경 버튼 */}
                {onStatusChange && (
                  <>
                    {assignment.status === 'draft' && (
                      <Button
                        variant="default"
                        size="sm"
                        className="gap-1"
                        onClick={(e) => {
                          e.preventDefault();
                          onStatusChange(assignment.id, 'published');
                        }}
                      >
                        <Play className="h-3 w-3" />
                        발행
                      </Button>
                    )}
                    {assignment.status === 'published' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={(e) => {
                          e.preventDefault();
                          onStatusChange(assignment.id, 'closed');
                        }}
                      >
                        <Lock className="h-3 w-3" />
                        마감
                      </Button>
                    )}
                  </>
                )}
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      onEdit(assignment);
                    }}
                  >
                    수정
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      onDelete(assignment.id);
                    }}
                  >
                    삭제
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
};

