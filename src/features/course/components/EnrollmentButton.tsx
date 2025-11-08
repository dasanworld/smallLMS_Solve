// src/features/course/components/EnrollmentButton.tsx

'use client';

import { Button } from '@/components/ui/button';
import { useEnrollmentMutation } from '../hooks/useEnrollmentMutation';
import { useEnrollmentStatusQuery } from '../hooks/useEnrollmentStatusQuery';
import { Loader2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

type EnrollmentButtonProps = {
  courseId: string;
};

export const EnrollmentButton = ({ courseId }: EnrollmentButtonProps) => {
  const { isPending: isStatusLoading, data: enrollmentStatus } = useEnrollmentStatusQuery(courseId);
  const enrollmentMutation = useEnrollmentMutation();

  const handleEnroll = () => {
    enrollmentMutation.mutate(
      { course_id: courseId },
      {
        onSuccess: () => {
          toast.success('수강 신청이 완료되었습니다.');
        },
        onError: (error) => {
          toast.error(`수강 신청 실패: ${error.message}`);
        },
      }
    );
  };

  const handleCancel = () => {
    // For cancellation, we need the enrollment ID. Since we don't have it in the status response yet,
    // we'll need to make another API call to get it, or update our API to return it
    // For now, let's implement a simplified cancellation that first checks enrollment status
    if (enrollmentStatus?.enrollment?.id) {
      enrollmentMutation.mutate(
        { enrollmentId: enrollmentStatus.enrollment.id },
        {
          onSuccess: () => {
            toast.success('수강 취소가 완료되었습니다.');
          },
          onError: (error) => {
            toast.error(`수강 취소 실패: ${error.message}`);
          },
        }
      );
    } else {
      toast.error('수강 정보를 찾을 수 없습니다.');
    }
  };

  if (isStatusLoading) {
    return (
      <Button disabled className="w-full">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        확인중...
      </Button>
    );
  }

  if (enrollmentMutation.isPending) {
    return (
      <Button disabled className="w-full">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        처리중...
      </Button>
    );
  }

  if (enrollmentStatus?.isEnrolled) {
    return (
      <Button variant="outline" className="w-full" onClick={handleCancel}>
        수강취소
      </Button>
    );
  }

  return (
    <Button className="w-full" onClick={handleEnroll}>
      <BookOpen className="h-4 w-4 mr-2" />
      수강신청
    </Button>
  );
};