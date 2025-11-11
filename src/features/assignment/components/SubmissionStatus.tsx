'use client';

import { AssignmentWithSubmission } from '../hooks/useLearnerAssignmentsQuery';
import { getSubmissionStatus, getTimeUntilDue } from '../lib/assignment-helper';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface SubmissionStatusProps {
  assignment: AssignmentWithSubmission;
}

export default function SubmissionStatus({ assignment }: SubmissionStatusProps) {
  const submissionStatus = getSubmissionStatus(assignment.submission);

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
      {/* 제출 상태 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900">제출 상태</h3>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-2xl">{submissionStatus.badge}</span>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${submissionStatus.color}`}>
            {submissionStatus.label}
          </span>
        </div>
      </div>

      {/* 마감 정보 */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-semibold text-gray-900">마감일</h3>
        <p className="mt-2 text-base text-gray-700">{getTimeUntilDue(assignment.dueDate)}</p>
        <p className="mt-1 text-xs text-gray-500">
          {format(new Date(assignment.dueDate), 'yyyy년 M월 d일 H시 mm분', { locale: ko })}
        </p>
      </div>

      {/* 제출 정보 */}
      {assignment.submission && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-900">제출 내용</h3>
          <div className="mt-2 space-y-2 text-sm text-gray-700">
            {assignment.submission.content && (
              <div>
                <p className="font-medium text-gray-600">텍스트:</p>
                <p className="line-clamp-3 rounded bg-gray-50 p-2">{assignment.submission.content}</p>
              </div>
            )}
            {assignment.submission.link && (
              <div>
                <p className="font-medium text-gray-600">링크:</p>
                <a
                  href={assignment.submission.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-blue-600 hover:underline"
                >
                  {assignment.submission.link}
                </a>
              </div>
            )}
            <p className="text-xs text-gray-500">
              제출 시간: {format(new Date(assignment.submission.submittedAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
            </p>
          </div>
        </div>
      )}

      {/* 채점 정보 */}
      {assignment.submission && assignment.submission.score !== null && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-900">채점 결과</h3>
          <div className="mt-2 rounded-lg bg-green-50 p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-800">{assignment.submission.score}점</div>
              <div className="text-sm text-green-600">/ {assignment.pointsWeight}점</div>
            </div>
          </div>

          {assignment.submission.feedback && (
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-600">피드백:</p>
              <p className="mt-1 rounded bg-gray-50 p-2 text-sm text-gray-700">
                {assignment.submission.feedback}
              </p>
            </div>
          )}

          {assignment.submission.gradedAt && (
            <p className="mt-2 text-xs text-gray-500">
              채점 완료: {format(new Date(assignment.submission.gradedAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
