import { SupabaseClient } from '@supabase/supabase-js';
import { HandlerResult, success, failure } from '@/backend/http/response';
import { courseErrorCodes } from './error';
import type { AvailableCoursesResponse, LearnerCourse } from './learner-schema';

/**
 * 학습자가 이용 가능한 (공개된) 코스 목록 조회
 * - status = 'published' 인 코스만
 * - 소프트 삭제되지 않은 코스만
 * - 페이지네이션 지원
 * - 현재 사용자의 수강신청 여부 표시
 */
export const getAvailableCoursesService = async (
  supabase: SupabaseClient,
  userId: string | undefined,
  page: number = 1,
  pageSize: number = 10
): Promise<HandlerResult<AvailableCoursesResponse, typeof courseErrorCodes[keyof typeof courseErrorCodes]>> => {
  try {
    // 전체 공개 코스 수 조회
    const { count: totalCount, error: countError } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .is('deleted_at', null);

    if (countError) {
      return failure(500, courseErrorCodes.COURSE_CREATION_ERROR, countError.message);
    }

    const total = totalCount || 0;

    // 페이지네이션 적용한 코스 목록 조회 (강사 정보, 카테고리, 난이도 포함)
    const offset = (page - 1) * pageSize;
    const { data: courses, error: queryError } = await supabase
      .from('courses')
      .select(
        `
        id,
        owner_id,
        title,
        description,
        category_id,
        difficulty_id,
        status,
        enrollment_count,
        created_at,
        updated_at,
        published_at,
        categories(id, name, description, is_active),
        difficulties(id, name, description, is_active),
        users(name)
      `
      )
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('published_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (queryError) {
      return failure(500, courseErrorCodes.COURSE_CREATION_ERROR, queryError.message);
    }

    // 현재 사용자의 수강신청 정보 조회
    let enrolledCourseIds = new Set<string>();
    if (userId) {
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (!enrollmentError && enrollments) {
        enrolledCourseIds = new Set(enrollments.map((e) => e.course_id));
      }
    }

    // 응답 포맷으로 변환
    const formattedCourses: LearnerCourse[] = (courses || []).map((course: any) => ({
      id: course.id,
      owner_id: course.owner_id,
      title: course.title,
      description: course.description,
      category_id: course.category_id,
      difficulty_id: course.difficulty_id,
      status: course.status,
      enrollment_count: course.enrollment_count,
      created_at: course.created_at,
      updated_at: course.updated_at,
      published_at: course.published_at,
      archived_at: null,
      deleted_at: null,
      category: course.categories
        ? {
            id: course.categories.id,
            name: course.categories.name,
            description: course.categories.description,
            is_active: course.categories.is_active,
          }
        : null,
      difficulty: course.difficulties
        ? {
            id: course.difficulties.id,
            name: course.difficulties.name,
            description: course.difficulties.description,
            is_active: course.difficulties.is_active,
          }
        : null,
      instructor_name: course.users?.name || '알 수 없음',
      is_enrolled: enrolledCourseIds.has(course.id),
    }));

    return success({
      courses: formattedCourses,
      total,
      page,
      pageSize,
    });
  } catch (err) {
    return failure(500, courseErrorCodes.COURSE_CREATION_ERROR, String(err));
  }
};

/**
 * 학습자의 수강신청한 코스 목록 조회
 * - 현재 사용자만
 * - active 상태의 등록만
 */
