'use client';

import { AssignmentWithSubmission } from '../hooks/useLearnerAssignmentsQuery';
import {
  getStatusBadgeInfo,
  getTimeUntilDue,
  getSubmissionStatus,
} from '../lib/assignment-helper';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

interface AssignmentCardProps {
  assignment: AssignmentWithSubmission;
  onSelect: () => void;
}

export default function AssignmentCard({ assignment, onSelect }: AssignmentCardProps) {
  const badgeInfo = getStatusBadgeInfo(assignment.submission, assignment.dueDate);
  const submissionStatus = getSubmissionStatus(assignment.submission);
  const timeUntilDue = getTimeUntilDue(assignment.dueDate);

  return (
    <div
      onClick={onSelect}
      className="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 transition hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* 코스명 */}
          {assignment.course && (
            <p className="text-sm font-medium text-blue-600">{assignment.course.title}</p>
          )}

          {/* 과제명 */}
          <h3 className="mt-1 text-lg font-semibold text-gray-900">{assignment.title}</h3>

          {/* 설명 */}
          {assignment.description && (
            <p className="mt-2 line-clamp-2 text-sm text-gray-600">{assignment.description}</p>
          )}

          {/* 정보 행 */}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
            {/* 마감일 */}
            <div>
              <span className="font-medium">마감:</span> {timeUntilDue}
            </div>

            {/* 점수 비중 */}
            {assignment.pointsWeight > 0 && (
              <div>
                <span className="font-medium">배점:</span> {assignment.pointsWeight}점
              </div>
            )}
          </div>
        </div>

        {/* 우측: 상태 배지 및 점수 */}
        <div className="ml-4 flex flex-col items-end gap-3">
          {/* 상태 배지 */}
          <div className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeInfo.color}`}>
            {submissionStatus.badge} {badgeInfo.label}
          </div>

          {/* 점수 (채점 완료된 경우) */}
          {assignment.submission && assignment.submission.score !== null && (
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {assignment.submission.score}점
              </div>
              <div className="text-xs text-gray-600">/{assignment.pointsWeight}점</div>
            </div>
          )}

          {/* 상세보기 버튼 */}
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
