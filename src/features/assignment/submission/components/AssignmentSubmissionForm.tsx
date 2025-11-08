'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AssignmentSubmissionRequest } from '../lib/dto';
import { useAssignmentSubmissionMutation } from '../hooks/useAssignmentSubmissionMutation';
import { submissionRequestSchema } from '../backend/schema';
import { z } from 'zod';
import { toast } from 'sonner';

interface AssignmentSubmissionFormProps {
  assignmentId: string;
  initialSubmission?: {
    content: string;
    link?: string | null;
    status?: 'submitted' | 'graded' | 'resubmission_required';
  };
  dueDate: string;
  onSubmissionSuccess?: () => void;
}

const AssignmentSubmissionForm: React.FC<AssignmentSubmissionFormProps> = ({
  assignmentId,
  initialSubmission,
  dueDate,
  onSubmissionSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<AssignmentSubmissionRequest>({
    resolver: zodResolver(submissionRequestSchema),
    defaultValues: {
      content: initialSubmission?.content || '',
      link: initialSubmission?.link || ''
    }
  });

  const submissionMutation = useAssignmentSubmissionMutation();

  const onSubmit = async (data: AssignmentSubmissionRequest) => {
    setIsSubmitting(true);
    
    try {
      await submissionMutation.mutateAsync({
        assignmentId,
        data
      });
      
      toast.success('과제가 성공적으로 제출되었습니다!');
      onSubmissionSuccess?.();
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.message || '과제 제출에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if submission is late
  const isLateSubmission = new Date() > new Date(dueDate);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">과제 제출</h2>
      
      {isLateSubmission && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-700 text-sm">
            경고: 현재 제출 기한이 지났습니다. 늦은 제출이 적용될 수 있습니다.
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            내용 *
          </label>
          <textarea
            id="content"
            {...register('content')}
            rows={6}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.content ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="과제 내용을 입력하세요..."
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-1">
            링크 (선택 사항)
          </label>
          <input
            type="url"
            id="link"
            {...register('link')}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.link ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="https://example.com"
          />
          {errors.link && (
            <p className="mt-1 text-sm text-red-600">{errors.link.message}</p>
          )}
        </div>

        <div className="text-sm text-gray-600">
          <p>제출 마감일: {new Date(dueDate).toLocaleString('ko-KR')}</p>
          {initialSubmission?.status === 'resubmission_required' && (
            <p className="text-red-600">* 교수자로부터 재제출 요청이 있었습니다. 내용을 수정하여 다시 제출해 주세요.</p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || submissionMutation.isPending}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              isSubmitting || submissionMutation.isPending
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSubmitting || submissionMutation.isPending ? '제출 중...' : '제출하기'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AssignmentSubmissionForm;