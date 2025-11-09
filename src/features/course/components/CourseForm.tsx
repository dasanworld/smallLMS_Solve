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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreateCourseRequestSchema, UpdateCourseRequestSchema, CreateCourseRequest, UpdateCourseRequest } from '../backend/schema';
import { useCourseMetadataQuery } from '../hooks/useCourseMutations';

interface CourseFormProps {
  onSubmit: (data: CreateCourseRequest | UpdateCourseRequest) => Promise<void>;
  isLoading: boolean;
  initialData?: Partial<CreateCourseRequest | UpdateCourseRequest>;
  isEditing?: boolean;
}

export const CourseForm = ({ onSubmit, isLoading, initialData, isEditing = false }: CourseFormProps) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { data: metadata } = useCourseMetadataQuery();

  const schema = isEditing ? UpdateCourseRequestSchema : CreateCourseRequestSchema;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      category_id: initialData?.category_id || null,
      difficulty_id: initialData?.difficulty_id || null,
    },
  });

  const handleSubmit = async (data: CreateCourseRequest | UpdateCourseRequest) => {
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
        <CardTitle>{isEditing ? '코스 수정' : '새 코스 생성'}</CardTitle>
        <CardDescription>
          {isEditing ? '코스 정보를 수정합니다' : '강의할 새로운 코스를 생성합니다'}
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
                  <FormLabel>코스 제목 *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="예: 웹 개발 입문"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    코스의 제목을 입력합니다 (최대 255자)
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
                  <FormLabel>코스 설명</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="코스에 대한 상세한 설명을 입력합니다"
                      className="min-h-[120px]"
                      {...field}
                      value={field.value || ''}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    학생들이 보게 될 코스 설명입니다 (최대 2000자)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>카테고리</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(value) => field.onChange(value ? Number(value) : null)}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="카테고리 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">카테고리 없음</SelectItem>
                        {metadata?.categories.map((category) => (
                          <SelectItem key={category.id} value={String(category.id)}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficulty_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>난이도</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(value) => field.onChange(value ? Number(value) : null)}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="난이도 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">난이도 없음</SelectItem>
                        {metadata?.difficulties.map((difficulty) => (
                          <SelectItem key={difficulty.id} value={String(difficulty.id)}>
                            {difficulty.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? '저장 중...' : isEditing ? '수정 완료' : '코스 생성'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
