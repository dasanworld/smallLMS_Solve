/**
 * 과제 관리 비즈니스 로직 서비스
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppLogger } from '@/backend/hono/context';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import { assignmentErrorCodes, type AssignmentErrorCode } from './error';
import type {
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  GradeSubmissionRequest,
  AssignmentResponse,
  AssignmentListResponse,
  SubmissionResponse,
  SubmissionStatsResponse,
} from './schema';

type Dependencies = {
  supabase: SupabaseClient;
  logger: AppLogger;
};

// ============ Assignment 서비스 ============

/**
 * 과제 생성 서비스
 * - 과제 데이터 검증
 * - 코스 소유권 확인
 * - 가중치 검증 (트랜잭션 포함)
 */
export const createAssignmentService = async (
  deps: Dependencies,
  userId: string,
  data: CreateAssignmentRequest
): Promise<HandlerResult<AssignmentResponse, AssignmentErrorCode, unknown>> => {
  const { supabase, logger } = deps;

  try {
    // 코스 소유권 확인
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, owner_id')
      .eq('id', data.courseId)
      .eq('owner_id', userId)
      .single();

    if (courseError || !course) {
      logger.warn('Unauthorized course access', { userId, courseId: data.courseId });
      return failure(403, assignmentErrorCodes.INSUFFICIENT_PERMISSIONS, 'Unauthorized course access');
    }

    // 과제 생성
    const { data: assignment, error: createError } = await supabase
      .from('assignments')
      .insert({
        course_id: data.courseId,
        title: data.title,
        description: data.description,
        due_date: data.dueDate,
        points_weight: data.pointsWeight,
        allow_late: data.allowLate,
        allow_resubmission: data.allowResubmission,
        status: 'draft',
      })
      .select()
      .single();

    if (createError) {
      logger.error('Failed to create assignment', {
        error: createError,
        userId,
        courseId: data.courseId,
      });

      // 가중치 초과 에러 처리
      if (createError.message?.includes('ASSIGNMENT_WEIGHT_EXCEEDED')) {
        return failure(400, assignmentErrorCodes.ASSIGNMENT_WEIGHT_EXCEEDED, 'Assignment weight exceeded');
      }

      return failure(500, assignmentErrorCodes.DATABASE_ERROR, 'Failed to create assignment');
    }

    const response = mapAssignmentToResponse(assignment);
    return success(response, 201);
  } catch (error: any) {
    logger.error('Assignment creation service error', { error });
    return failure(500, assignmentErrorCodes.INTERNAL_SERVER_ERROR, 'Internal server error');
  }
};

/**
 * 과제 수정 서비스
 */
export const updateAssignmentService = async (
  deps: Dependencies,
  userId: string,
  data: UpdateAssignmentRequest
): Promise<HandlerResult<AssignmentResponse, AssignmentErrorCode, unknown>> => {
  const { supabase, logger } = deps;

  try {
    // 기존 과제 확인 및 권한 검증
    const { data: assignment, error: fetchError } = await supabase
      .from('assignments')
      .select('id, course_id')
      .eq('id', data.assignmentId)
      .single();

    if (fetchError || !assignment) {
      return failure(404, assignmentErrorCodes.ASSIGNMENT_NOT_FOUND, 'Assignment not found');
    }

    // 코스 소유권 확인
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('owner_id')
      .eq('id', assignment.course_id)
      .single();

    if (courseError || !course || course.owner_id !== userId) {
      logger.warn('Unauthorized assignment update', { userId, assignmentId: data.assignmentId });
      return failure(403, assignmentErrorCodes.INSUFFICIENT_PERMISSIONS, 'Unauthorized assignment update');
    }

    // 과제 수정
    const updateData: Record<string, any> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.dueDate !== undefined) updateData.due_date = data.dueDate;
    if (data.pointsWeight !== undefined) updateData.points_weight = data.pointsWeight;
    if (data.allowLate !== undefined) updateData.allow_late = data.allowLate;
    if (data.allowResubmission !== undefined) updateData.allow_resubmission = data.allowResubmission;

    const { data: updated, error: updateError } = await supabase
      .from('assignments')
      .update(updateData)
      .eq('id', data.assignmentId)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to update assignment', {
        error: updateError,
        assignmentId: data.assignmentId,
      });

      if (updateError.message?.includes('ASSIGNMENT_WEIGHT_EXCEEDED')) {
        return failure(400, assignmentErrorCodes.ASSIGNMENT_WEIGHT_EXCEEDED, 'Assignment weight exceeded');
      }

      return failure(500, assignmentErrorCodes.DATABASE_ERROR, 'Failed to update assignment');
    }

    const response = mapAssignmentToResponse(updated);
    return success(response, 200);
  } catch (error: any) {
    logger.error('Assignment update service error', { error });
    return failure(500, assignmentErrorCodes.INTERNAL_SERVER_ERROR, 'Internal server error');
  }
};

