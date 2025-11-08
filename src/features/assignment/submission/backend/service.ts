import { Result, failure, success } from '@/backend/http/response';
import { submissionErrorCodes, type SubmissionErrorCode } from './error';
import { SubmissionRequest } from './schema';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';
import { Logger } from 'pino';

// Type for dependencies
type Dependencies = {
  supabase: SupabaseClient<Database>;
  logger: Logger;
};

/**
 * Service function to handle assignment submission
 */
export const submitAssignmentService = async (
  deps: Dependencies,
  userId: string,
  assignmentId: string,
  data: SubmissionRequest
): Promise<Result<string>> => {
  try {
    // Validate assignment and user permissions
    const validation = await validateAssignmentSubmission(
      deps,
      userId,
      assignmentId,
      data
    );

    if (!validation.ok) {
      return validation;
    }

    // Check deadline
    const deadlineCheck = await checkSubmissionDeadline(
      deps,
      assignmentId
    );

    if (!deadlineCheck.ok) {
      return deadlineCheck;
    }

    // Create or update submission
    const submissionResult = await createOrUpdateSubmission(
      deps,
      userId,
      assignmentId,
      data
    );

    return submissionResult;
  } catch (error) {
    deps.logger.error('Error in submitAssignmentService:', error);
    return failure(
      500,
      submissionErrorCodes.INTERNAL_SERVER_ERROR,
      '서버 오류가 발생했습니다.'
    );
  }
};

/**
 * Validate assignment state and policies
 */
export const validateAssignmentSubmission = async (
  deps: Dependencies,
  userId: string,
  assignmentId: string,
  data: SubmissionRequest
): Promise<Result<void>> => {
  const { supabase, logger } = deps;

  // Check if assignment exists and is open
  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .select('id, title, due_date, is_open, course_id')
    .eq('id', assignmentId)
    .single();

  if (assignmentError || !assignment) {
    logger.error('Assignment not found:', assignmentError);
    return failure(
      404,
      submissionErrorCodes.ASSIGNMENT_NOT_FOUND,
      '과제를 찾을 수 없습니다.'
    );
  }

  if (!assignment.is_open) {
    return failure(
      400,
      submissionErrorCodes.ASSIGNMENT_CLOSED,
      '과제가 마감되었습니다.'
    );
  }

  // Check if user is enrolled in the course
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', assignment.course_id)
    .single();

  if (enrollmentError || !enrollment) {
    logger.error('User not enrolled in course:', enrollmentError);
    return failure(
      403,
      submissionErrorCodes.INSUFFICIENT_PERMISSIONS,
      '해당 과제에 제출할 권한이 없습니다.'
    );
  }

  return success(undefined);
};

/**
 * Check if submission is within deadline
 */
export const checkSubmissionDeadline = async (
  deps: Dependencies,
  assignmentId: string
): Promise<Result<void>> => {
  const { supabase, logger } = deps;

  const { data: assignment, error } = await supabase
    .from('assignments')
    .select('due_date')
    .eq('id', assignmentId)
    .single();

  if (error) {
    logger.error('Error fetching assignment for deadline check:', error);
    return failure(
      500,
      submissionErrorCodes.INTERNAL_SERVER_ERROR,
      '서버 오류가 발생했습니다.'
    );
  }

  if (!assignment) {
    return failure(
      404,
      submissionErrorCodes.ASSIGNMENT_NOT_FOUND,
      '과제를 찾을 수 없습니다.'
    );
  }

  const now = new Date();
  const dueDate = new Date(assignment.due_date);

  if (now > dueDate) {
    return failure(
      400,
      submissionErrorCodes.SUBMISSION_PAST_DUE_DATE,
      '제출 기한이 지났습니다.'
    );
  }

  return success(undefined);
};

/**
 * Check if user has permission to submit to assignment
 */
export const checkSubmissionPermissions = async (
  deps: Dependencies,
  userId: string,
  assignmentId: string
): Promise<Result<void>> => {
  const { supabase, logger } = deps;

  // Check if user is enrolled in the course containing the assignment
  const { data, error } = await supabase
    .from('assignments')
    .select(`
      course_id,
      courses!inner (
        id,
        enrollments!inner (
          user_id
        )
      )
    `)
    .eq('id', assignmentId)
    .eq('courses.enrollments.user_id', userId)
    .single();

  if (error || !data) {
    logger.error('Permission check failed:', error);
    return failure(
      403,
      submissionErrorCodes.INSUFFICIENT_PERMISSIONS,
      '해당 과제에 제출할 권한이 없습니다.'
    );
  }

  return success(undefined);
};

/**
 * Create new submission or update existing one
 */
export const createOrUpdateSubmission = async (
  deps: Dependencies,
  userId: string,
  assignmentId: string,
  data: SubmissionRequest
): Promise<Result<string>> => {
  const { supabase, logger } = deps;

  // Check if a submission already exists for this user and assignment
  const { data: existingSubmission, error: fetchError } = await supabase
    .from('submissions')
    .select('id, status')
    .eq('assignment_id', assignmentId)
    .eq('user_id', userId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows returned
    logger.error('Error checking existing submission:', fetchError);
    return failure(
      500,
      submissionErrorCodes.INTERNAL_SERVER_ERROR,
      '서버 오류가 발생했습니다.'
    );
  }

  const now = new Date().toISOString();
  let submissionId: string;
  let isLate = false;

  // Check if submission is late
  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .select('due_date')
    .eq('id', assignmentId)
    .single();

  if (assignmentError) {
    logger.error('Error fetching assignment due date:', assignmentError);
    return failure(
      500,
      submissionErrorCodes.INTERNAL_SERVER_ERROR,
      '서버 오류가 발생했습니다.'
    );
  }

  if (assignment) {
    isLate = new Date() > new Date(assignment.due_date);
  }

  if (existingSubmission) {
    // Update existing submission if it's resubmission_required or if it's a new submission within deadline
    const { data: updatedSubmission, error: updateError } = await supabase
      .from('submissions')
      .update({
        content: data.content,
        link: data.link || null,
        status: 'submitted', // Reset status to submitted when resubmitting
        is_late: isLate,
        updated_at: now,
      })
      .eq('id', existingSubmission.id)
      .select('id')
      .single();

    if (updateError) {
      logger.error('Error updating submission:', updateError);
      return failure(
        500,
        submissionErrorCodes.INTERNAL_SERVER_ERROR,
        '제출 업데이트에 실패했습니다.'
      );
    }

    submissionId = updatedSubmission.id;
  } else {
    // Create new submission
    const { data: newSubmission, error: insertError } = await supabase
      .from('submissions')
      .insert({
        assignment_id: assignmentId,
        user_id: userId,
        content: data.content,
        link: data.link || null,
        status: 'submitted',
        is_late: isLate,
        submitted_at: now,
        updated_at: now,
      })
      .select('id')
      .single();

    if (insertError) {
      logger.error('Error creating submission:', insertError);
      return failure(
        500,
        submissionErrorCodes.INTERNAL_SERVER_ERROR,
        '제출에 실패했습니다.'
      );
    }

    submissionId = newSubmission.id;
  }

  logger.info('Assignment submitted successfully', {
    userId,
    assignmentId,
    submissionId,
    isLate
  });

  return success(submissionId);
};