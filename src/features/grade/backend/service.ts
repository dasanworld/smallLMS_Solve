import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import { GradeResponseSchema } from '@/features/grade/backend/schema';
import {
  gradeErrorCodes,
  type GradeServiceError,
} from '@/features/grade/backend/error';

const ENROLLMENTS_TABLE = 'enrollments';
const COURSES_TABLE = 'courses';
const ASSIGNMENTS_TABLE = 'assignments';
const SUBMISSIONS_TABLE = 'submissions';
const USERS_TABLE = 'users';

/**
 * Gets the learner's grades for all enrolled courses or a specific course
 * @param client Supabase client
 * @param userId ID of the authenticated user
 * @param courseId Optional course ID to filter grades
 * @param limit Number of records to return (default: 20, max: 100)
 * @param offset Number of records to skip (default: 0)
 * @returns Grade data including assignments and course totals
 */
export const getLearnerGradesService = async (
  client: SupabaseClient,
  userId: string,
  courseId?: string,
  limit: number = 20,
  offset: number = 0,
): Promise<HandlerResult<z.infer<typeof GradeResponseSchema>, typeof gradeErrorCodes[keyof typeof gradeErrorCodes], unknown>> => {
  try {
    // Get enrolled active courses (소프트 삭제 필터 추가)
    let enrollmentsQuery = client
      .from('enrollments')
      .select('id, course_id')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (courseId) {
      enrollmentsQuery = enrollmentsQuery.eq('course_id', courseId);
    }

    const { data: enrollments, error: enrollmentsError } = await enrollmentsQuery;

    if (enrollmentsError) {
      return failure(500, gradeErrorCodes.GRADES_FETCH_ERROR, 'Failed to fetch enrollments', enrollmentsError.message);
    }

    if (!enrollments || enrollments.length === 0) {
      // If user has no active enrollments or no matching course, return empty grades
      return success({
        assignments: [],
        courseTotals: [],
      });
    }

    // Extract course IDs from enrollments
    const courseIds = enrollments.map(enrollment => enrollment.course_id);

    // Get all assignments for enrolled courses that are published (소프트 삭제 필터 추가)
    const { data: assignments, error: assignmentsError } = await client
      .from(ASSIGNMENTS_TABLE)
      .select('id, title, description, course_id, points_weight')
      .in('course_id', courseIds)
      .eq('status', 'published')
      .is('deleted_at', null); // 소프트 삭제된 과제 제외

    if (assignmentsError) {
      return failure(500, gradeErrorCodes.GRADES_FETCH_ERROR, 'Failed to fetch assignments', assignmentsError.message);
    }

    // Get all submissions for the user
    const { data: submissions, error: submissionsError } = await client
      .from(SUBMISSIONS_TABLE)
      .select(`
        id,
        assignment_id,
        status,
        feedback,
        score,
        graded_at,
        is_late,
        is_resubmission
      `)
      .eq('user_id', userId)
      .in('assignment_id', assignments?.map(a => a.id) || []);

    if (submissionsError) {
      return failure(500, gradeErrorCodes.GRADES_FETCH_ERROR, 'Failed to fetch submissions', submissionsError.message);
    }

    // Get course details (소프트 삭제 필터 추가)
    const { data: courses, error: coursesError } = await client
      .from(COURSES_TABLE)
      .select('id, title')
      .in('id', courseIds)
      .is('deleted_at', null); // 소프트 삭제된 코스 제외

    if (coursesError) {
      return failure(500, gradeErrorCodes.GRADES_FETCH_ERROR, 'Failed to fetch courses', coursesError.message);
    }

    // Map course IDs to course titles
    const courseMap = new Map(courses?.map(course => [course.id, course.title]) || []);

    // Map assignment IDs to assignment details
    const assignmentMap = new Map(
      assignments?.map(assignment => [
        assignment.id,
        {
          title: assignment.title,
          description: assignment.description || '',
          courseId: assignment.course_id,
          pointsWeight: assignment.points_weight || 0,
        }
      ]) || []
    );

    // Build the assignments array for the response
    const gradeAssignments = submissions?.map(submission => {
      const assignment = assignmentMap.get(submission.assignment_id);
      const courseTitle = courseMap.get(assignment?.courseId || '') || 'Unknown Course';

      return {
        id: submission.id,
        assignmentId: submission.assignment_id,
        assignmentTitle: assignment?.title || 'Unknown Assignment',
        assignmentDescription: assignment?.description || '',
        courseId: assignment?.courseId || '',
        courseTitle,
        score: submission.score,
        feedback: submission.feedback,
        gradedAt: submission.graded_at,
        isLate: submission.is_late || false,
        isResubmission: submission.is_resubmission || false,
        status: submission.status as 'submitted' | 'graded' | 'resubmission_required',
        pointsWeight: assignment?.pointsWeight || 0,
      };
    }) || [];

    // Calculate course totals
    const courseTotals = [];
    for (const courseId of courseIds) {
      const courseTitle = courseMap.get(courseId) || 'Unknown Course';
      
      // Get assignments for this course
      const courseAssignments = assignments?.filter(
        assignment => assignment.course_id === courseId
      ) || [];
      
      // Get submissions for this course's assignments
      const courseSubmissions = submissions?.filter(submission => {
        const assignment = assignmentMap.get(submission.assignment_id);
        return assignment && assignment.courseId === courseId;
      }) || [];
      
      // Calculate total score based on weighted scores
      let totalWeightedScore = 0;
      let totalWeights = 0;
      let gradedCount = 0;
      
      for (const submission of courseSubmissions) {
        if (submission.status === 'graded' && submission.score !== null) {
          const assignment = assignmentMap.get(submission.assignment_id);
          if (assignment) {
            totalWeightedScore += (submission.score * assignment.pointsWeight) / 100;
            totalWeights += assignment.pointsWeight;
            gradedCount++;
          }
        }
      }
      
      // Calculate the course total score as a percentage of the total possible score
      let totalScore = null;
      if (totalWeights > 0) {
        totalScore = Math.round((totalWeightedScore / totalWeights) * 100 * 10) / 10; // Round to 1 decimal place
      }
      
      courseTotals.push({
        courseId,
        courseTitle,
        totalScore,
        assignmentsCount: courseAssignments.length,
        gradedCount,
      });
    }

    const gradeData = {
      assignments: gradeAssignments,
      courseTotals,
    };

    // Validate response data
    const parsed = GradeResponseSchema.safeParse(gradeData);
    if (!parsed.success) {
      return failure(
        500,
        gradeErrorCodes.GRADES_VALIDATION_ERROR,
        'Grade response failed validation.',
        parsed.error.format(),
      );
    }

    return success(parsed.data);
  } catch (error) {
    console.error('Error in getLearnerGradesService:', error);
    return failure(
      500,
      gradeErrorCodes.GRADES_FETCH_ERROR,
      error instanceof Error ? error.message : 'An unknown error occurred',
    );
  }
};

