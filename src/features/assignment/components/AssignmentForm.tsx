/**
 * 과제 생성/수정 폼 컴포넌트
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateAssignmentMutation, useUpdateAssignmentMutation } from '../hooks/useAssignmentMutations';
import { CreateAssignmentRequestSchema } from '../lib/dto';
import type { CreateAssignmentRequest, AssignmentResponse } from '../lib/dto';

interface AssignmentFormProps {
  courseId: string;
  assignment?: AssignmentResponse;
  onSuccess?: () => void;
}

/**
 * 과제 생성/수정 폼
 */
export const AssignmentForm = ({
  courseId,
  assignment,
  onSuccess,
}: AssignmentFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMutation = useCreateAssignmentMutation();
  const updateMutation = useUpdateAssignmentMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateAssignmentRequest>({
    resolver: zodResolver(CreateAssignmentRequestSchema),
    defaultValues: assignment ? {
      courseId,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate,
      pointsWeight: assignment.pointsWeight,
      allowLate: assignment.allowLate,
      allowResubmission: assignment.allowResubmission,
    } : {
      courseId,
      allowLate: false,
      allowResubmission: false,
    },
  });

  const pointsWeight = watch('pointsWeight');

  const onSubmit = async (data: CreateAssignmentRequest) => {
    setIsSubmitting(true);
    try {
      if (assignment) {
        await updateMutation.mutateAsync({
          assignmentId: assignment.id,
          ...data,
        });
      } else {
        await createMutation.mutateAsync(data);
      }
      onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isSubmitting;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {assignment ? '과제 수정' : '새 과제 생성'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium mb-2">제목 *</label>
            <Input
              {...register('title')}
              placeholder="과제 제목을 입력하세요"
              disabled={isLoading}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium mb-2">설명 *</label>
            <Textarea
              {...register('description')}
              placeholder="과제 설명을 입력하세요"
              rows={5}
              disabled={isLoading}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* 마감일 */}
          <div>
            <label className="block text-sm font-medium mb-2">마감일 *</label>
            <Input
              type="datetime-local"
              {...register('dueDate')}
              disabled={isLoading}
            />
            {errors.dueDate && (
              <p className="text-red-500 text-sm mt-1">{errors.dueDate.message}</p>
            )}
          </div>

          {/* 가중치 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              가중치 (0~1.0) * - {(pointsWeight * 100).toFixed(1)}%
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="1"
              {...register('pointsWeight', { valueAsNumber: true })}
              placeholder="예: 0.2"
              disabled={isLoading}
            />
            <p className="text-gray-500 text-sm mt-1">
              한 코스의 모든 과제 가중치 합은 100%를 초과할 수 없습니다
            </p>
            {errors.pointsWeight && (
              <p className="text-red-500 text-sm mt-1">{errors.pointsWeight.message}</p>
            )}
          </div>

          {/* 정책 */}
          <div className="space-y-3">
            <div className="flex items-center">
              <Checkbox
                id="allowLate"
                {...register('allowLate')}
                disabled={isLoading}
              />
              <label htmlFor="allowLate" className="ml-2 text-sm">
                지각 제출 허용
              </label>
            </div>
            <div className="flex items-center">
              <Checkbox
                id="allowResubmission"
                {...register('allowResubmission')}
                disabled={isLoading}
              />
              <label htmlFor="allowResubmission" className="ml-2 text-sm">
                재제출 허용
              </label>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? '저장 중...' : assignment ? '수정' : '생성'}
            </Button>
          </div>

          {/* 에러 메시지 */}
          {(createMutation.isError || updateMutation.isError) && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
              {createMutation.error?.message || updateMutation.error?.message || '저장 중 오류가 발생했습니다'}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

