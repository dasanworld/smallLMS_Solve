'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, Trash2, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { AssignmentResponse } from '../backend/schema';
import { useDeleteAssignmentMutation } from '../hooks/useAssignmentMutations';

interface AssignmentModalDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: AssignmentResponse | null;
  courseId: string;
  courseName: string;
  onSuccess?: () => void;
}

export const AssignmentModalDialog = ({
  isOpen,
  onOpenChange,
  assignment,
  courseId,
  courseName,
  onSuccess,
}: AssignmentModalDialogProps) => {
  const router = useRouter();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const deleteMutation = useDeleteAssignmentMutation(courseId);

  const handleDelete = async () => {
    if (!assignment) return;

    try {
      setDeleteError(null);
      setDeleteLoading(true);
      await deleteMutation.mutateAsync(assignment.id);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : '삭제 중 오류가 발생했습니다');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!assignment) {
    return null;
  }

  const statusLabel = {
    draft: '작성중',
    published: '공개',
    closed: '마감',
  } as const;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{assignment.title}</DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-gray-600">{courseName}</span>
              <Badge variant="outline" className="text-xs">
                {statusLabel[assignment.status]}
              </Badge>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-600">설명</h4>
              <p className="mt-2 text-sm text-gray-900 whitespace-pre-wrap">
                {assignment.description}
              </p>
            </div>

            {assignment.instructions && (
              <div>
                <h4 className="text-sm font-medium text-gray-600">지시사항</h4>
                <p className="mt-2 text-sm text-gray-900 whitespace-pre-wrap">
                  {assignment.instructions}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-600">마감일</h4>
                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {format(parseISO(assignment.dueDate), 'yyyy년 MM월 dd일 HH:mm', {
                    locale: ko,
                  })}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-600">배점</h4>
                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {assignment.pointsWeight}점
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-600">지연 제출</h4>
                <p className="mt-2 text-sm text-gray-900">
                  {assignment.allowLate ? '허용' : '불허'}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-600">재제출</h4>
                <p className="mt-2 text-sm text-gray-900">
                  {assignment.allowResubmission ? '허용' : '불허'}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  router.push(`/courses/${courseId}/assignments/${assignment.id}/submissions`);
                }}
              >
                제출물 보기
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {deleteLoading ? '삭제 중...' : '삭제'}
              </Button>
            </div>

            {deleteError && (
              <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{deleteError}</p>
              </div>
            )}

            {deleteLoading && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">삭제 중...</span>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};
