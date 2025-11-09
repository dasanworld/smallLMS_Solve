// TypeScript interfaces for assignment submission data

export interface AssignmentSubmissionRequest {
  content: string;
  link?: string | null;
}

export interface AssignmentSubmissionResponse {
  success: boolean;
  submission_id: string;
  message: string;
  submitted_at: string;
}

export interface AssignmentSubmissionDetail {
  id: string;
  assignment_id: string;
  user_id: string;
  content: string;
  link?: string | null;
  status: 'submitted' | 'graded' | 'resubmission_required';
  is_late: boolean;
  submitted_at: string;
  updated_at: string;
}