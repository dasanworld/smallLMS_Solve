/**
 * 제출물 목록 컴포넌트
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { SubmissionListResponse, SubmissionResponse } from '../lib/dto';
import { formatDistanceToNow } from 'date-fns';

interface SubmissionListProps {
  assignmentId: string;
  onGrade?: (submission: SubmissionResponse) => void;
}

/**
 * 제출물 상태별 배지 색상
 */
const statusColors: Record<string, string> = {
  submitted: 'bg-yellow-100 text-yellow-800',
  graded: 'bg-green-100 text-green-800',
  resubmission_required: 'bg-orange-100 text-orange-800',
};

/**
 * 제출물 목록 컴포넌트
 */
export const SubmissionList = ({
  assignmentId,
  onGrade,
}: SubmissionListProps) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['assignment-submissions', assignmentId],
    queryFn: async () => {
      const response = await apiClient.get<SubmissionListResponse>(
        `/api/assignments/${assignmentId}/submissions`
      );
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
        제출물 목록을 불러올 수 없습니다
      </div>
    );
  }

  if (!data?.submissions || data.submissions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        제출물이 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.submissions.map((submission) => (
        <Card key={submission.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold">학습자 {submission.learnerId.slice(0, 8)}</h4>
                <Badge className={statusColors[submission.status]}>
                  {submission.status === 'submitted' && '미채점'}
                  {submission.status === 'graded' && '채점완료'}
                  {submission.status === 'resubmission_required' && '재제출요청'}
                </Badge>
              </div>

              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{submission.content}</p>

              {submission.link && (
                <p className="text-sm mb-2">
                  <a href={submission.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    제출 링크
                  </a>
                </p>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">제출일:</span>
                  <span className="ml-2">
                    {formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true })}
                  </span>
                </div>
                {submission.score !== null && (
                  <div>
                    <span className="text-gray-500">점수:</span>
                    <span className="ml-2 font-semibold">{submission.score}점</span>
                  </div>
                )}
              </div>

              {submission.feedback && (
                <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                  <p className="font-semibold text-gray-700 mb-1">피드백:</p>
                  <p>{submission.feedback}</p>
                </div>
              )}
            </div>

            {onGrade && submission.status !== 'graded' && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onGrade(submission)}
                className="ml-4"
              >
                채점
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};