/**
 * Grade a submission with score and feedback
 * @param client Supabase client
 * @param instructorId ID of the authenticated instructor
 * @param submissionId ID of the submission to grade
 * @param score Score to assign (0-100)
 * @param feedback Feedback text for the learner
 * @param action Action to take ('grade' or 'resubmission_required')
 * @returns Updated submission data
 */
export const gradeSubmissionService = async (
  client: SupabaseClient,
  instructorId: string,
  submissionId: string,
  score: number,
  feedback: string,
  action: 'grade' | 'resubmission_required'
): Promise<HandlerResult<z.infer<typeof import('@/features/grade/backend/schema').SubmissionGradingSchema>, typeof gradeErrorCodes[keyof typeof gradeErrorCodes], unknown>> => {
  try {
    // Validate score range
    if (score < 0 || score > 100) {
      return failure(400, gradeErrorCodes.INVALID_SCORE_RANGE, 'Score must be between 0 and 100');
    }

    // Validate feedback is provided when grading
    if (action === 'grade' && (!feedback || feedback.trim().length === 0)) {
      return failure(400, gradeErrorCodes.MISSING_FEEDBACK, 'Feedback is required when grading');
    }

    // Get submission with assignment and course details to check permissions
    const { data: submission, error: submissionError } = await client
      .from(SUBMISSIONS_TABLE)
      .select(`
        id,
        assignment_id,
        user_id,
        content,
        link,
        submitted_at,
        is_late,
        score,
        feedback,
        status,
        assignments(
          course_id,
          courses(instructor_id)
        )
      `)
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      return failure(404, gradeErrorCodes.SUBMISSION_NOT_FOUND, 'Submission not found');
    }

    // Type assertion for nested structure
    const submissionData = submission as any;
    const assignmentData = Array.isArray(submissionData.assignments) ? submissionData.assignments[0] : submissionData.assignments;
    const courseData = Array.isArray(assignmentData.courses) ? assignmentData.courses[0] : assignmentData.courses;

    // Check if instructor has permission to grade this submission
    if (courseData.instructor_id !== instructorId) {
      return failure(403, gradeErrorCodes.INSUFFICIENT_PERMISSIONS, 'Insufficient permissions to grade this submission');
    }

    // Check if submission is already graded
    if (submission.status === 'graded') {
      return failure(400, gradeErrorCodes.SUBMISSION_ALREADY_GRADED, 'Submission is already graded');
    }

    // Prepare update data based on action
    let updateData: any = {
      feedback: feedback || null,
    };

    if (action === 'grade') {
      updateData.score = score;
      updateData.status = 'graded';
      updateData.graded_at = new Date().toISOString();
    } else if (action === 'resubmission_required') {
      updateData.status = 'resubmission_required';
      updateData.score = null;
      updateData.graded_at = null;
    }

    // Update the submission
    const { data: updatedSubmission, error: updateError } = await client
      .from(SUBMISSIONS_TABLE)
      .update(updateData)
      .eq('id', submissionId)
      .select(`
        id,
        assignment_id,
        user_id,
        content,
        link,
        submitted_at,
        is_late,
        score,
        feedback,
        status
      `)
      .single();

    if (updateError) {
      return failure(500, gradeErrorCodes.GRADES_FETCH_ERROR, 'Failed to update submission', updateError.message);
    }

    // Get user information
    const { data: user, error: userError } = await client
      .from(USERS_TABLE)
      .select('name')
      .eq('id', submission.user_id)
      .single();

    if (userError) {
      return failure(500, gradeErrorCodes.GRADES_FETCH_ERROR, 'Failed to fetch user information', userError.message);
    }

    // Get assignment and course information
    const { data: assignment, error: assignmentError } = await client
      .from(ASSIGNMENTS_TABLE)
      .select('title')
      .eq('id', submission.assignment_id)
      .single();

    if (assignmentError) {
      return failure(500, gradeErrorCodes.ASSIGNMENT_NOT_FOUND, 'Failed to fetch assignment information', assignmentError.message);
    }

    // Get course ID from assignment data (handle array case)
    const assignmentCourseId = Array.isArray(submissionData.assignments) ? submissionData.assignments[0].course_id : submissionData.assignments.course_id;

    const { data: course, error: courseError } = await client
      .from(COURSES_TABLE)
      .select('title')
      .eq('id', assignmentCourseId)
      .single();

    if (courseError) {
      return failure(500, gradeErrorCodes.GRADES_FETCH_ERROR, 'Failed to fetch course information', courseError.message);
    }

    // Construct the response data
    const responseData = {
      id: updatedSubmission.id,
      assignment_id: updatedSubmission.assignment_id,
      user_id: updatedSubmission.user_id,
      user_name: user.name || 'Unknown User',
      content: submission.content,
      link: submission.link,
      submitted_at: submission.submitted_at,
      is_late: submission.is_late,
      score: updatedSubmission.score,
      feedback: updatedSubmission.feedback,
      status: updatedSubmission.status as 'submitted' | 'graded' | 'resubmission_required',
      assignment_title: assignment.title,
      course_title: course.title,
    };

    // Validate response data using the schema from the schema file
    const { SubmissionGradingSchema } = await import('@/features/grade/backend/schema');
    const parsed = SubmissionGradingSchema.safeParse(responseData);
    if (!parsed.success) {
      return failure(
        500,
        gradeErrorCodes.GRADES_VALIDATION_ERROR,
        'Submission response failed validation.',
        parsed.error.format(),
      );
    }

    return success(parsed.data);
  } catch (error) {
    console.error('Error in gradeSubmissionService:', error);
    return failure(
      500,
      gradeErrorCodes.GRADES_FETCH_ERROR,
      error instanceof Error ? error.message : 'An unknown error occurred',
    );
  }
};

