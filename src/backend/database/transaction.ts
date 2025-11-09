import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from '../hono/context';
import { ERROR_CODES } from '../middleware/error';
import { AppContext } from '../hono/context';

/**
 * Transaction result type for consistent return values
 */
export type TransactionResult<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
};

/**
 * Business rule validation functions
 */

/**
 * Validates that assignment weights in a course do not exceed 100%
 */
export const validateAssignmentWeights = async (
  supabase: SupabaseClient,
  courseId: string
): Promise<TransactionResult<boolean>> => {
  try {
    // Get all assignments for the course
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('weight')
      .eq('course_id', courseId);

    if (error) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to fetch assignments for validation',
          details: error
        }
      };
    }

    // Calculate total weight
    const totalWeight = assignments?.reduce((sum, assignment) => sum + (assignment.weight || 0), 0) || 0;

    if (totalWeight > 1) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.ASSIGNMENT_WEIGHT_EXCEEDED,
          message: `Assignment weights exceed 100%. Current total: ${(totalWeight * 100).toFixed(2)}%`,
          details: {
            currentSum: totalWeight,
            maxAllowed: 1.0
          }
        }
      };
    }

    return { success: true, data: true };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: 'Error validating assignment weights',
        details: error.message
      }
    };
  }
};

/**
 * Validates enrollment limits for a course
 */
export const validateEnrollmentLimit = async (
  supabase: SupabaseClient,
  courseId: string
): Promise<TransactionResult<boolean>> => {
  try {
    // Get course enrollment limit and current enrollment count
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('enrollment_limit')
      .eq('id', courseId)
      .single();

    if (courseError) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to fetch course information',
          details: courseError
        }
      };
    }

    if (course?.enrollment_limit === null) {
      // No limit set, validation passes
      return { success: true, data: true };
    }

    // Get current enrollment count
    const { count, error: countError } = await supabase
      .from('enrollments')
      .select('*', { count: "exact", head: true })
      .eq('course_id', courseId)
      .eq('status', 'active');

    if (countError) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to count current enrollments',
          details: countError
        }
      };
    }

    if (count !== null && count >= course.enrollment_limit) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.ENROLLMENT_LIMIT_EXCEEDED,
          message: `Enrollment limit of ${course.enrollment_limit} has been reached`,
          details: {
            limit: course.enrollment_limit,
            current: count
          }
        }
      };
    }

    return { success: true, data: true };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: 'Error validating enrollment limit',
        details: error.message
      }
    };
  }
};

/**
 * Validates submission deadline
 */
export const validateSubmissionDeadline = async (
  supabase: SupabaseClient,
  assignmentId: string
): Promise<TransactionResult<boolean>> => {
  try {
    // Get assignment deadline
    const { data: assignment, error } = await supabase
      .from('assignments')
      .select('deadline')
      .eq('id', assignmentId)
      .single();

    if (error) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to fetch assignment deadline',
          details: error
        }
      };
    }

    if (!assignment?.deadline) {
      // No deadline set, validation passes
      return { success: true, data: true };
    }

    const now = new Date();
    const deadline = new Date(assignment.deadline);

    if (now > deadline) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.SUBMISSION_DEADLINE_PASSED,
          message: 'Submission deadline has passed',
          details: {
            deadline: assignment.deadline,
            submittedAt: now.toISOString()
          }
        }
      };
    }

    return { success: true, data: true };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: 'Error validating submission deadline',
        details: error.message
      }
    };
  }
};

/**
 * Executes a database transaction with business rule validations
 * Since Supabase doesn't support traditional SQL transactions across multiple operations,
 * we implement a pseudo-transaction with rollback capabilities
 */
export const withTransaction = async <T>(
  c: AppContext,
  operations: (tx: SupabaseClient) => Promise<T>,
  validations?: ((tx: SupabaseClient) => Promise<TransactionResult<boolean>>)[]
): Promise<TransactionResult<T>> => {
  const supabase = getSupabase(c);
  
  try {
    // Run validations first if provided
    if (validations) {
      for (const validate of validations) {
        const validationResult = await validate(supabase);
        if (!validationResult.success) {
          return validationResult as TransactionResult<T>;
        }
      }
    }

    // Execute the operations
    const result = await operations(supabase);

    // If we reach this point, the operations were successful
    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    // Log the error
    const logger = c.get('logger');
    if (logger) {
      logger.error?.('Transaction failed', {
        error: error.message,
        stack: error.stack,
        path: c.req.path,
        method: c.req.method
      });
    }

    return {
      success: false,
      error: {
        code: ERROR_CODES.DATABASE_ERROR,
        message: 'Transaction failed',
        details: error.message
      }
    };
  }
};

