'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Clock, FileText } from 'lucide-react';
import type { SubmissionStatus } from '@/features/dashboard/backend/schema';

/**
 * 제출 상태 배지를 반환하는 함수
 */
const getStatusConfig = (status: string, isLate: boolean) => {
  const configs: Record<string, { label: string; color: string; icon: any }> = {
    not_submitted: {
      label: '미제출',
      color: 'bg-red-100 text-red-800',
      icon: AlertCircle,
    },
    submitted: {
      label: '제출됨',
      color: 'bg-yellow-100 text-yellow-800',
      icon: Clock,
    },
    graded: {
      label: '채점완료',
      color: 'bg-green-100 text-green-800',
      icon: CheckCircle2,
    },
    resubmission_required: {
      label: '재제출 필요',
      color: 'bg-orange-100 text-orange-800',
      icon: AlertCircle,
    },
  };

  const config = configs[status] || configs.not_submitted;
  const Icon = config.icon;

  // 지각 표시
  if (isLate && status === 'submitted') {
    return {
      label: `${config.label} (지각)`,
      color: 'bg-orange-100 text-orange-800',
      icon: Clock,
    };
  }

  return config;
};

interface SubmissionStatusCardProps {
  submission: SubmissionStatus;
}

export const SubmissionStatusCard = ({ submission }: SubmissionStatusCardProps) => {
  const statusConfig = getStatusConfig(submission.status, submission.isLate);
  const Icon = statusConfig.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="space-y-3">
          {/* 과제 제목 및 코스명 */}
          <div>
            <h3 className="font-semibold text-sm line-clamp-2">
              {submission.assignmentTitle}
            </h3>
            <p className="text-xs text-slate-500 mt-1">{submission.courseTitle}</p>
          </div>

          {/* 상태 배지 */}
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 flex-shrink-0" />
            <Badge variant="outline" className={statusConfig.color}>
              {statusConfig.label}
            </Badge>
          </div>

          {/* 점수 (채점되었을 경우) */}
          {submission.score !== undefined && (
            <div className="pt-2 border-t">
              <p className="text-sm">
                <span className="text-slate-600">점수:</span>
                <span className="font-semibold ml-2">{submission.score}점</span>
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