export const getEnrolledCoursesService = async (
  supabase: SupabaseClient,
  userId: string
): Promise<HandlerResult<{ courses: LearnerCourse[] }, typeof courseErrorCodes[keyof typeof courseErrorCodes]>> => {
  try {
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(
        `
        course_id,
        courses(
          id,
          owner_id,
          title,
          description,
          category_id,
          difficulty_id,
          status,
          enrollment_count,
          created_at,
          updated_at,
          published_at,
          categories(id, name, description, is_active),
          difficulties(id, name, description, is_active),
          users(name)
        )
      `
      )
      .eq('user_id', userId)
      .eq('status', 'active');

    if (enrollmentError) {
      return failure(500, courseErrorCodes.COURSE_CREATION_ERROR, enrollmentError.message);
    }

    const courses: LearnerCourse[] = (enrollments || [])
      .map((enrollment: any) => {
        const course = enrollment.courses;
        return {
          id: course.id,
          owner_id: course.owner_id,
          title: course.title,
          description: course.description,
          category_id: course.category_id,
          difficulty_id: course.difficulty_id,
          status: course.status,
          enrollment_count: course.enrollment_count,
          created_at: course.created_at,
          updated_at: course.updated_at,
          published_at: course.published_at,
          archived_at: null,
          deleted_at: null,
          category: course.categories
            ? {
                id: course.categories.id,
                name: course.categories.name,
                description: course.categories.description,
                is_active: course.categories.is_active,
              }
            : null,
          difficulty: course.difficulties
            ? {
                id: course.difficulties.id,
                name: course.difficulties.name,
                description: course.difficulties.description,
                is_active: course.difficulties.is_active,
              }
            : null,
          instructor_name: course.users?.name || '알 수 없음',
          is_enrolled: true,
        };
      });

    return success({ courses });
  } catch (err) {
    return failure(500, courseErrorCodes.COURSE_CREATION_ERROR, String(err));
  }
};

/**
 * 코스에 수강신청
 * - 이미 수강신청한 경우 무시 (UNIQUE 제약)
 * - 존재하지 않는 코스인 경우 실패
 */
export const enrollCourseService = async (
  supabase: SupabaseClient,
  userId: string,
  courseId: string
): Promise<HandlerResult<{ success: boolean }, typeof courseErrorCodes[keyof typeof courseErrorCodes]>> => {
  try {
    // 코스 존재 여부 확인
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, status')
      .eq('id', courseId)
      .is('deleted_at', null)
      .maybeSingle();

    if (courseError) {
      return failure(500, courseErrorCodes.COURSE_CREATION_ERROR, courseError.message);
    }

    if (!course) {
      return failure(404, courseErrorCodes.COURSE_NOT_FOUND, 'Course not found');
    }

    if (course.status !== 'published') {
      return failure(400, courseErrorCodes.COURSE_CREATION_ERROR, 'Can only enroll in published courses');
    }

    // 수강신청 생성
    const { error: enrollError } = await supabase
      .from('enrollments')
      .insert({
        user_id: userId,
        course_id: courseId,
        status: 'active',
      });

    if (enrollError) {
      // UNIQUE 제약 위반 (이미 수강신청함)
      if (enrollError.code === '23505') {
        return success({ success: true }); // 이미 수강신청한 경우도 성공으로 처리
      }
      return failure(500, courseErrorCodes.COURSE_CREATION_ERROR, enrollError.message);
    }

    return success({ success: true });
  } catch (err) {
    return failure(500, courseErrorCodes.COURSE_CREATION_ERROR, String(err));
  }
};

/**
 * 수강신청 취소
 * - 현재 사용자만 자신의 수강신청을 취소할 수 있음
 */
export const unenrollCourseService = async (
  supabase: SupabaseClient,
  userId: string,
  courseId: string
): Promise<HandlerResult<{ success: boolean }, typeof courseErrorCodes[keyof typeof courseErrorCodes]>> => {
  try {
    // 수강신청 조회
    const { data: enrollment, error: queryError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'active')
      .maybeSingle();

    if (queryError) {
      return failure(500, courseErrorCodes.COURSE_CREATION_ERROR, queryError.message);
    }

    if (!enrollment) {
      return failure(404, courseErrorCodes.COURSE_NOT_FOUND, 'Enrollment not found');
    }

    // 수강신청 취소 (soft delete)
    const { error: updateError } = await supabase
      .from('enrollments')
      .update({ status: 'cancelled' })
      .eq('id', enrollment.id);

    if (updateError) {
      return failure(500, courseErrorCodes.COURSE_CREATION_ERROR, updateError.message);
    }

    return success({ success: true });
  } catch (err) {
    return failure(500, courseErrorCodes.COURSE_CREATION_ERROR, String(err));
  }
};