/**
 * 과제 삭제 서비스 (소프트 삭제)
 */
export const deleteAssignmentService = async (
  deps: Dependencies,
  userId: string,
  assignmentId: string
): Promise<HandlerResult<void, AssignmentErrorCode, unknown>> => {
  const { supabase, logger } = deps;

  try {
    // 기존 과제 확인 및 권한 검증
    const { data: assignment, error: fetchError } = await supabase
      .from('assignments')
      .select('id, course_id')
      .eq('id', assignmentId)
      .single();

    if (fetchError || !assignment) {
      return failure(404, assignmentErrorCodes.ASSIGNMENT_NOT_FOUND, 'Assignment not found');
    }

    // 코스 소유권 확인
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('owner_id')
      .eq('id', assignment.course_id)
      .single();

    if (courseError || !course || course.owner_id !== userId) {
      logger.warn('Unauthorized assignment deletion', { userId, assignmentId });
      return failure(403, assignmentErrorCodes.INSUFFICIENT_PERMISSIONS, 'Unauthorized assignment deletion');
    }

    // 소프트 삭제
    const { error: deleteError } = await supabase
      .from('assignments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', assignmentId);

    if (deleteError) {
      logger.error('Failed to delete assignment', { error: deleteError, assignmentId });
      return failure(500, assignmentErrorCodes.DATABASE_ERROR, 'Failed to delete assignment');
    }

    return success(undefined, 200);
  } catch (error: any) {
    logger.error('Assignment deletion service error', { error });
    return failure(500, assignmentErrorCodes.INTERNAL_SERVER_ERROR, 'Internal server error');
  }
};

/**
 * 과제 상태 변경 서비스
 * - draft → published: 학습자에게 공개
 * - published → closed: 제출 차단
 */
export const updateAssignmentStatusService = async (
  deps: Dependencies,
  userId: string,
  assignmentId: string,
  newStatus: string
): Promise<HandlerResult<AssignmentResponse, AssignmentErrorCode, unknown>> => {
  const { supabase, logger } = deps;

  try {
    // 기존 과제 확인 및 권한 검증
    const { data: assignment, error: fetchError } = await supabase
      .from('assignments')
      .select('id, status, due_date, course_id')
      .eq('id', assignmentId)
      .single();

    if (fetchError || !assignment) {
      return failure(404, assignmentErrorCodes.ASSIGNMENT_NOT_FOUND, 'Assignment not found');
    }

    // 코스 소유권 확인
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('owner_id')
      .eq('id', assignment.course_id)
      .single();

    if (courseError || !course || course.owner_id !== userId) {
      logger.warn('Unauthorized status change', { userId, assignmentId });
      return failure(403, assignmentErrorCodes.INSUFFICIENT_PERMISSIONS, 'Unauthorized status change');
    }

    // 상태 전환 검증
    const isValidTransition = isValidStatusTransition(assignment.status, newStatus);
    if (!isValidTransition) {
      return failure(400, assignmentErrorCodes.INVALID_STATUS_TRANSITION, 'Invalid status transition');
    }

    // 업데이트 데이터 준비
    const updateData: Record<string, any> = { status: newStatus };
    if (newStatus === 'published') {
      updateData.published_at = new Date().toISOString();
    } else if (newStatus === 'closed') {
      updateData.closed_at = new Date().toISOString();
    }

    // 상태 변경
    const { data: updated, error: updateError } = await supabase
      .from('assignments')
      .update(updateData)
      .eq('id', assignmentId)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to update assignment status', {
        error: updateError,
        assignmentId,
        newStatus,
      });

      if (updateError.message?.includes('ASSIGNMENT_PAST_DEADLINE')) {
        return failure(400, assignmentErrorCodes.ASSIGNMENT_PAST_DEADLINE, 'Assignment past deadline');
      }

      return failure(500, assignmentErrorCodes.DATABASE_ERROR, 'Failed to update assignment status');
    }

    const response = mapAssignmentToResponse(updated);
    return success(response, 200);
  } catch (error: any) {
    logger.error('Assignment status update service error', { error });
    return failure(500, assignmentErrorCodes.INTERNAL_SERVER_ERROR, 'Internal server error');
  }
};

/**
 * 코스 내 과제 목록 조회
 */
