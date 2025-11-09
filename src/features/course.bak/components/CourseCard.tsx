// src/features/course/components/CourseCard.tsx

'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, BookOpen } from 'lucide-react';
import { Course } from '../lib/dto';
import { EnrollmentButton } from './EnrollmentButton';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

type CourseCardProps = {
  course: Course;
};

export const CourseCard = ({ course }: CourseCardProps) => {
  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg line-clamp-1">{course.title}</CardTitle>
          <Badge variant="secondary" className="ml-2">
            {course.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {course.description || '설명이 없습니다.'}
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {course.category_name && (
            <Badge variant="outline">{course.category_name}</Badge>
          )}
          {course.difficulty_name && (
            <Badge variant="outline">{course.difficulty_name}</Badge>
          )}
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            <span>{course.enrollment_count}명 수강</span>
          </div>
          {course.published_at && (
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span>
                개설일: {format(new Date(course.published_at), 'yyyy년 MM월 dd일', { locale: ko })}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <EnrollmentButton courseId={course.id} />
      </CardFooter>
    </Card>
  );
};