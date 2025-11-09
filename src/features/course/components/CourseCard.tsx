'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Course } from '../backend/schema';
import { Edit2, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';

interface CourseCardProps {
  course: Course;
  onEdit?: (course: Course) => void;
  onDelete?: (courseId: string) => void;
  onStatusChange?: (course: Course) => void;
  isLoading?: boolean;
}

const statusConfig = {
  draft: {
    label: '초안',
    color: 'bg-gray-100 text-gray-800',
    description: '아직 발행되지 않은 상태',
  },
  published: {
    label: '발행됨',
    color: 'bg-green-100 text-green-800',
    description: '학생들이 수강 가능',
  },
  archived: {
    label: '아카이브됨',
    color: 'bg-yellow-100 text-yellow-800',
    description: '새 수강 등록 불가능',
  },
};

export const CourseCard = ({
  course,
  onEdit,
  onDelete,
  onStatusChange,
  isLoading = false,
}: CourseCardProps) => {
  const config = statusConfig[course.status as keyof typeof statusConfig];

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="line-clamp-2">{course.title}</CardTitle>
            <CardDescription className="mt-2 line-clamp-2">
              {course.description || '설명 없음'}
            </CardDescription>
          </div>
          <Badge className={config.color}>{config.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="space-y-2 text-sm text-gray-600">
          <p title={config.description}>{config.description}</p>
          <p>등록된 학생 수: {course.enrollment_count}</p>
          <p className="text-xs text-gray-500">
            생성일: {new Date(course.created_at).toLocaleDateString('ko-KR')}
          </p>
          {course.published_at && (
            <p className="text-xs text-gray-500">
              발행일: {new Date(course.published_at).toLocaleDateString('ko-KR')}
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="gap-2 border-t bg-gray-50 p-3">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onEdit?.(course)}
          disabled={isLoading}
        >
          <Edit2 className="mr-2 h-4 w-4" />
          수정
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onStatusChange?.(course)}
          disabled={isLoading}
        >
          <Eye className="mr-2 h-4 w-4" />
          상태변경
        </Button>
        {course.enrollment_count === 0 && course.status === 'draft' && (
          <Button
            variant="destructive"
            size="sm"
            className="flex-1"
            onClick={() => onDelete?.(course.id)}
            disabled={isLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            삭제
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
