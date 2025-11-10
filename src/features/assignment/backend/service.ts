import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  SubmitAssignmentRequest,
  GradeSubmissionRequest,
  AssignmentResponse,
} from './schema';
import { assignmentErrorCodes } from './error';
import { success, failure, type HandlerResult } from '@/backend/http/response';

type AssignmentErrorCode = typeof assignmentErrorCodes[keyof typeof assignmentErrorCodes];

/**
 * 데이터베이스 필드(snake_case)를 API 응답 필드(camelCase)로 변환
 */
const convertAssignmentToResponse = (data: any): AssignmentResponse => ({
  id: data.id,
  courseId: data.course_id,
  title: data.title,
  description: data.description,
  dueDate: data.due_date,
  pointsWeight: data.points_weight,
  instructions: data.instructions,
  status: data.status,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  instructorId: data.instructor_id,
});

/**
 * Get assignments for a course
 */
export const getCourseAssignmentsService = async (
  supabase: SupabaseClient,
  courseId: string
): Promise<HandlerResult<{ assignments: AssignmentResponse[]; total: number }, AssignmentErrorCode>> => {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('course_id', courseId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getCourseAssignmentsService] Supabase error:', error);
      return failure(500, assignmentErrorCodes.ASSIGNMENT_NOT_FOUND, error.message);
    }

    console.log('[getCourseAssignmentsService] Raw data from DB:', {
      courseId,
      count: data?.length || 0,
      firstAssignment: data?.[0],
    });

    const assignments = (data || []).map(convertAssignmentToResponse);

    console.log('[getCourseAssignmentsService] Converted assignments:', {
      count: assignments.length,
      firstAssignment: assignments[0],
    });

    return success({
      assignments,
      total: assignments.length,
    });
  } catch (error) {
    console.error('[getCourseAssignmentsService] Unexpected error:', error);
    return failure(500, assignmentErrorCodes.ASSIGNMENT_NOT_FOUND, String(error));
  }
};

/**
 * Get assignment by ID
 */
export const getAssignmentByIdService = async (
  supabase: SupabaseClient,
  assignmentId: string
): Promise<HandlerResult<AssignmentResponse, AssignmentErrorCode>> => {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      return failure(404, assignmentErrorCodes.ASSIGNMENT_NOT_FOUND, 'Assignment not found');
    }

    return success(convertAssignmentToResponse(data));
  } catch (error) {
    return failure(500, assignmentErrorCodes.ASSIGNMENT_NOT_FOUND, String(error));
  }
};

/**
 * Create a new assignment
 */
export const createAssignmentService = async (
  supabase: SupabaseClient,
  courseId: string,
  instructorId: string,
  data: CreateAssignmentRequest
): Promise<HandlerResult<AssignmentResponse, AssignmentErrorCode>> => {
  try {
    const { data: assignment, error } = await supabase
      .from('assignments')
      .insert([
        {
          course_id: courseId,
          instructor_id: instructorId,
          title: data.title,
          description: data.description,
          due_date: data.dueDate,
          points_weight: data.pointsWeight,
          instructions: data.instructions || null,
          status: 'draft',
        },
      ])
      .select()
      .single();

    if (error) {
      return failure(500, assignmentErrorCodes.ASSIGNMENT_CREATION_ERROR, error.message);
    }

    return success(convertAssignmentToResponse(assignment), 201);
  } catch (error) {
    return failure(500, assignmentErrorCodes.ASSIGNMENT_CREATION_ERROR, String(error));
  }
};

/**
 * Update assignment
 */
export const updateAssignmentService = async (
  supabase: SupabaseClient,
  assignmentId: string,
  instructorId: string,
  data: UpdateAssignmentRequest
): Promise<HandlerResult<AssignmentResponse, AssignmentErrorCode>> => {
  try {
    const updateData: Record<string, any> = {};

    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.dueDate) updateData.due_date = data.dueDate;
    if (data.pointsWeight !== undefined) updateData.points_weight = data.pointsWeight;
    if (data.instructions) updateData.instructions = data.instructions;
    updateData.updated_at = new Date().toISOString();

    const { data: assignment, error } = await supabase
      .from('assignments')
      .update(updateData)
      .eq('id', assignmentId)
      .eq('instructor_id', instructorId)
      .select()
      .single();

    if (error || !assignment) {
      return failure(404, assignmentErrorCodes.ASSIGNMENT_NOT_FOUND, 'Assignment not found or unauthorized');
    }

    return success(convertAssignmentToResponse(assignment));
  } catch (error) {
    return failure(500, assignmentErrorCodes.ASSIGNMENT_UPDATE_ERROR, String(error));
  }
};