/**
 * Specific transaction functions for common operations
 */

/**
 * Enroll a user in a course with validation
 */
export const enrollInCourseTransaction = async (
  c: AppContext,
  userId: string,
  courseId: string
): Promise<TransactionResult<any>> => {
  return withTransaction(
    c,
    async (supabase) => {
      // Check if user is already enrolled
      const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .in('status', ['active', 'pending'])
        .single();

      if (existingEnrollment) {
        throw new Error('User is already enrolled in this course');
      }

      // Create the enrollment
      const { data, error } = await supabase
        .from('enrollments')
        .insert({
          user_id: userId,
          course_id: courseId,
          status: 'active',
          enrolled_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    [async (supabase) => validateEnrollmentLimit(supabase, courseId)]
  );
};

/**
 * Create or update an assignment with weight validation
 */
export const upsertAssignmentTransaction = async (
  c: AppContext,
  assignmentData: any
): Promise<TransactionResult<any>> => {
  return withTransaction(
    c,
    async (supabase) => {
      let result;
      let error;

      if (assignmentData.id) {
        // Update existing assignment
        const { data, error: updateError } = await supabase
          .from('assignments')
          .update(assignmentData)
          .eq('id', assignmentData.id)
          .select()
          .single();

        result = data;
        error = updateError;
      } else {
        // Create new assignment
        const { data, error: insertError } = await supabase
          .from('assignments')
          .insert(assignmentData)
          .select()
          .single();

        result = data;
        error = insertError;
      }

      if (error) throw error;

      return result;
    },
    [async (supabase) => validateAssignmentWeights(supabase, assignmentData.course_id)]
  );
};

/**
 * Submit an assignment with deadline validation
 */
export const submitAssignmentTransaction = async (
  c: AppContext,
  submissionData: any
): Promise<TransactionResult<any>> => {
  return withTransaction(
    c,
    async (supabase) => {
      // Check if a submission already exists for this user and assignment
      const { data: existingSubmission } = await supabase
        .from('submissions')
        .select('id')
        .eq('user_id', submissionData.user_id)
        .eq('assignment_id', submissionData.assignment_id)
        .single();

      let result;
      let error;

      if (existingSubmission) {
        // Update existing submission
        const { data, error: updateError } = await supabase
          .from('submissions')
          .update({
            ...submissionData,
            submitted_at: new Date().toISOString()
          })
          .eq('id', existingSubmission.id)
          .select()
          .single();

        result = data;
        error = updateError;
      } else {
        // Create new submission
        const { data, error: insertError } = await supabase
          .from('submissions')
          .insert({
            ...submissionData,
            submitted_at: new Date().toISOString()
          })
          .select()
          .single();

        result = data;
        error = insertError;
      }

      if (error) throw error;

      return result;
    },
    [async (supabase) => validateSubmissionDeadline(supabase, submissionData.assignment_id)]
  );
};

/**
 * Grade a submission with related updates
 */
export const gradeSubmissionTransaction = async (
  c: AppContext,
  submissionId: string,
  grade: number,
  graderId: string
): Promise<TransactionResult<any>> => {
  return withTransaction(
    c,
    async (supabase) => {
      // Update the submission with the grade
      const { data: submission, error } = await supabase
        .from('submissions')
        .update({
          grade,
          graded_at: new Date().toISOString(),
          grader_id: graderId
        })
        .eq('id', submissionId)
        .select(`
          id,
          user_id,
          assignment_id,
          assignments (course_id, points)
        `)
        .single();

      if (error) throw error;

      // Optionally update the user's grade in the course
      // This would typically involve recalculating the user's total grade
      // based on all assignments in the course

      return submission;
    }
  );
};