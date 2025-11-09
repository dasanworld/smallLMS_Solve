'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, CheckCircle, Clock, FileText, Trash2, ArrowRight } from 'lucide-react';
import { type CourseProgress } from '@/features/dashboard/lib/dto';
import { useCancelEnrollmentMutation } from '@/features/enrollment/hooks/useEnrollmentMutations';
import { useToast } from '@/hooks/use-toast';

interface CourseProgressCardProps {
  course: CourseProgress;
}

export const CourseProgressCard = ({ course }: CourseProgressCardProps) => {
  const { courseTitle, completedAssignments, totalAssignments, progressPercentage, status, courseId } = course;
  const { toast } = useToast();
  const cancelEnrollmentMutation = useCancelEnrollmentMutation();

  const handleCancel = async () => {
    if (!confirm('이 강의를 취소하시겠습니까? 취소 후 다시 수강신청할 수 있습니다.')) {
      return;
    }

    try {
      await cancelEnrollmentMutation.mutateAsync(courseId);
      toast({
        title: '수강신청이 취소되었습니다',
        description: '언제든지 다시 수강신청할 수 있습니다.',
      });
    } catch (error) {
      // 에러는 mutation에서 이미 처리됨
    }
  };

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
      <CardContent className="flex-grow flex flex-col">
        <div className="mb-2 flex justify-between text-sm">
          <span>진행률</span>
          <span>{progressPercentage}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
        
        <div className="mt-4 flex items-center text-sm text-slate-600">
          <FileText className="mr-2 h-4 w-4" />
          <span>{totalAssignments}개의 과제</span>
        </div>

        <div className="mt-auto pt-4 flex gap-2">
          <Link href={`/courses/${courseId}`} className="flex-1">
            <Button variant="outline" className="w-full" size="sm">
              <ArrowRight className="h-4 w-4 mr-1" />
              강의 상세
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleCancel}
            disabled={cancelEnrollmentMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};