'use client';

import React from 'react';
import { useAssignmentDetailQuery } from '../hooks/useAssignmentDetailQuery';
import AssignmentHeader from './AssignmentHeader';
import AssignmentDescription from './AssignmentDescription';
import AssignmentSubmissionForm from '@/features/assignment/submission/components/AssignmentSubmissionForm';
import { Skeleton } from '@/components/ui/skeleton';

interface AssignmentDetailProps {
  assignmentId: string;
}

const AssignmentDetail: React.FC<AssignmentDetailProps> = ({ assignmentId }) => {
  const { data: assignment, isLoading, error } = useAssignmentDetailQuery(assignmentId);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-8 w-1/3 mb-6" />
        <Skeleton className="h-4 w-1/4 mb-4" />
        <Skeleton className="h-32 w-full mb-8" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error.message}</span>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">No Assignment Found</strong>
          <span className="block sm:inline">The requested assignment could not be found.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <AssignmentHeader
        title={assignment.title}
        deadline={assignment.deadline}
        scoreWeight={assignment.score_weight}
        courseTitle={assignment.course_title}
      />

      <AssignmentDescription
        description={assignment.description || ''}
        submissionPolicy={assignment.submission_policy}
      />

      {!assignment.is_submitted && (
        <AssignmentSubmissionForm
          assignmentId={assignmentId}
          dueDate={assignment.deadline}
        />
      )}

      {assignment.is_submitted && assignment.submission && (
        <AssignmentSubmissionForm
          assignmentId={assignmentId}
          initialSubmission={{
            content: assignment.submission_content || '',
            link: assignment.submission_link || null,
            status: assignment.submission_status as 'submitted' | 'graded' | 'resubmission_required' || 'submitted'
          }}
          dueDate={assignment.deadline}
        />
      )}

      {assignment.is_submitted && !assignment.submission && (
        <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Assignment Submitted</h3>
          <p className="text-green-700">
            You have successfully submitted this assignment.
            {assignment.submission_created_at && (
              <span> Submitted at: {new Date(assignment.submission_created_at).toLocaleString()}</span>
            )}
          </p>
          {assignment.submission_content && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-700">Your Submission:</h4>
              <p className="mt-2 p-3 bg-white rounded border">{assignment.submission_content}</p>
            </div>
          )}
          {assignment.submission_link && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-700">Submission Link:</h4>
              <a
                href={assignment.submission_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all"
              >
                {assignment.submission_link}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AssignmentDetail;