/**
 * Get submission details for grading
 * @param client Supabase client
 * @param instructorId ID of the authenticated instructor
 * @param submissionId ID of the submission to retrieve
 * @returns Submission data for grading
 */
export const getSubmissionForGradingService = async (
  client: SupabaseClient,
  instructorId: string,
  submissionId: string
): Promise<HandlerResult<z.infer<typeof import('@/features/grade/backend/schema').SubmissionGradingSchema>, typeof gradeErrorCodes[keyof typeof gradeErrorCodes], unknown>> => {
  try {
    // Get submission with assignment and course details to check permissions
    const { data: submission, error: submissionError } = await client
      .from(SUBMISSIONS_TABLE)
      .select(`
        id,
        assignment_id,
        user_id,
        content,
        link,
        submitted_at,
        is_late,
        score,
        feedback,
        status,
        assignments(
          title,
          course_id,
          courses(
            title,
            instructor_id
          )
        )
      `)
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      return failure(404, gradeErrorCodes.SUBMISSION_NOT_FOUND, 'Submission not found');
    }

    // Type assertion for nested structure
    const submissionData = submission as any;
    const assignmentData = Array.isArray(submissionData.assignments) ? submissionData.assignments[0] : submissionData.assignments;
    const courseData = Array.isArray(assignmentData.courses) ? assignmentData.courses[0] : assignmentData.courses;

    // Check if instructor has permission to view this submission
    if (courseData.instructor_id !== instructorId) {
      return failure(403, gradeErrorCodes.INSUFFICIENT_PERMISSIONS, 'Insufficient permissions to view this submission');
    }

    // Get user information
    const { data: user, error: userError } = await client
      .from(USERS_TABLE)
      .select('name')
      .eq('id', submission.user_id)
      .single();

    if (userError) {
      return failure(500, gradeErrorCodes.GRADES_FETCH_ERROR, 'Failed to fetch user information', userError.message);
    }

    // Construct the response data
    const responseData = {
      id: submission.id,
      assignment_id: submission.assignment_id,
      user_id: submission.user_id,
      user_name: user.name || 'Unknown User',
      content: submission.content,
      link: submission.link,
      submitted_at: submission.submitted_at,
      is_late: submission.is_late,
      score: submission.score,
      feedback: submission.feedback,
      status: submission.status as 'submitted' | 'graded' | 'resubmission_required',
      assignment_title: assignmentData.title,
      course_title: courseData.title,
    };

    // Validate response data using the schema from the schema file
    const { SubmissionGradingSchema } = await import('@/features/grade/backend/schema');
    const parsed = SubmissionGradingSchema.safeParse(responseData);
    if (!parsed.success) {
      return failure(
        500,
        gradeErrorCodes.GRADES_VALIDATION_ERROR,
        'Submission response failed validation.',
        parsed.error.format(),
      );
    }

    return success(parsed.data);
  } catch (error) {
    console.error('Error in getSubmissionForGradingService:', error);
    return failure(
      500,
      gradeErrorCodes.GRADES_FETCH_ERROR,
      error instanceof Error ? error.message : 'An unknown error occurred',
    );
  }
};