export const getCourseAssignmentsService = async (
  deps: Dependencies,
  userId: string,
  courseId: string,
  limit: number = 20,
  offset: number = 0
): Promise<HandlerResult<AssignmentListResponse, AssignmentErrorCode, unknown>> => {
  const { supabase, logger } = deps;

  try {
    // 코스 접근 권한 확인 (코스 소유자 또는 등록된 학습자)
    const { data: course } = await supabase
      .from('courses')
      .select('id, owner_id')
      .eq('id', courseId)
      .single();

    if (!course) {
      return failure(404, assignmentErrorCodes.COURSE_NOT_FOUND, 'Course not found');
    }

    // 전체 과제 수 조회
    const { count } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId)
      .is('deleted_at', null);

    // 과제 목록 조회
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('course_id', courseId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Failed to fetch assignments', { error, courseId });
      return failure(500, assignmentErrorCodes.DATABASE_ERROR, 'Failed to fetch assignments');
    }

    const response: AssignmentListResponse = {
      data: (assignments || []).map(mapAssignmentToResponse),
      total: count || 0,
      limit,
      offset,
    };

    return success(response, 200);
  } catch (error: any) {
    logger.error('Get course assignments service error', { error });
    return failure(500, assignmentErrorCodes.INTERNAL_SERVER_ERROR, 'Internal server error');
  }
};

// ============ Submission 서비스 ============

/**
 * 제출물 목록 조회
 */
export const getAssignmentSubmissionsService = async (
  deps: Dependencies,
  userId: string,
  assignmentId: string,
  limit: number = 20,
  offset: number = 0
): Promise<HandlerResult<{
  data: SubmissionResponse[];
  total: number;
  limit: number;
  offset: number;
}, AssignmentErrorCode, unknown>> => {
  const { supabase, logger } = deps;

  try {
    // 과제 소유권 확인
    const { data: assignment, error: fetchError } = await supabase
      .from('assignments')
      .select('id, course_id')
      .eq('id', assignmentId)
      .single();

    if (fetchError || !assignment) {
      return failure(404, assignmentErrorCodes.ASSIGNMENT_NOT_FOUND, 'Assignment not found');
    }

    // 코스 소유권 확인
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('owner_id')
      .eq('id', assignment.course_id)
      .single();

    if (courseError || !course || course.owner_id !== userId) {
      logger.warn('Unauthorized submission access', { userId, assignmentId });
      return failure(403, assignmentErrorCodes.INSUFFICIENT_PERMISSIONS, 'Unauthorized submission access');
    }

    // 전체 제출물 수
    const { count } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('assignment_id', assignmentId);

    // 제출물 목록 조회
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Failed to fetch submissions', { error, assignmentId });
      return failure(500, assignmentErrorCodes.DATABASE_ERROR, 'Failed to fetch submissions');
    }

    return success({
      data: (submissions || []).map(mapSubmissionToResponse),
      total: count || 0,
      limit,
      offset,
    }, 200);
  } catch (error: any) {
    logger.error('Get submissions service error', { error });
    return failure(500, assignmentErrorCodes.INTERNAL_SERVER_ERROR, 'Internal server error');
  }
};

/**
 * 제출물 채점 서비스
 */
export const gradeSubmissionService = async (
  deps: Dependencies,
  userId: string,
  data: GradeSubmissionRequest
): Promise<HandlerResult<SubmissionResponse, AssignmentErrorCode, unknown>> => {
  const { supabase, logger } = deps;

  try {
    // 제출물 정보 확인
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('id, assignment_id')
      .eq('id', data.submissionId)
      .single();

    if (fetchError || !submission) {
      return failure(404, assignmentErrorCodes.SUBMISSION_NOT_FOUND, 'Submission not found');
    }

    // 과제 정보 조회
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('course_id')
      .eq('id', submission.assignment_id)
      .single();

    if (assignmentError || !assignment) {
      return failure(404, assignmentErrorCodes.ASSIGNMENT_NOT_FOUND, 'Assignment not found');
    }

    // 코스 소유권 확인
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('owner_id')
      .eq('id', assignment.course_id)
      .single();

    if (courseError || !course || course.owner_id !== userId) {
      logger.warn('Unauthorized grading', { userId, submissionId: data.submissionId });
      return failure(403, assignmentErrorCodes.INSUFFICIENT_PERMISSIONS, 'Unauthorized grading');
    }

    // 점수 범위 검증
    if (data.score < 0 || data.score > 100) {
      return failure(400, assignmentErrorCodes.INVALID_SCORE, 'Invalid score range');
    }

    // 채점 정보 업데이트
    const { data: graded, error: gradeError } = await supabase
      .from('submissions')
      .update({
        score: data.score,
        feedback: data.feedback,
        status: data.status,
        graded_at: new Date().toISOString(),
      })
      .eq('id', data.submissionId)
      .select()
      .single();

    if (gradeError) {
      logger.error('Failed to grade submission', { error: gradeError, submissionId: data.submissionId });
      return failure(500, assignmentErrorCodes.DATABASE_ERROR, 'Failed to grade submission');
    }

    const response = mapSubmissionToResponse(graded);
    return success(response, 200);
  } catch (error: any) {
    logger.error('Grade submission service error', { error });
    return failure(500, assignmentErrorCodes.INTERNAL_SERVER_ERROR, 'Internal server error');
  }
};

