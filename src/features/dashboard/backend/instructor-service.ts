import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  InstructorDashboardResponseSchema,
  type InstructorDashboardResponse,
} from '@/features/dashboard/backend/instructor-schema';
import {
  dashboardErrorCodes,
  type DashboardServiceError,
} from '@/features/dashboard/backend/error';

const COURSES_TABLE = 'courses';
const ASSIGNMENTS_TABLE = 'assignments';
const SUBMISSIONS_TABLE = 'submissions';
const ENROLLMENTS_TABLE = 'enrollments';

/**
 * Gets the instructor dashboard data for the authenticated user
 * @param client Supabase client
 * @param userId ID of the authenticated user (instructor)
 * @returns Dashboard data including instructor's courses, pending grading count, and recent submissions
 */
export const getInstructorDashboardService = async (
  client: SupabaseClient,
  userId: string,
): Promise<HandlerResult<InstructorDashboardResponse, DashboardServiceAffected> => {
  // Get instructor's courses (소프트 삭제 필터 추가)
  const { data: courses, error: coursesError } = await client
    .from(COURSES_TABLE)
    .select('id, title, status, created_at')
    .eq('owner_id', userId)
    .is('deleted_at', null); // 소프트 삭제된 코스 제외

  if (coursesError) {
    return failure(500, dashboardErrorCodes.fetchError, 'Failed to fetch courses', coursesError.message);
  }

  // Get all assignments for instructor's courses that are published (소프트 삭제 필터 추가)
  const courseIds = courses?.map(course => course.id) || [];
  let assignments: any[] = [];
  
  if (courseIds.length > 0) {
    const { data: courseAssignments, error: assignmentsError } = await client
      .from(ASSIGNMENTS_TABLE)
      .select('id, title, course_id, due_date, status')
      .in('course_id', courseIds)
      .eq('status', 'published')
      .is('deleted_at', null); // 소프트 삭제된 과제 제외

    if (assignmentsError) {
      return failure(500, dashboardErrorCodes.fetchError, 'Failed to fetch assignments', assignmentsError.message);
    }

    assignments = courseAssignments || [];
  }

  // Get pending grading submissions (ungraded submissions for instructor's assignments)
  const assignmentIds = assignments.map(assignment => assignment.id);
  let pendingGradingCount = 0;
  let recentSubmissions: any[] = [];

  if (assignmentIds.length > 0) {
    // Get count of ungraded submissions
    const { count: ungradedCount, error: countError } = await client
      .from(SUBMISSIONS_TABLE)
      .select('*', { count: 'exact', head: true })
      .in('assignment_id', assignmentIds)
      .neq('status', 'graded'); // Count all non-graded submissions

    if (countError) {
      return failure(500, dashboardErrorCodes.fetchError, 'Failed to count pending grading submissions', countError.message);
    }

    pendingGradingCount = ungradedCount || 0;

    // Get recent submissions (latest 10) for instructor's assignments
    const { data: submissionData, error: submissionsError } = await client
      .from(SUBMISSIONS_TABLE)
      .select(`
        id,
        assignment_id,
        user_id,
        status,
        submitted_at,
        is_late,
        created_at
      `)
      .in('assignment_id', assignmentIds)
      .order('created_at', { ascending: false })
      .limit(10);

    if (submissionsError) {
      return failure(500, dashboardErrorCodes.fetchError, 'Failed to fetch submissions', submissionsError.message);
    }

    // Get assignment titles for the recent submissions
    const submissionAssignmentIds = submissionData?.map(sub => sub.assignment_id) || [];
    let submissionAssignments: any[] = [];
    
    if (submissionAssignmentIds.length > 0) {
      const { data: subAssignments, error: subAssignmentsError } = await client
        .from(ASSIGNMENTS_TABLE)
        .select('id, title, course_id')
        .in('id', submissionAssignmentIds)
        .is('deleted_at', null); // 소프트 삭제된 과제 제외

      if (subAssignmentsError) {
        return failure(500, dashboardErrorCodes.fetchError, 'Failed to fetch assignment details for submissions', subAssignmentsError.message);
      }

      submissionAssignments = subAssignments || [];
    }

    // Get course titles for the recent submissions
    const submissionCourseIds = submissionAssignments.map(assignment => assignment.course_id);
    let submissionCourses: any[] = [];
    
    if (submissionCourseIds.length > 0) {
      const { data: subCourses, error: subCoursesError } = await client
        .from(COURSES_TABLE)
        .select('id, title')
        .in('id', submissionCourseIds)
        .is('deleted_at', null); // 소프트 삭제된 코스 제외

      if (subCoursesError) {
        return failure(500, dashboardErrorCodes.fetchError, 'Failed to fetch course details for submissions', subCoursesError.message);
      }

      submissionCourses = subCourses || [];
    }

    // Get student names for the recent submissions
    const submissionUserIds = submissionData?.map(sub => sub.user_id) || [];
    let students: any[] = [];
    
    if (submissionUserIds.length > 0) {
      // In a real implementation, we'd have a users table to get student names
      // For now, we'll just return placeholder names or the user IDs
      // Assuming we have a profiles or users table to get names
      const { data: userData, error: userError } = await client
        .from('profiles') // Assuming there's a profiles table with user information
        .select('id, full_name, email')
        .in('id', submissionUserIds);

      if (userError) {
        console.warn('Failed to fetch user profiles:', userError.message);
        // Continue without user names
      } else {
        students = userData || [];
      }
    }

    // Combine submission data with assignment and course information
    for (const submission of submissionData || []) {
      const assignment = submissionAssignments.find(a => a.id === submission.assignment_id);
      const course = submissionCourses.find(c => c.id === assignment?.course_id);
      const student = students.find(s => s.id === submission.user_id);

      recentSubmissions.push({
        id: submission.id,
        assignmentId: submission.assignment_id,
        assignmentTitle: assignment?.title || 'Unknown Assignment',
        courseId: assignment?.course_id,
        courseTitle: course?.title || 'Unknown Course',
        studentName: student?.full_name || student?.email || `Student ${submission.user_id.substring(0, 8)}`,
        submittedAt: submission.submitted_at || submission.created_at,
        status: submission.status,
        isLate: submission.is_late || false,
      });
    }
  }

  // Add enrollment count to each course
  const coursesWithEnrollment = [];
  for (const course of courses || []) {
    // Get enrollment count for this course
    const { count: enrollmentCount, error: enrollmentError } = await client
      .from(ENROLLMENTS_TABLE)
      .select('*', { count: 'exact', head: true })
      .eq('course_id', course.id)
      .eq('status', 'active'); // Only count active enrollments

    if (enrollmentError) {
      console.error(`Failed to count enrollments for course ${course.id}:`, enrollmentError.message);
      // Continue with enrollment count as 0
    }

    // Get assignment count for this course
    const courseAssignments = assignments.filter(a => a.course_id === course.id);
    const assignmentCount = courseAssignments.length;

    coursesWithEnrollment.push({
      id: course.id,
      title: course.title,
      status: course.status,
      enrollmentCount: enrollmentCount || 0,
      assignmentCount,
      createdAt: course.created_at,
    });
  }

  const dashboardData = {
    courses: coursesWithEnrollment,
    pendingGradingCount,
    recentSubmissions,
  };

  // Validate response data
  const parsed = InstructorDashboardResponseSchema.safeParse(dashboardData);
  if (!parsed.success) {
    return failure(
      500,
      dashboardErrorCodes.validationError,
      'Instructor dashboard response failed validation.',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};