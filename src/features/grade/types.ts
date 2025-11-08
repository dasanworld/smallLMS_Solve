// Type definitions for grading feature

export interface SubmissionGradingData {
  id: string;
  assignment_id: string;
  user_id: string;
  user_name: string;
  content: string;
  link: string | null;
  submitted_at: string;
  is_late: boolean;
  score: number | null;
  feedback: string | null;
  status: 'submitted' | 'graded' | 'resubmission_required';
  assignment_title: string;
  course_title: string;
}