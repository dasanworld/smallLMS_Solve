import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { FileText, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';

interface RecentSubmissionsListProps {
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
  const statusColors = {
    submitted: 'bg-yellow-500',
    graded: 'bg-green-500',
    resubmission_required: 'bg-red-500',
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
                <span>by {submission.studentName}</span>
                <span>{format(new Date(submission.submittedAt), 'MMM d, yyyy h:mm a')}</span>
                {submission.isLate && (
                  <Badge variant="destructive" className="text-xs">
                    Late
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`${statusColors[submission.status as keyof typeof statusColors] || 'bg-gray-500'} text-white`}>
                {submission.status.replace('_', ' ')}
              </Badge>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                Review
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}