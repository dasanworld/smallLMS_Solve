import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  LearnerDashboardResponseSchema,
  CourseProgressSchema,
  AssignmentInfoSchema,
  FeedbackSummarySchema,
  type LearnerDashboardResponse,
} from '@/features/dashboard/backend/schema';
import {
  dashboardErrorCodes,
  type DashboardServiceError,
} from '@/features/dashboard/backend/error';

const ENROLLMENTS_TABLE = 'enrollments';
const COURSES_TABLE = 'courses';
const ASSIGNMENTS_TABLE = 'assignments';
const SUBMISSIONS_TABLE = 'submissions';

/**
 * Calculates the progress percentage for a course based on graded submissions
 * @param completedAssignments Number of assignments that have been graded
 * @param totalAssignments Total number of assignments in the course
 * @returns Progress percentage as a number between 0 and 100
 */
export const calculateCourseProgress = (
  completedAssignments: number,
  totalAssignments: number,
): number => {
  if (totalAssignments === 0) return 0;
  return Math.round((completedAssignments / totalAssignments) * 100);
};

/**
 * Gets the learner dashboard data for the authenticated user
 * @param client Supabase client
 * @param userId ID of the authenticated user
 * @returns Dashboard data including enrolled courses, upcoming assignments, and recent feedback
 */