/**
 * Get submissions list for assignment
 * @param client Supabase client
 * @param instructorId ID of the authenticated instructor
 * @param assignmentId ID of the assignment to retrieve submissions for
 * @returns List of submissions for the assignment
 */
export const getAssignmentSubmissionsService = async (
  client: SupabaseClient,
  instructorId: string,
  assignmentId: string
): Promise<HandlerResult<z.infer<typeof import('@/features/grade/backend/schema').SubmissionsListSchema>, typeof gradeErrorCodes[keyof typeof gradeErrorCodes], unknown>> => {
  try {
    // Get assignment with course details to check permissions
    const { data: assignment, error: assignmentError } = await client
      .from(ASSIGNMENTS_TABLE)
      .select(`
        id,
        title,
        course_id,
        courses(
          title,
          instructor_id
        )
      `)
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      return failure(404, gradeErrorCodes.ASSIGNMENT_NOT_FOUND, 'Assignment not found');
    }

    // Type assertion for nested structure
    const assignmentData = assignment as any;
    const courseData = Array.isArray(assignmentData.courses) ? assignmentData.courses[0] : assignmentData.courses;

    // Check if instructor has permission to view submissions for this assignment
    if (courseData.instructor_id !== instructorId) {
      return failure(403, gradeErrorCodes.INSUFFICIENT_PERMISSIONS, 'Insufficient permissions to view submissions for this assignment');
    }

    // Get all submissions for the assignment
    const { data: submissions, error: submissionsError } = await client
      .from(SUBMISSIONS_TABLE)
      .select(`
        id,
        assignment_id,
        user_id,
        content,
        link,
        submitted_at,
        is_late,
        score,
        feedback,
        status
      `)
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });

    if (submissionsError) {
      return failure(500, gradeErrorCodes.GRADES_FETCH_ERROR, 'Failed to fetch submissions', submissionsError.message);
    }

    // Get user information for each submission
    const userIds = submissions.map(sub => sub.user_id);
    let users = [];
    if (userIds.length > 0) {
      const { data: userData, error: userError } = await client
        .from(USERS_TABLE)
        .select('id, name')
        .in('id', userIds);

      if (userError) {
        return failure(500, gradeErrorCodes.GRADES_FETCH_ERROR, 'Failed to fetch user information', userError.message);
      }
      users = userData || [];
    }

    // Create user map for quick lookup
    const userMap = new Map(users.map(user => [user.id, user.name]));

    // Construct the response data
    const responseData = submissions.map(submission => ({
      id: submission.id,
      assignment_id: submission.assignment_id,
      user_id: submission.user_id,
      user_name: userMap.get(submission.user_id) || 'Unknown User',
      content: submission.content,
      link: submission.link,
      submitted_at: submission.submitted_at,
      is_late: submission.is_late,
      score: submission.score,
      feedback: submission.feedback,
      status: submission.status as 'submitted' | 'graded' | 'resubmission_required',
      assignment_title: assignmentData.title,
      course_title: courseData.title,
    }));

    // Validate response data using the schema from the schema file
    const { SubmissionsListSchema } = await import('@/features/grade/backend/schema');
    const parsed = SubmissionsListSchema.safeParse(responseData);
    if (!parsed.success) {
      return failure(
        500,
        gradeErrorCodes.GRADES_VALIDATION_ERROR,
        'Submissions list response failed validation.',
        parsed.error.format(),
      );
    }

    return success(parsed.data);
  } catch (error) {
    console.error('Error in getAssignmentSubmissionsService:', error);
    return failure(
      500,
      gradeErrorCodes.GRADES_FETCH_ERROR,
      error instanceof Error ? error.message : 'An unknown error occurred',
    );
  }
};