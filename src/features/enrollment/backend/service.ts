import { SupabaseClient } from '@supabase/supabase-js';
import { HandlerResult, success, failure } from '@/backend/http/response';
import { enrollmentErrorCodes } from './error';

const COURSES_TABLE = 'courses';
const ENROLLMENTS_TABLE = 'enrollments';

/**
 * 수강신청 (새로운 수강등록)
 * - 코스가 published 상태인지 확인
 * - 아카이브된 코스는 불가
 * - 중복 수강 방지
 * - 취소된 수강은 다시 활성화
 */
export const createEnrollmentService = async (
  supabase: SupabaseClient,
  userId: string,
  courseId: string
): Promise<HandlerResult<{ id: string; status: string }, typeof enrollmentErrorCodes[keyof typeof enrollmentErrorCodes]>> => {
  try {
    // 1. 코스 정보 확인 (published 상태 확인, 소프트 삭제 필터)
    const { data: course, error: courseError } = await supabase
      .from(COURSES_TABLE)
      .select('id, status, deleted_at')
      .eq('id', courseId)
      .is('deleted_at', null)
      .single();

    if (courseError || !course) {
      return failure(
        404,
        enrollmentErrorCodes.INVALID_COURSE_ID,
        '코스를 찾을 수 없습니다.'
      );
    }

    // 2. 코스 상태 확인
    if (course.status === 'archived') {
      return failure(
        403,
        enrollmentErrorCodes.COURSE_ARCHIVED,
        '이 코스는 종료되었습니다.'
      );
    }

    if (course.status !== 'published') {
      return failure(
        403,
        enrollmentErrorCodes.COURSE_NOT_PUBLISHED,
        '이 코스는 아직 공개되지 않았습니다.'
      );
    }

    // 3. 이미 수강 중인지 확인
    const { data: activeEnrollment, error: activeCheckError } = await supabase
      .from(ENROLLMENTS_TABLE)
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'active')
      .maybeSingle();

    if (activeEnrollment) {
      return failure(
        409,
        enrollmentErrorCodes.ALREADY_ENROLLED,
        '이미 이 코스에 등록되어 있습니다.'
      );
    }

    // 4. 취소된 수강이 있는지 확인
    const { data: cancelledEnrollment, error: cancelledCheckError } = await supabase
      .from(ENROLLMENTS_TABLE)
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'cancelled')
      .maybeSingle();

    // 5. 취소된 수강이 있으면 활성화, 없으면 새로 생성
    if (cancelledEnrollment) {
      // 취소된 수강을 다시 활성화
      const { data: reactivatedEnrollment, error: updateError } = await supabase
        .from(ENROLLMENTS_TABLE)
        .update({
          status: 'active',
          enrolled_at: new Date().toISOString(),
        })
        .eq('id', cancelledEnrollment.id)
        .select('id, status')
        .single();

      if (updateError || !reactivatedEnrollment) {
        return failure(
          500,
          enrollmentErrorCodes.ENROLLMENT_CREATION_ERROR,
          '수강신청에 실패했습니다.'
        );
      }

      return success({
        id: reactivatedEnrollment.id,
        status: reactivatedEnrollment.status,
      });
    }

    // 6. 새로운 수강신청 생성
    const { data: newEnrollment, error: createError } = await supabase
      .from(ENROLLMENTS_TABLE)
      .insert({
        user_id: userId,
        course_id: courseId,
        status: 'active',
      })
      .select('id, status')
      .single();

    if (createError || !newEnrollment) {
      return failure(
        500,
        enrollmentErrorCodes.ENROLLMENT_CREATION_ERROR,
        '수강신청에 실패했습니다.'
      );
    }

    return success({
      id: newEnrollment.id,
      status: newEnrollment.status,
    });
  } catch (err) {
    return failure(
      500,
      enrollmentErrorCodes.ENROLLMENT_CREATION_ERROR,
      String(err)
    );
  }
};

/**
 * 수강취소 (상태 업데이트)
 * - active 상태의 수강을 cancelled로 변경
 */
export const cancelEnrollmentService = async (
  supabase: SupabaseClient,
  userId: string,
  courseId: string
): Promise<HandlerResult<{ status: string }, typeof enrollmentErrorCodes[keyof typeof enrollmentErrorCodes]>> => {
  try {
    // 1. 수강정보 확인
    const { data: enrollment, error: fetchError } = await supabase
      .from(ENROLLMENTS_TABLE)
      .select('id, status')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'active')
      .single();

    if (fetchError || !enrollment) {
      return failure(
        404,
        enrollmentErrorCodes.NOT_ENROLLED,
        '이 코스에 등록되어 있지 않습니다.'
      );
    }

    // 2. 수강상태 업데이트
    const { data: updatedEnrollment, error: updateError } = await supabase
      .from(ENROLLMENTS_TABLE)
      .update({ status: 'cancelled' })
      .eq('id', enrollment.id)
      .select('status')
      .single();

    if (updateError || !updatedEnrollment) {
      return failure(
        500,
        enrollmentErrorCodes.ENROLLMENT_UPDATE_ERROR,
        '수강취소에 실패했습니다.'
      );
    }

    return success({
      status: updatedEnrollment.status,
    });
  } catch (err) {
    return failure(
      500,
      enrollmentErrorCodes.ENROLLMENT_UPDATE_ERROR,
      String(err)
    );
  }
};

/**
 * 사용자의 수강중인 코스 목록 조회
 */
export const getUserEnrollmentsService = async (
  supabase: SupabaseClient,
  userId: string
): Promise<HandlerResult<{ enrollments: any[] }, typeof enrollmentErrorCodes[keyof typeof enrollmentErrorCodes]>> => {
  try {
    const { data: enrollments, error } = await supabase
      .from(ENROLLMENTS_TABLE)
      .select(`
        id,
        course_id,
        status,
        enrolled_at,
        courses (
          id,
          title,
          description,
          status
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      return failure(
        500,
        enrollmentErrorCodes.ENROLLMENT_FETCH_ERROR,
        '수강정보를 불러올 수 없습니다.'
      );
    }

    return success({
      enrollments: enrollments || [],
    });
  } catch (err) {
    return failure(
      500,
      enrollmentErrorCodes.ENROLLMENT_FETCH_ERROR,
      String(err)
    );
  }
};

/**
 * 특정 코스의 수강자 수 조회
 */
export const getCourseEnrollmentCountService = async (
  supabase: SupabaseClient,
  courseId: string
): Promise<HandlerResult<{ count: number }, typeof enrollmentErrorCodes[keyof typeof enrollmentErrorCodes]>> => {
  try {
    const { count, error } = await supabase
      .from(ENROLLMENTS_TABLE)
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId)
      .eq('status', 'active');

    if (error) {
      return failure(
        500,
        enrollmentErrorCodes.ENROLLMENT_FETCH_ERROR,
        '수강자 수를 조회할 수 없습니다.'
      );
    }

    return success({
      count: count || 0,
    });
  } catch (err) {
    return failure(
      500,
      enrollmentErrorCodes.ENROLLMENT_FETCH_ERROR,
      String(err)
    );
  }
};

