/**
 * 제출물 채점 모달 컴포넌트
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useGradeSubmissionMutation } from '../hooks/useSubmissionMutations';
import { GradeSubmissionRequestSchema } from '../lib/dto';
import type { GradeSubmissionRequest, SubmissionResponse } from '../lib/dto';

interface GradeSubmissionModalProps {
  submission: SubmissionResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * 제출물 채점 모달
 */
export const GradeSubmissionModal = ({
  submission,
  isOpen,
  onClose,
  onSuccess,
}: GradeSubmissionModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mutation = useGradeSubmissionMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<GradeSubmissionRequest>({
    resolver: zodResolver(GradeSubmissionRequestSchema),
    defaultValues: {
      status: 'graded',
    },
  });

  const onSubmit = async (data: Omit<GradeSubmissionRequest, 'submissionId'>) => {
    if (!submission) return;

    setIsSubmitting(true);
    try {
      await mutation.mutateAsync({
        ...data,
        submissionId: submission.id,
      });
      reset();
      onSuccess?.();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = mutation.isPending || isSubmitting;

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>제출물 채점</DialogTitle>
        </DialogHeader>

        {submission && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* 제출 내용 미리보기 */}
            <div className="bg-gray-50 p-3 rounded text-sm">
              <p className="font-semibold mb-2">제출 내용:</p>
              <p className="line-clamp-3 text-gray-600">{submission.content}</p>
              {submission.link && (
                <a
                  href={submission.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline block mt-2"
                >
                  제출 링크
                </a>
              )}
            </div>

            {/* 점수 */}
            <div>
              <label className="block text-sm font-medium mb-2">점수 (0~100) *</label>
              <Input
                type="number"
                min="0"
                max="100"
                {...register('score', { valueAsNumber: true })}
                placeholder="100"
                disabled={isLoading}
              />
              {errors.score && (
                <p className="text-red-500 text-sm mt-1">{errors.score.message}</p>
              )}
            </div>

            {/* 피드백 */}
            <div>
              <label className="block text-sm font-medium mb-2">피드백 *</label>
              <Textarea
                {...register('feedback')}
                placeholder="학습자에게 제공할 피드백을 작성하세요"
                rows={4}
                disabled={isLoading}
              />
              {errors.feedback && (
                <p className="text-red-500 text-sm mt-1">{errors.feedback.message}</p>
              )}
            </div>

            {/* 상태 선택 */}
            <div>
              <label className="block text-sm font-medium mb-2">상태</label>
              <select
                {...register('status')}
                className="w-full border rounded px-3 py-2"
                disabled={isLoading}
              >
                <option value="graded">채점 완료</option>
                <option value="resubmission_required">재제출 요청</option>
              </select>
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? '저장 중...' : '채점'}
              </Button>
            </div>

            {/* 에러 메시지 */}
            {mutation.isError && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
                {mutation.error?.message || '채점 중 오류가 발생했습니다'}
              </div>
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};




