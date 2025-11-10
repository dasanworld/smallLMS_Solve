import type { SupabaseClient } from '@supabase/supabase-js';
import type { CreateEnrollmentRequest } from './schema';
import { enrollmentErrorCodes } from './error';

/**
 * 사용자 수강신청 목록 조회
 */
export const getUserEnrollmentsService = async (
  supabase: SupabaseClient,
  userId: string
) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('enrolled_at', { ascending: false });

    if (error) {
      return {
        status: 500,
        code: enrollmentErrorCodes.ENROLLMENT_FETCH_ERROR,
        message: error.message,
      };
    }

    return {
      status: 200,
      data: {
        enrollments: data || [],
      },
    };
  } catch (error) {
    return {
      status: 500,
      code: enrollmentErrorCodes.ENROLLMENT_FETCH_ERROR,
      message: String(error),
    };
  }
};

/**
 * 코스 수강신청
 */
export const createEnrollmentService = async (
  supabase: SupabaseClient,
  userId: string,
  courseId: string
) => {
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
      return {
        status: 409,
        code: enrollmentErrorCodes.ALREADY_ENROLLED,
        message: 'Already enrolled in this course',
      };
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
      return {
        status: 500,
        code: enrollmentErrorCodes.ENROLLMENT_CREATION_ERROR,
        message: error.message,
      };
    }

    return {
      status: 201,
      data,
    };
  } catch (error) {
    return {
      status: 500,
      code: enrollmentErrorCodes.ENROLLMENT_CREATION_ERROR,
      message: String(error),
    };
  }
};

/**
 * 수강신청 취소
 */
export const deleteEnrollmentService = async (
  supabase: SupabaseClient,
  enrollmentId: string,
  userId: string
) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .update({ status: 'cancelled' })
      .eq('id', enrollmentId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      return {
        status: 404,
        code: enrollmentErrorCodes.ENROLLMENT_NOT_FOUND,
        message: 'Enrollment not found or unauthorized',
      };
    }

    return {
      status: 200,
      data,
    };
  } catch (error) {
    return {
      status: 500,
      code: enrollmentErrorCodes.ENROLLMENT_DELETE_ERROR,
      message: String(error),
    };
  }
};