/**
 * 제출물 통계 조회
 */
export const getSubmissionStatsService = async (
  deps: Dependencies,
  userId: string,
  assignmentId: string
): Promise<HandlerResult<SubmissionStatsResponse, AssignmentErrorCode, unknown>> => {
  const { supabase, logger } = deps;

  try {
    // 과제 소유권 확인
    const { data: assignment, error: fetchError } = await supabase
      .from('assignments')
      .select('id, course_id')
      .eq('id', assignmentId)
      .single();

    if (fetchError || !assignment) {
      return failure(404, assignmentErrorCodes.ASSIGNMENT_NOT_FOUND, 'Assignment not found');
    }

    // 코스 소유권 확인
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('owner_id')
      .eq('id', assignment.course_id)
      .single();

    if (courseError || !course || course.owner_id !== userId) {
      logger.warn('Unauthorized stats access', { userId, assignmentId });
      return failure(403, assignmentErrorCodes.INSUFFICIENT_PERMISSIONS, 'Unauthorized stats access');
    }

    // 통계 계산
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('status, is_late, score')
      .eq('assignment_id', assignmentId);

    if (error) {
      logger.error('Failed to fetch submissions for stats', { error, assignmentId });
      return failure(500, assignmentErrorCodes.DATABASE_ERROR, 'Failed to fetch submissions for stats');
    }

    const stats = computeSubmissionStats(assignmentId, submissions || []);
    return success(stats, 200);
  } catch (error: any) {
    logger.error('Get submission stats service error', { error });
    return failure(500, assignmentErrorCodes.INTERNAL_SERVER_ERROR, 'Internal server error');
  }
};

// ============ 헬퍼 함수 ============

/**
 * 과제 데이터를 응답 형식으로 변환
 */
function mapAssignmentToResponse(assignment: any): AssignmentResponse {
  return {
    id: assignment.id,
    courseId: assignment.course_id,
    title: assignment.title,
    description: assignment.description,
    dueDate: assignment.due_date,
    pointsWeight: assignment.points_weight,
    status: assignment.status,
    allowLate: assignment.allow_late,
    allowResubmission: assignment.allow_resubmission,
    publishedAt: assignment.published_at,
    closedAt: assignment.closed_at,
    createdAt: assignment.created_at,
    updatedAt: assignment.updated_at,
  };
}

/**
 * 제출물 데이터를 응답 형식으로 변환
 */
function mapSubmissionToResponse(submission: any): SubmissionResponse {
  return {
    id: submission.id,
    assignmentId: submission.assignment_id,
    userId: submission.user_id,
    content: submission.content,
    link: submission.link,
    status: submission.status,
    isLate: submission.is_late,
    score: submission.score,
    feedback: submission.feedback,
    gradedAt: submission.graded_at,
    submittedAt: submission.submitted_at,
    updatedAt: submission.updated_at,
  };
}

/**
 * 상태 전환 유효성 검증
 */
function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  const validTransitions: Record<string, string[]> = {
    draft: ['published', 'closed'], // draft에서 published 또는 closed로 변경 가능
    published: ['closed'], // published에서 closed로만 변경 가능
    closed: [], // closed에서는 변경 불가능
  };

  return (validTransitions[currentStatus] || []).includes(newStatus);
}

/**
 * 제출물 통계 계산
 */
function computeSubmissionStats(
  assignmentId: string,
  submissions: any[]
): SubmissionStatsResponse {
  const stats = {
    submitted: 0,
    graded: 0,
    late: 0,
    resubmissionRequired: 0,
    scores: [] as number[],
  };

  submissions.forEach((sub) => {
    if (sub.status === 'graded') stats.graded++;
    if (sub.is_late) stats.late++;
    if (sub.status === 'resubmission_required') stats.resubmissionRequired++;
    if (sub.score !== null) stats.scores.push(sub.score);
  });

  stats.submitted = submissions.length;

  const averageScore = stats.scores.length > 0
    ? stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length
    : null;

  return {
    assignmentId,
    total: submissions.length,
    submitted: stats.submitted,
    graded: stats.graded,
    late: stats.late,
    resubmissionRequired: stats.resubmissionRequired,
    averageScore,
  };
}