export const getLearnerDashboardService = async (
  client: SupabaseClient,
  userId: string,
): Promise<HandlerResult<LearnerDashboardResponse, DashboardServiceError, unknown>> => {
  // Get enrolled active courses (소프트 삭제 필터 추가)
  const { data: enrollments, error: enrollmentsError } = await client
    .from(ENROLLMENTS_TABLE)
    .select('id, course_id')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (enrollmentsError) {
    return failure(500, dashboardErrorCodes.fetchError, 'Failed to fetch enrollments', enrollmentsError.message);
  }

  if (!enrollments) {
    // If user has no active enrollments, return empty dashboard
    return success({
      enrolledCourses: [],
      upcomingAssignments: [],
      recentFeedback: [],
    });
  }

  // Extract course IDs from enrollments
  const courseIds = enrollments.map(enrollment => enrollment.course_id);

  // Fetch course details
  const enrolledCourses = [];
  const upcomingAssignments: any[] = [];
  const recentFeedback: any[] = [];
  let allAssignmentsStatus: any[] = [];

  if (courseIds.length > 0) {
    // Get course details (소프트 삭제 필터 추가)
    const { data: courses, error: coursesError } = await client
      .from(COURSES_TABLE)
      .select('id, title, status')
      .in('id', courseIds)
      .is('deleted_at', null); // 소프트 삭제된 코스 제외

    if (coursesError) {
      return failure(500, dashboardErrorCodes.fetchError, 'Failed to fetch courses', coursesError.message);
    }

    // Get all assignments for enrolled courses (모든 상태의 과제 포함, 소프트 삭제된 과제는 제외)
    const { data: assignments, error: assignmentsError } = await client
      .from(ASSIGNMENTS_TABLE)
      .select('id, title, course_id, due_date, status')
      .in('course_id', courseIds)
      .is('deleted_at', null); // 소프트 삭제된 과제만 제외 (모든 상태 포함)

    if (assignmentsError) {
      return failure(500, dashboardErrorCodes.fetchError, 'Failed to fetch assignments', assignmentsError.message);
    }

    // Get all submissions for the user
    const { data: submissions, error: submissionsError } = await client
      .from(SUBMISSIONS_TABLE)
      .select('id, assignment_id, status, feedback, score, graded_at, is_late')
      .eq('user_id', userId)
      .in('assignment_id', assignments?.map(a => a.id) || []);

    if (submissionsError) {
      return failure(500, dashboardErrorCodes.fetchError, 'Failed to fetch submissions', submissionsError.message);
    }

    // Fetch course details for assignments (소프트 삭제 필터 추가)
    const { data: assignmentCourses, error: assignmentCoursesError } = await client
      .from(COURSES_TABLE)
      .select('id, title')
      .in('id', assignments?.map(a => a.course_id) || [])
      .is('deleted_at', null); // 소프트 삭제된 코스 제외

    if (assignmentCoursesError) {
      return failure(500, dashboardErrorCodes.fetchError, 'Failed to fetch assignment course details', assignmentCoursesError.message);
    }

    // Fetch course details for assignment submissions (소프트 삭제 필터 추가)
    const { data: submissionAssignmentDetails, error: submissionAssignmentError } = await client
      .from(ASSIGNMENTS_TABLE)
      .select('id, title, course_id')
      .in('id', submissions?.map(s => s.assignment_id) || [])
      .is('deleted_at', null); // 소프트 삭제된 과제 제외

    if (submissionAssignmentError) {
      return failure(500, dashboardErrorCodes.fetchError, 'Failed to fetch assignment details for submissions', submissionAssignmentError.message);
    }

    const { data: submissionAssignmentCourses, error: submissionAssignmentCourseError } = await client
      .from(COURSES_TABLE)
      .select('id, title')
      .in('id', submissionAssignmentDetails?.map(a => a.course_id) || [])
      .is('deleted_at', null); // 소프트 삭제된 코스 제외

    if (submissionAssignmentCourseError) {
      return failure(500, dashboardErrorCodes.fetchError, 'Failed to fetch courses for submission assignments', submissionAssignmentCourseError.message);
    }

    // Process each enrolled course to calculate progress
    for (const enrollment of enrollments) {
      const courseId = enrollment.course_id;
      const course = courses?.find(c => c.id === courseId);

      // Get all published assignments for this course
      const courseAssignments = assignments?.filter(
        assignment => assignment.course_id === courseId
      ) || [];

      // Get graded submissions for this course's assignments
      const courseSubmissions = submissions?.filter(
        submission =>
          courseAssignments.some(assignment => assignment.id === submission.assignment_id) &&
          submission.status === 'graded'
      ) || [];

      const completedAssignments = courseSubmissions.length;
      const totalAssignments = courseAssignments.length;

      const progress = calculateCourseProgress(completedAssignments, totalAssignments);

      enrolledCourses.push({
        courseId,
        courseTitle: course?.title || 'Unknown Course',
        completedAssignments,
        totalAssignments,
        progressPercentage: progress,
        status: course?.status || 'draft',
      });
    }

    // Find upcoming assignments (due in next 3 days)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysFromNowISO = threeDaysFromNow.toISOString();

    const upcoming = assignments?.filter(
      assignment =>
        new Date(assignment.due_date) <= new Date(threeDaysFromNowISO) &&
        new Date(assignment.due_date) >= new Date()
    ) || [];

    for (const assignment of upcoming) {
      // Check submission status for this assignment
      const submission = submissions?.find(
        sub => sub.assignment_id === assignment.id
      );

      // Find course title for this assignment
      const assignmentCourse = assignmentCourses?.find(c => c.id === assignment.course_id);

      upcomingAssignments.push({
        id: assignment.id,
        title: assignment.title,
        courseId: assignment.course_id,
        courseTitle: assignmentCourse?.title || 'Unknown Course',
        dueDate: assignment.due_date,
        status: submission?.status || 'not_submitted',
        isLate: submission?.is_late || false,
      });
    }

    // Get recent feedback (latest 5 graded submissions)
    const gradedSubmissions = (submissions || [])
      .filter(sub => sub.status === 'graded')
      .sort((a, b) => new Date(b.graded_at || '').getTime() - new Date(a.graded_at || '').getTime())
      .slice(0, 5);

    for (const submission of gradedSubmissions) {
      // Find assignment details for this submission
      const assignmentDetail = submissionAssignmentDetails?.find(a => a.id === submission.assignment_id);
      // Find course for this assignment
      const assignmentCourse = submissionAssignmentCourses?.find(c => assignmentDetail && c.id === assignmentDetail.course_id);

      recentFeedback.push({
        id: submission.id,
        assignmentId: submission.assignment_id,
        assignmentTitle: assignmentDetail?.title || 'Unknown Assignment',
        courseId: assignmentDetail?.course_id,
        courseTitle: assignmentCourse?.title || 'Unknown Course',
        feedback: submission.feedback,
        score: submission.score,
        gradedAt: submission.graded_at,
      });
    }

    // Get all assignments with submission status for enrolled courses
    for (const assignment of assignments || []) {
      const submission = submissions?.find(
        sub => sub.assignment_id === assignment.id
      );
      const assignmentCourse = assignmentCourses?.find(c => c.id === assignment.course_id);

      allAssignmentsStatus.push({
        id: submission?.id || `${assignment.id}-no-submission`,
        assignmentId: assignment.id,
        assignmentTitle: assignment.title,
        courseId: assignment.course_id,
        courseTitle: assignmentCourse?.title || 'Unknown Course',
        status: submission?.status || 'not_submitted',
        isLate: submission?.is_late || false,
        score: submission?.score,
        submittedAt: submission?.id ? assignment.due_date : undefined,
      });
    }
  }

  const dashboardData = {
    enrolledCourses,
    upcomingAssignments,
    recentFeedback,
    allAssignmentsStatus: courseIds.length > 0 ? allAssignmentsStatus : [],
  };

  // Validate response data
  const parsed = LearnerDashboardResponseSchema.safeParse(dashboardData);
  if (!parsed.success) {
    return failure(
      500,
      dashboardErrorCodes.validationError,
      'Dashboard response failed validation.',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};