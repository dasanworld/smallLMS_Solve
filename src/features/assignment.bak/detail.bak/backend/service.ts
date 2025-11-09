import { SupabaseClient } from '@supabase/supabase-js';
import { 
  assignmentDetailResponseSchema, 
  assignmentSubmissionRequestSchema 
} from './schema';
import { AssignmentDetailError } from './error';

// Type for assignment detail with submission information
export type AssignmentDetail = {
  id: string;
  title: string;
  description: string | null;
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
  submission_status: string | null;
  submission_created_at: string | null;
  submission_updated_at: string | null;
};

// Type for assignment submission
export type AssignmentSubmission = {
  content: string;
  link?: string | null;
};

/**
 * Service function to get assignment details
 * @param supabase Supabase client instance
 * @param assignmentId ID of the assignment to fetch
 * @param userId ID of the logged-in user
 * @returns Assignment detail with submission information
 */
export async function getAssignmentDetailService(
  supabase: SupabaseClient,
  assignmentId: string,
  userId: string
): Promise<AssignmentDetail> {
  // First, check if the assignment exists and if the user has access to it
  const { data: assignmentData, error: assignmentError } = await supabase
    .from('assignments')
    .select(`
      id,
      title,
      description,
      deadline,
      score_weight,
      submission_policy,
      created_at,
      updated_at,
      course_id,
      courses!inner (
        title
      )
    `)
    .eq('id', assignmentId)
    .eq('courses.enrollments.student_id', userId)
    .single();

  if (assignmentError) {
    if (assignmentError.code === 'PGRST116') {
      throw new AssignmentDetailError('ASSIGNMENT_NOT_FOUND', 'Assignment not found');
    }
    throw assignmentError;
  }

  if (!assignmentData) {
    throw new AssignmentDetailError('ASSIGNMENT_NOT_FOUND', 'Assignment not found');
  }

  // Check if the assignment is published
  const now = new Date();
  const deadline = new Date(assignmentData.deadline);
  const isPublished = deadline > now;

  if (!isPublished) {
    // For this implementation, we allow access to assignments even after deadline
    // but this could be changed based on requirements
  }

  // Get submission information if exists
  const { data: submissionData, error: submissionError } = await supabase
    .from('submissions')
    .select('id, content, link, status, created_at, updated_at')
    .eq('assignment_id', assignmentId)
    .eq('student_id', userId)
    .single();

  if (submissionError && submissionError.code !== 'PGRST116') {
    throw submissionError;
  }

  // Parse the submission policy
  const submissionPolicy = assignmentData.submission_policy as {
    allow_text_submission: boolean;
    allow_link_submission: boolean;
    allow_file_submission: boolean;
    max_file_size?: number;
    allowed_file_types?: string[];
  };

  return {
    id: assignmentData.id,
    title: assignmentData.title,
    description: assignmentData.description,
    deadline: assignmentData.deadline,
    score_weight: assignmentData.score_weight,
    submission_policy: submissionPolicy,
    created_at: assignmentData.created_at,
    updated_at: assignmentData.updated_at,
    course_id: assignmentData.course_id,
    course_title: Array.isArray(assignmentData.courses as any) ? (assignmentData.courses as any)[0]?.title : (assignmentData.courses as any)?.title,
    is_submitted: !!submissionData,
    submission_id: submissionData?.id || null,
    submission_content: submissionData?.content || null,
    submission_link: submissionData?.link || null,
    submission_status: submissionData?.status || null,
    submission_created_at: submissionData?.created_at || null,
    submission_updated_at: submissionData?.updated_at || null,
  };
}

/**
 * Service function to submit an assignment
 * @param supabase Supabase client instance
 * @param assignmentId ID of the assignment to submit to
 * @param userId ID of the submitting user
 * @param submissionData Assignment submission data
 * @returns Submission result
 */
export async function submitAssignmentService(
  supabase: SupabaseClient,
  assignmentId: string,
  userId: string,
  submissionData: AssignmentSubmission
): Promise<{ submission_id: string; submitted_at: string }> {
  // Validate the submission data
  const parsedSubmission = assignmentSubmissionRequestSchema.safeParse(submissionData);
  if (!parsedSubmission.success) {
    const errors = parsedSubmission.error.errors.map(err => err.message).join(', ');
    throw new AssignmentDetailError('INVALID_SUBMISSION_DATA', `Invalid submission data: ${errors}`);
  }

  // Check if assignment exists and is accessible by the user
  const { data: assignmentData, error: assignmentError } = await supabase
    .from('assignments')
    .select(`
      id,
      deadline,
      submission_policy
    `)
    .eq('id', assignmentId)
    .eq('courses.enrollments.student_id', userId)
    .single();

  if (assignmentError) {
    if (assignmentError.code === 'PGRST116') {
      throw new AssignmentDetailError('ASSIGNMENT_NOT_FOUND', 'Assignment not found');
    }
    throw assignmentError;
  }

  if (!assignmentData) {
    throw new AssignmentDetailError('ASSIGNMENT_NOT_FOUND', 'Assignment not found');
  }

  // Check if assignment is still open for submissions
  const now = new Date();
  const deadline = new Date(assignmentData.deadline);
  if (now > deadline) {
    throw new AssignmentDetailError('ASSIGNMENT_CLOSED', 'Assignment submission deadline has passed');
  }

  // Check if user has already submitted this assignment
  const { data: existingSubmission, error: existingSubmissionError } = await supabase
    .from('submissions')
    .select('id, status')
    .eq('assignment_id', assignmentId)
    .eq('student_id', userId)
    .single();

  if (existingSubmissionError && existingSubmissionError.code !== 'PGRST116') {
    throw existingSubmissionError;
  }

  // Check if it's a resubmission (existing submission with 'resubmission_required' status)
  const isResubmission = existingSubmission && existingSubmission.status === 'resubmission_required';

  if (existingSubmission) {
    // Update existing submission (for both regular updates and resubmissions)
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        content: submissionData.content,
        link: submissionData.link || null,
        status: 'submitted', // Reset status to 'submitted' when resubmitting
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingSubmission.id);

    if (updateError) {
      throw updateError;
    }

    return {
      submission_id: existingSubmission.id,
      submitted_at: new Date().toISOString(),
    };
  } else {
    // Create new submission
    const { data, error: insertError } = await supabase
      .from('submissions')
      .insert({
        assignment_id: assignmentId,
        student_id: userId,
        content: submissionData.content,
        link: submissionData.link || null,
        status: 'submitted',
      })
      .select('id')
      .single();

    if (insertError) {
      throw insertError;
    }

    return {
      submission_id: data.id,
      submitted_at: new Date().toISOString(),
    };
  }
}

/**
 * Helper function to check if assignment is open for submissions
 * @param deadline Assignment deadline
 * @returns True if assignment is open, false otherwise
 */
export function isAssignmentOpen(deadline: string): boolean {
  const now = new Date();
  const assignmentDeadline = new Date(deadline);
  return now <= assignmentDeadline;
}

/**
 * Helper function to check if assignment has been submitted by the user
 * @param submissionId ID of the submission if exists
 * @returns True if submitted, false otherwise
 */
export function isAssignmentSubmitted(submissionId: string | null): boolean {
  return submissionId !== null;
}