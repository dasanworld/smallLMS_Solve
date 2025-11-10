import type { SupabaseClient } from '@supabase/supabase-js';
import type { CreateEnrollmentRequest } from './schema';
import { enrollmentErrorCodes } from './error';
import { success, failure, type HandlerResult } from '@/backend/http/response';

type EnrollmentErrorCode = typeof enrollmentErrorCodes[keyof typeof enrollmentErrorCodes];

/**
 * 사용자 수강신청 목록 조회
 */
export const getUserEnrollmentsService = async (
  supabase: SupabaseClient,
  userId: string
): Promise<HandlerResult<{ enrollments: any[] }, EnrollmentErrorCode>> => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('enrolled_at', { ascending: false });

    if (error) {
      return failure(500, enrollmentErrorCodes.ENROLLMENT_FETCH_ERROR, error.message);
    }

    return success({
      enrollments: data || [],
    });
  } catch (error) {
    return failure(500, enrollmentErrorCodes.ENROLLMENT_FETCH_ERROR, String(error));
  }
};

/**
 * 코스 수강신청
 */
export const createEnrollmentService = async (
  supabase: SupabaseClient,
  userId: string,
  courseId: string
): Promise<HandlerResult<any, EnrollmentErrorCode>> => {
  try {
    // 이미 등록되어 있는지 확인
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'active')
      .single();

    if (existingEnrollment) {
      return failure(409, enrollmentErrorCodes.ALREADY_ENROLLED, 'Already enrolled in this course');
    }

    // 새로운 수강신청 생성
    const { data, error } = await supabase
      .from('enrollments')
      .insert([
        {
          user_id: userId,
          course_id: courseId,
          status: 'active',
        },
      ])
      .select()
      .single();

    if (error) {
      return failure(500, enrollmentErrorCodes.ENROLLMENT_CREATION_ERROR, error.message);
    }

    return success(data, 201);
  } catch (error) {
    return failure(500, enrollmentErrorCodes.ENROLLMENT_CREATION_ERROR, String(error));
  }
};

/**
 * 수강신청 취소
 */
export const deleteEnrollmentService = async (
  supabase: SupabaseClient,
  enrollmentId: string,
  userId: string
): Promise<HandlerResult<any, EnrollmentErrorCode>> => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .update({ status: 'cancelled' })
      .eq('id', enrollmentId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      return failure(404, enrollmentErrorCodes.ENROLLMENT_NOT_FOUND, 'Enrollment not found or unauthorized');
    }

    return success(data);
  } catch (error) {
    return failure(500, enrollmentErrorCodes.ENROLLMENT_DELETE_ERROR, String(error));
  }
};
