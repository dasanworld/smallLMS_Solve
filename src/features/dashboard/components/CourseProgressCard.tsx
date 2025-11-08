'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, CheckCircle, Clock, FileText } from 'lucide-react';
import { type CourseProgress } from '@/features/dashboard/lib/dto';

interface CourseProgressCardProps {
  course: CourseProgress;
}

export const CourseProgressCard = ({ course }: CourseProgressCardProps) => {
  const { courseTitle, completedAssignments, totalAssignments, progressPercentage, status } = course;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg truncate">{courseTitle}</CardTitle>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={status === 'published' ? 'default' : 'secondary'}>
              {status === 'published' ? '진행 중' : status === 'draft' ? '대기' : '종료'}
            </Badge>
          </div>
          <div className="text-sm text-slate-500 flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            {completedAssignments}/{totalAssignments}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-2 flex justify-between text-sm">
          <span>진행률</span>
          <span>{progressPercentage}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
        
        <div className="mt-4 flex items-center text-sm text-slate-600">
          <FileText className="mr-2 h-4 w-4" />
          <span>{totalAssignments}개의 과제</span>
        </div>
      </CardContent>
    </Card>
  );
};