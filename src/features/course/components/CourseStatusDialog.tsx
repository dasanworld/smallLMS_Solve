'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Course } from '../backend/schema';

interface CourseStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course | null;
  onStatusChange: (status: 'draft' | 'published' | 'archived') => Promise<void>;
  isLoading: boolean;
}

const statusTransitions: Record<string, { status: 'draft' | 'published' | 'archived'; label: string; description: string }[]> = {
  draft: [
    {
      status: 'published',
      label: '발행',
      description: '코스를 발행하면 모든 학생이 수강할 수 있게 됩니다',
    },
  ],
  published: [
    {
      status: 'archived',
      label: '아카이브',
      description: '아카이브하면 새로운 학생 등록이 불가능하고, 모든 과제가 종료됩니다',
    },
    {
      status: 'draft',
      label: '초안으로 복구',
      description: '발행 상태를 취소하고 초안으로 돌아갑니다',
    },
  ],
  archived: [
    {
      status: 'draft',
      label: '초안으로 복구',
      description: '아카이브된 코스를 다시 초안 상태로 되돌립니다',
    },
  ],
};

export const CourseStatusDialog = ({
  open,
  onOpenChange,
  course,
  onStatusChange,
  isLoading,
}: CourseStatusDialogProps) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  if (!course) return null;

  const availableTransitions = statusTransitions[course.status] || [];
  const selectedTransition = availableTransitions.find((t) => t.status === selectedStatus);

  const handleConfirm = async () => {
    if (!selectedStatus) return;
    try {
      await onStatusChange(selectedStatus as 'draft' | 'published' | 'archived');
      setSelectedStatus('');
      onOpenChange(false);
    } catch (error) {
      console.error('상태 변경 실패:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>코스 상태 변경</DialogTitle>
          <DialogDescription>
            현재 상태: <strong>{course.status === 'draft' ? '초안' : course.status === 'published' ? '발행됨' : '아카이브됨'}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label htmlFor="status-select" className="text-sm font-medium">
              변경할 상태 선택
            </label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus} disabled={isLoading}>
              <SelectTrigger id="status-select">
                <SelectValue placeholder="상태를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {availableTransitions.map((transition) => (
                  <SelectItem key={transition.status} value={transition.status}>
                    {transition.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTransition && (
            <div className="flex gap-3 rounded-md bg-blue-50 p-4">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-600" />
              <p className="text-sm text-blue-800">{selectedTransition.description}</p>
            </div>
          )}

          {course.status === 'published' && selectedStatus === 'archived' && (
            <div className="flex gap-3 rounded-md bg-amber-50 p-4">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">주의:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>모든 과제가 자동으로 종료됩니다</li>
                  <li>새로운 학생 등록이 차단됩니다</li>
                  <li>기존 학생들은 읽기 전용 모드로 접근합니다</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            취소
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedStatus || isLoading}>
            {isLoading ? '변경 중...' : '상태 변경'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