/**
 * Submit assignment
 */
export const submitAssignmentService = async (
  supabase: SupabaseClient,
  courseId: string,
  assignmentId: string,
  learnerId: string,
  data: SubmitAssignmentRequest
): Promise<HandlerResult<any, AssignmentErrorCode>> => {
  try {
    // Check if submission already exists
    const { data: existingSubmission } = await supabase
      .from('submissions')
      .select('id')
      .eq('assignment_id', assignmentId)
      .eq('learner_id', learnerId)
      .single();

    if (existingSubmission) {
      // Update existing submission
      const { data: submission, error } = await supabase
        .from('submissions')
        .update({
          content: data.content || null,
          link: data.link || null,
          status: 'submitted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSubmission.id)
        .select()
        .single();

      if (error) {
        return failure(500, assignmentErrorCodes.SUBMISSION_UPDATE_ERROR, error.message);
      }

      return success(submission);
    }

    // Create new submission
    const { data: submission, error } = await supabase
      .from('submissions')
      .insert([
        {
          assignment_id: assignmentId,
          course_id: courseId,
          learner_id: learnerId,
          content: data.content || null,
          link: data.link || null,
          status: 'submitted',
        },
      ])
      .select()
      .single();

    if (error) {
      return failure(500, assignmentErrorCodes.SUBMISSION_CREATE_ERROR, error.message);
    }

    return success(submission, 201);
  } catch (error) {
    return failure(500, assignmentErrorCodes.SUBMISSION_CREATE_ERROR, String(error));
  }
};

/**
 * Grade submission
 */
export const gradeSubmissionService = async (
  supabase: SupabaseClient,
  instructorId: string,
  submissionId: string,
  data: GradeSubmissionRequest
): Promise<HandlerResult<any, AssignmentErrorCode>> => {
  try {
    const { data: submission, error } = await supabase
      .from('submissions')
      .update({
        score: data.score,
        feedback: data.feedback,
        status: data.status || 'graded',
        graded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error || !submission) {
      return failure(404, assignmentErrorCodes.SUBMISSION_NOT_FOUND, 'Submission not found');
    }

    return success(submission);
  } catch (error) {
    return failure(500, assignmentErrorCodes.SUBMISSION_UPDATE_ERROR, String(error));
  }
};

/**
 * Get user's submission for an assignment
 */
export const getUserSubmissionService = async (
  supabase: SupabaseClient,
  courseId: string,
  assignmentId: string,
  learnerId: string
): Promise<HandlerResult<any, AssignmentErrorCode>> => {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('course_id', courseId)
      .eq('assignment_id', assignmentId)
      .eq('learner_id', learnerId)
      .single();

    if (error || !data) {
      return failure(404, assignmentErrorCodes.SUBMISSION_NOT_FOUND, 'Submission not found');
    }

    return success(data);
  } catch (error) {
    return failure(500, assignmentErrorCodes.SUBMISSION_NOT_FOUND, String(error));
  }
};

/**
 * Delete assignment (soft delete)
 */
export const deleteAssignmentService = async (
  supabase: SupabaseClient,
  assignmentId: string,
  instructorId: string
): Promise<HandlerResult<any, AssignmentErrorCode>> => {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)
      .eq('instructor_id', instructorId)
      .select()
      .single();

    if (error || !data) {
      return failure(404, assignmentErrorCodes.ASSIGNMENT_NOT_FOUND, 'Assignment not found or unauthorized');
    }

    return success(data);
  } catch (error) {
    return failure(500, assignmentErrorCodes.ASSIGNMENT_DELETE_ERROR, String(error));
  }
};
