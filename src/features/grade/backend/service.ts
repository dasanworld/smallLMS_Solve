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
): Promise<HandlerResult<z.infer<typeof GradeResponseSchema>, GradeServiceError, unknown>> => {
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