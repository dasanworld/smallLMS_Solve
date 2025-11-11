'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CreateAssignmentRequestSchema, UpdateAssignmentRequestSchema, type CreateAssignmentRequest, type UpdateAssignmentRequest, type AssignmentResponse } from '../backend/schema';
import { format, parseISO } from 'date-fns';

interface AssignmentFormProps {
  courseId: string;
  onSubmit: (data: CreateAssignmentRequest | UpdateAssignmentRequest) => Promise<void>;
  isLoading: boolean;
  initialData?: AssignmentResponse;
  isEditing?: boolean;
}

export const AssignmentForm = ({
  courseId,
  onSubmit,
  isLoading,
  initialData,
  isEditing = false
}: AssignmentFormProps) => {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const schema = isEditing ? UpdateAssignmentRequestSchema : CreateAssignmentRequestSchema;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      dueDate: initialData?.dueDate || '',
      pointsWeight: initialData?.pointsWeight || 0,
      instructions: initialData?.instructions || '',
    },
  });

  const handleSubmit = async (data: CreateAssignmentRequest | UpdateAssignmentRequest) => {
    try {
      setSubmitError(null);
      await onSubmit(data);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '오류가 발생했습니다');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? '과제 수정' : '새 과제 생성'}</CardTitle>
        <CardDescription>
          {isEditing ? '과제 정보를 수정합니다' : '새로운 과제를 생성합니다'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {submitError && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                {submitError}
              </div>
            )}

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>과제 제목 *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="예: 웹 개발 기초 프로젝트"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    과제의 제목을 입력합니다 (최대 255자)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>과제 설명 *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="과제에 대한 상세한 설명을 입력합니다"
                      className="min-h-[120px]"
                      {...field}
                      value={field.value || ''}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    학생들이 보게 될 과제 설명입니다
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>제출 마감일 *</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      value={
                        field.value
                          ? format(parseISO(field.value), "yyyy-MM-dd'T'HH:mm")
                          : ''
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        if (!value) {
                          field.onChange('');
                          return;
                        }
                        // datetime-local 입력값을 ISO 8601로 변환
                        // 예: "2025-12-15T23:59" → "2025-12-15T23:59:00Z"
                        field.onChange(`${value}:00Z`);
                      }}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    학생들의 제출 마감일을 설정합니다
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pointsWeight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>배점 *</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        disabled={isLoading}
                        className="max-w-[150px]"
                      />
                      <span className="text-sm text-gray-600">점</span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    과제의 배점을 설정합니다 (0~100)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>추가 지시사항</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="학생들을 위한 추가 지시사항이 있으면 입력합니다"
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ''}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    선택사항입니다
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? '저장 중...' : isEditing ? '수정 완료' : '과제 생성'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
