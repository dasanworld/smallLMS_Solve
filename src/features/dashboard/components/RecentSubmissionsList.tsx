'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { FileText, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';

export interface RecentSubmissionsListProps {
  submissions: {
    id: string;
    assignmentId: string;
    assignmentTitle: string;
    courseId: string;
    courseTitle: string;
    studentName: string;
    submittedAt: string;
    status: string;
    isLate?: boolean;
  }[];
}

export function RecentSubmissionsList({ submissions }: RecentSubmissionsListProps) {
  const router = useRouter();

  const statusColors = {
    submitted: 'bg-yellow-500',
    graded: 'bg-green-500',
    resubmission_required: 'bg-red-500',
  };

  const statusLabels: Record<string, string> = {
    submitted: '제출됨',
    graded: '채점됨',
    resubmission_required: '재제출 필요',
  };

  const handleReviewSubmission = (submission: typeof submissions[0]) => {
    router.push(`/submissions/${submission.id}/review`);
  };

  return (
    <div className="space-y-3">
      {submissions.map((submission) => (
        <Card key={submission.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{submission.assignmentTitle}</p>
                  <p className="text-sm text-muted-foreground truncate">{submission.courseTitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span>{submission.studentName} 님</span>
                <span>{format(new Date(submission.submittedAt), 'yyyy년 M월 d일 p')}</span>
                {submission.isLate && (
                  <Badge variant="destructive" className="text-xs">
                    늦음
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`${statusColors[submission.status as keyof typeof statusColors] || 'bg-gray-500'} text-white`}>
                {statusLabels[submission.status] || submission.status}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => handleReviewSubmission(submission)}>
                <Eye className="h-4 w-4 mr-1" />
                검토
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}