/**
 * 과제 생성/수정 폼 컴포넌트
 */

'use client';

import { useState, useRef } from 'react';
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
  const pointsWeightRef = useRef<HTMLInputElement>(null);

  const createMutation = useCreateAssignmentMutation();
  const updateMutation = useUpdateAssignmentMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
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
      dueDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      allowLate: false,
      allowResubmission: false,
    },
  });

  const pointsWeight = watch('pointsWeight');
  const dueDateValue = watch('dueDate');

  // datetime-local 입력 값을 ISO 8601 datetime으로 변환
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const localDateTime = e.target.value; // YYYY-MM-DDTHH:mm (로컬 시간)
    if (localDateTime) {
      // 로컬 시간을 ISO 문자열로 변환
      // datetime-local은 이미 사용자의 로컬 시간대로 입력되므로
      // 직접 ISO 형식으로 변환하되, 초(ss) 포함
      const isoDateTime = new Date(`${localDateTime}:00`).toISOString();
      setValue('dueDate', isoDateTime);
    }
  };

  // ISO datetime을 datetime-local 형식으로 변환
  const formatDateForInput = (isoString: string) => {
    // ISO 문자열(UTC)을 로컬 시간으로 변환
    const date = new Date(isoString);
    
    // 로컬 시간대로 변환
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const onSubmit = async (data: CreateAssignmentRequest) => {
    setIsSubmitting(true);
    try {
      console.log('📋 Form submit data:', {
        courseId: data.courseId,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        pointsWeight: data.pointsWeight,
        pointsWeightType: typeof data.pointsWeight,
        allowLate: data.allowLate,
        allowResubmission: data.allowResubmission,
      });
      
      // 날짜 유효성 확인
      try {
        const dueDateObj = new Date(data.dueDate);
        console.log('📅 Parsed due date:', {
          iso: data.dueDate,
          parsed: dueDateObj.toISOString(),
          isValid: !isNaN(dueDateObj.getTime()),
        });
      } catch (e) {
        console.error('❌ Invalid due date format:', data.dueDate);
      }
      
      if (assignment) {
        await updateMutation.mutateAsync({
          assignmentId: assignment.id,
          ...data,
        });
      } else {
        await createMutation.mutateAsync(data);
      }
      onSuccess?.();
    } catch (err) {
      console.error('❌ Form submission error:', err);
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
            <input
              type="datetime-local"
              value={dueDateValue ? formatDateForInput(dueDateValue) : ''}
              onChange={handleDateChange}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-slate-500 text-sm mt-1">
              캘린더에서 날짜와 시간을 선택하세요 (기본값: 7일 후)
            </p>
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
              ref={pointsWeightRef}
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

