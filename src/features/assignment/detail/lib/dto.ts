// DTO for assignment detail response
export interface AssignmentDetailResponse {
  id: string;
  title: string;
  description?: string;
  deadline: string;
  score_weight: number;
  submission_policy: {
    allow_text_submission: boolean;
    allow_link_submission: boolean;
    allow_file_submission: boolean;
    max_file_size?: number;
    allowed_file_types?: string[];
  };
  created_at: string;
  updated_at: string;
  course_id: string;
  course_title: string;
  is_submitted: boolean;
  submission_id: string | null;
  submission_content: string | null;
  submission_link: string | null;
  submission_status?: string | null;
  submission_created_at?: string | null;
  submission_updated_at?: string | null;
}

// DTO for assignment submission request
export interface AssignmentSubmissionRequest {
  content: string;
  link?: string | null;
}

// DTO for assignment submission response
export interface AssignmentSubmissionResponse {
  success: boolean;
  submission_id: string;
  message: string;
  submitted_at: string;
}

// DTO for error response
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}