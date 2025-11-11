'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AssignmentWithSubmission } from '../hooks/useLearnerAssignmentsQuery';
import {
  getSubmissionStatus,
  getTimeUntilDue,
  canSubmit,
  canResubmit,
} from '../lib/assignment-helper';
import SubmissionForm from './SubmissionForm';
import SubmissionStatus from './SubmissionStatus';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface AssignmentDetailModalProps {
  assignment: AssignmentWithSubmission;
  isOpen: boolean;
  onClose: () => void;
  onSubmissionSuccess: () => void;
}

export default function AssignmentDetailModal({
  assignment,
  isOpen,
  onClose,
  onSubmissionSuccess,
}: AssignmentDetailModalProps) {
  const [activeTab, setActiveTab] = useState('info');
  const submissionStatus = getSubmissionStatus(assignment.submission);
  const canSubmitAssignment = canSubmit(
    assignment.submission,
    assignment.status,
    assignment.allowLate
  );
  const canResubmitAssignment = canResubmit(
    assignment.submission,
    assignment.status,
    assignment.allowResubmission
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="pr-8">
            <DialogTitle className="text-2xl">{assignment.title}</DialogTitle>
            {assignment.course && (
              <p className="mt-2 text-sm text-gray-600">{assignment.course.title}</p>
            )}
          </div>
          <DialogClose className="absolute right-4 top-4" asChild>
            <button className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </DialogClose>
        </DialogHeader>

        {/* 기본 정보 */}
        <div className="grid gap-4 border-t border-gray-200 pt-4">
          {/* 마감일 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">마감일</p>
              <p className="mt-1 text-base text-gray-900">{getTimeUntilDue(assignment.dueDate)}</p>
              <p className="text-xs text-gray-500">
                {format(new Date(assignment.dueDate), 'yyyy년 M월 d일 H시', { locale: ko })}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">배점</p>
              <p className="mt-1 text-base text-gray-900">{assignment.pointsWeight}점</p>
            </div>
          </div>

          {/* 상태 배지 */}
          <div>
            <p className="text-sm font-medium text-gray-600">제출 상태</p>
            <div className={`mt-1 inline-block rounded-full px-3 py-1 ${submissionStatus.color}`}>
              {submissionStatus.badge} {submissionStatus.label}
            </div>
          </div>
        </div>

        {/* 탭 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">과제 정보</TabsTrigger>
            <TabsTrigger value="submission">제출</TabsTrigger>
            <TabsTrigger value="feedback">피드백</TabsTrigger>
          </TabsList>

          {/* 과제 정보 탭 */}
          <TabsContent value="info" className="mt-4">
            <div className="space-y-4">
              {assignment.description && (
                <div>
                  <h3 className="font-semibold text-gray-900">설명</h3>
                  <p className="mt-2 whitespace-pre-wrap text-gray-700">{assignment.description}</p>
                </div>
              )}

              {assignment.instructions && (
                <div>
                  <h3 className="font-semibold text-gray-900">지시사항</h3>
                  <div className="mt-2 rounded-lg bg-blue-50 p-4">
                    <p className="whitespace-pre-wrap text-gray-700">{assignment.instructions}</p>
                  </div>
                </div>
              )}

              {/* 옵션 */}
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">늦은 제출:</span>
                    <span className="font-medium text-gray-900">
                      {assignment.allowLate ? '허용' : '불허'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">재제출:</span>
                    <span className="font-medium text-gray-900">
                      {assignment.allowResubmission ? '허용' : '불허'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 제출 탭 */}
          <TabsContent value="submission" className="mt-4">
            {canSubmitAssignment || canResubmitAssignment ? (
              <SubmissionForm
                assignment={assignment}
                onSuccess={() => {
                  onSubmissionSuccess();
                  onClose();
                }}
              />
            ) : (
              <div className="rounded-lg bg-gray-50 p-6 text-center">
                <p className="text-gray-600">
                  {assignment.status === 'closed'
                    ? '마감된 과제입니다. 더 이상 제출할 수 없습니다.'
                    : '이미 제출하였습니다. 재제출이 필요한 경우 피드백을 확인하세요.'}
                </p>
              </div>
            )}
          </TabsContent>

          {/* 피드백 탭 */}
          <TabsContent value="feedback" className="mt-4">
            {assignment.submission && assignment.submission.score !== null ? (
              <div className="space-y-4">
                {/* 점수 */}
                <div className="rounded-lg bg-green-50 p-6 text-center">
                  <p className="text-sm text-green-600">채점 완료</p>
                  <div className="mt-2 text-4xl font-bold text-green-800">
                    {assignment.submission.score}점
                  </div>
                  <p className="mt-1 text-sm text-green-600">/{assignment.pointsWeight}점</p>
                </div>

                {/* 피드백 */}
                {assignment.submission.feedback && (
                  <div>
                    <h3 className="font-semibold text-gray-900">강사 피드백</h3>
                    <div className="mt-2 rounded-lg border border-gray-200 bg-white p-4">
                      <p className="whitespace-pre-wrap text-gray-700">
                        {assignment.submission.feedback}
                      </p>
                    </div>
                  </div>
                )}

                {/* 채점일시 */}
                {assignment.submission.gradedAt && (
                  <p className="text-xs text-gray-500">
                    채점 완료:{' '}
                    {format(new Date(assignment.submission.gradedAt), 'yyyy.MM.dd HH:mm', {
                      locale: ko,
                    })}
                  </p>
                )}

                {/* 재제출 요청 */}
                {assignment.submission.status === 'resubmission_required' && (
                  <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
                    재제출이 요청되었습니다. '제출' 탭에서 다시 제출할 수 있습니다.
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg bg-gray-50 p-6 text-center">
                <p className="text-gray-600">아직 채점되지 않았습니다.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
