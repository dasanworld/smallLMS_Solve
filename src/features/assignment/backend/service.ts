import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  SubmitAssignmentRequest,
  GradeSubmissionRequest,
} from './schema';
import { assignmentErrorCodes } from './error';

/**
 * Get assignments for a course
 */
export const getCourseAssignmentsService = async (
  supabase: SupabaseClient,
  courseId: string
) => {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('course_id', courseId)
      .eq('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      return {
        status: 500,
        code: assignmentErrorCodes.ASSIGNMENT_NOT_FOUND,
        message: error.message,
      };
    }

    return {
      status: 200,
      data: {
        assignments: data || [],
        total: data?.length || 0,
      },
    };
  } catch (error) {
    return {
      status: 500,
      code: assignmentErrorCodes.ASSIGNMENT_NOT_FOUND,
      message: String(error),
    };
  }
};

/**
 * Get assignment by ID
 */
export const getAssignmentByIdService = async (
  supabase: SupabaseClient,
  assignmentId: string
) => {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .eq('deleted_at', null)
      .single();

    if (error || !data) {
      return {
        status: 404,
        code: assignmentErrorCodes.ASSIGNMENT_NOT_FOUND,
        message: 'Assignment not found',
      };
    }

    return {
      status: 200,
      data,
    };
  } catch (error) {
    return {
      status: 500,
      code: assignmentErrorCodes.ASSIGNMENT_NOT_FOUND,
      message: String(error),
    };
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
) => {
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
      return {
        status: 500,
        code: assignmentErrorCodes.ASSIGNMENT_CREATION_ERROR,
        message: error.message,
      };
    }

    return {
      status: 201,
      data: assignment,
    };
  } catch (error) {
    return {
      status: 500,
      code: assignmentErrorCodes.ASSIGNMENT_CREATION_ERROR,
      message: String(error),
    };
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
) => {
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
      return {
        status: 404,
        code: assignmentErrorCodes.ASSIGNMENT_NOT_FOUND,
        message: 'Assignment not found or unauthorized',
      };
    }

    return {
      status: 200,
      data: assignment,
    };
  } catch (error) {
    return {
      status: 500,
      code: assignmentErrorCodes.ASSIGNMENT_UPDATE_ERROR,
      message: String(error),
    };
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
) => {
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
        return {
          status: 500,
          code: assignmentErrorCodes.SUBMISSION_UPDATE_ERROR,
          message: error.message,
        };
      }

      return {
        status: 200,
        data: submission,
      };
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
      return {
        status: 500,
        code: assignmentErrorCodes.SUBMISSION_CREATE_ERROR,
        message: error.message,
      };
    }

    return {
      status: 201,
      data: submission,
    };
  } catch (error) {
    return {
      status: 500,
      code: assignmentErrorCodes.SUBMISSION_CREATE_ERROR,
      message: String(error),
    };
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
) => {
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
      return {
        status: 404,
        code: assignmentErrorCodes.SUBMISSION_NOT_FOUND,
        message: 'Submission not found',
      };
    }

    return {
      status: 200,
      data: submission,
    };
  } catch (error) {
    return {
      status: 500,
      code: assignmentErrorCodes.SUBMISSION_UPDATE_ERROR,
      message: String(error),
    };
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
) => {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('course_id', courseId)
      .eq('assignment_id', assignmentId)
      .eq('learner_id', learnerId)
      .single();

    if (error || !data) {
      return {
        status: 404,
        code: assignmentErrorCodes.SUBMISSION_NOT_FOUND,
        message: 'Submission not found',
      };
    }

    return {
      status: 200,
      data,
    };
  } catch (error) {
    return {
      status: 500,
      code: assignmentErrorCodes.SUBMISSION_NOT_FOUND,
      message: String(error),
    };
  }
};

/**
 * Delete assignment (soft delete)
 */
export const deleteAssignmentService = async (
  supabase: SupabaseClient,
  assignmentId: string,
  instructorId: string
) => {
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
      return {
        status: 404,
        code: assignmentErrorCodes.ASSIGNMENT_NOT_FOUND,
        message: 'Assignment not found or unauthorized',
      };
    }

    return {
      status: 200,
      data,
    };
  } catch (error) {
    return {
      status: 500,
      code: assignmentErrorCodes.ASSIGNMENT_DELETE_ERROR,
      message: String(error),
    };
  }
};
