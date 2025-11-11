'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';

export interface AssignmentWithSubmission {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  pointsWeight: number;
  status: 'draft' | 'published' | 'closed';
  allowLate: boolean;
  allowResubmission: boolean;
  instructions: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  closedAt: string | null;
  course: {
    id: string;
    title: string;
  } | null;
  submission: {
    id: string;
    assignmentId: string;
    courseId: string;
    learnerId: string;
    content: string | null;
    link: string | null;
    score: number | null;
    feedback: string | null;
    status: 'submitted' | 'graded' | 'resubmission_required';
    submittedAt: string;
    gradedAt: string | null;
    updatedAt: string;
  } | null;
}

interface LearnerAssignmentsResponse {
  assignments: AssignmentWithSubmission[];
}

export const useLearnerAssignmentsQuery = () => {
  return useQuery<LearnerAssignmentsResponse>({
    queryKey: ['learner-assignments'],
    queryFn: async () => {
      const response = await apiClient.get<LearnerAssignmentsResponse>('/api/learner/assignments');
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5분
  });
};
