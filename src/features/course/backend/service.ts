import { SupabaseClient } from '@supabase/supabase-js';
import { HandlerResult, success, failure } from '@/backend/http/response';
import { courseErrorCodes } from './error';
import {
  Course,
  CourseDetailResponse,
  CreateCourseRequest,
  UpdateCourseRequest,
  UpdateCourseStatusRequest,
} from './schema';

/**
 * 학습자가 수강신청할 수 있는 활성 코스 목록 조회
 * - 상태가 'published'인 코스만 반환
 * - 소프트 삭제된 코스는 제외
 */
export const getAvailableCoursesService = async (
  supabase: SupabaseClient
): Promise<HandlerResult<{ courses: Course[] }, typeof courseErrorCodes[keyof typeof courseErrorCodes]>> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      return failure(500, courseErrorCodes.COURSE_CREATION_ERROR, error.message);
    }

    return success({ courses: data || [] });
  } catch (err) {
    return failure(500, courseErrorCodes.COURSE_CREATION_ERROR, String(err));
  }
};

/**
 * 강사의 코스 목록 조회
 * 소프트 삭제된 코스는 제외
 */
export const getInstructorCoursesService = async (
  supabase: SupabaseClient,
  instructorId: string
): Promise<HandlerResult<{ courses: Course[] }, typeof courseErrorCodes[keyof typeof courseErrorCodes]>> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('owner_id', instructorId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      return failure(500, courseErrorCodes.COURSE_CREATION_ERROR, error.message);
    }

    return success({ courses: data || [] });
  } catch (err) {
    return failure(500, courseErrorCodes.COURSE_CREATION_ERROR, String(err));
  }
};

/**
 * 새 코스 생성
 * 기본 상태: draft
 */
export const createCourseService = async (
  supabase: SupabaseClient,
  instructorId: string,
  payload: CreateCourseRequest
): Promise<HandlerResult<Course, typeof courseErrorCodes[keyof typeof courseErrorCodes]>> => {
  try {
    // 강사가 같은 제목의 코스를 가지고 있는지 확인
    const { data: existingCourse, error: checkError } = await supabase
      .from('courses')
      .select('id')
      .eq('owner_id', instructorId)
      .eq('title', payload.title)
      .is('deleted_at', null)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      return failure(500, courseErrorCodes.COURSE_CREATION_ERROR, checkError.message);
    }

    if (existingCourse) {
      return failure(409, courseErrorCodes.COURSE_TITLE_DUPLICATE, 'You already have a course with this title');
    }

    // 새 코스 생성
    const { data: newCourse, error: createError } = await supabase
      .from('courses')
      .insert({
        owner_id: instructorId,
        title: payload.title,
        description: payload.description || null,
        category_id: payload.category_id || null,
        difficulty_id: payload.difficulty_id || null,
        status: 'draft',
      })
      .select()
      .single();

    if (createError) {
      return failure(500, courseErrorCodes.COURSE_CREATION_ERROR, createError.message);
    }

    return success(newCourse as Course);
  } catch (err) {
    return failure(500, courseErrorCodes.COURSE_CREATION_ERROR, String(err));
  }
};

/**
 * 코스 상세 조회
 * 카테고리, 난이도, 강사 정보 포함
 */
export const getCourseByIdService = async (
  supabase: SupabaseClient,
  courseId: string,
  instructorId?: string
): Promise<HandlerResult<CourseDetailResponse, typeof courseErrorCodes[keyof typeof courseErrorCodes]>> => {
  try {
    const { data: course, error } = await supabase
      .from('courses')
      .select(
        `
        id, owner_id, title, description, category_id, difficulty_id,
        status, enrollment_count, created_at, updated_at, published_at,
        archived_at, deleted_at,
        category:categories(*),
        difficulty:difficulties(*)
        `
      )
      .eq('id', courseId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      return failure(500, courseErrorCodes.COURSE_UPDATE_ERROR, error.message);
    }

    if (!course) {
      return failure(404, courseErrorCodes.COURSE_NOT_FOUND, 'Course not found');
    }

    // 강사 권한 확인 (옵션)
    if (instructorId && course.owner_id !== instructorId) {
      return failure(403, courseErrorCodes.INSUFFICIENT_PERMISSIONS, 'You do not have permission to access this course');
    }

    // 강사 정보 조회
    const { data: instructorData, error: instructorError } = await supabase
      .from('users')
      .select('name')
      .eq('id', course.owner_id)
      .maybeSingle();


    const categoryData = Array.isArray(course.category) ? course.category[0] : course.category;
    const difficultyData = Array.isArray(course.difficulty) ? course.difficulty[0] : course.difficulty;

    return success({
      ...course,
      category: categoryData || null,
      difficulty: difficultyData || null,
      instructor_name: instructorData?.name || null,
    } as CourseDetailResponse);
  } catch (err) {
    return failure(500, courseErrorCodes.COURSE_UPDATE_ERROR, String(err));
  }
};

/**
 * 코스 정보 수정
 * 강사만 자신의 코스를 수정할 수 있음
 */
export const updateCourseService = async (
  supabase: SupabaseClient,
  courseId: string,
  instructorId: string,
  payload: UpdateCourseRequest
): Promise<HandlerResult<Course, typeof courseErrorCodes[keyof typeof courseErrorCodes]>> => {
  try {
    // 코스 소유권 확인
    const { data: course, error: fetchError } = await supabase
      .from('courses')
      .select('owner_id, status')
      .eq('id', courseId)
      .is('deleted_at', null)
      .maybeSingle();

    if (fetchError) {
      return failure(500, courseErrorCodes.COURSE_UPDATE_ERROR, fetchError.message);
    }

    if (!course) {
      return failure(404, courseErrorCodes.COURSE_NOT_FOUND, 'Course not found');
    }

    if (course.owner_id !== instructorId) {
      return failure(403, courseErrorCodes.INSUFFICIENT_PERMISSIONS, 'You do not have permission to edit this course');
    }

    // 제목이 변경되는 경우, 중복 확인
    if (payload.title) {
      const { data: existingCourse, error: checkError } = await supabase
        .from('courses')
        .select('id')
        .eq('owner_id', instructorId)
        .eq('title', payload.title)
        .neq('id', courseId)
        .is('deleted_at', null)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        return failure(500, courseErrorCodes.COURSE_UPDATE_ERROR, checkError.message);
      }

      if (existingCourse) {
        return failure(409, courseErrorCodes.COURSE_TITLE_DUPLICATE, 'You already have a course with this title');
      }
    }

    // 업데이트할 필드 준비
    const updatePayload: Record<string, unknown> = {};
    if (payload.title !== undefined) updatePayload.title = payload.title;
    if (payload.description !== undefined) updatePayload.description = payload.description;
    if (payload.category_id !== undefined) updatePayload.category_id = payload.category_id;
    if (payload.difficulty_id !== undefined) updatePayload.difficulty_id = payload.difficulty_id;

    const { data: updatedCourse, error: updateError } = await supabase
      .from('courses')
      .update(updatePayload)
      .eq('id', courseId)
      .select()
      .single();

    if (updateError) {
      return failure(500, courseErrorCodes.COURSE_UPDATE_ERROR, updateError.message);
    }

    return success(updatedCourse as Course);
  } catch (err) {
    return failure(500, courseErrorCodes.COURSE_UPDATE_ERROR, String(err));
  }
};

/**
 * 코스 상태 변경
 * draft -> published: 필수 필드 검증 후 published_at 설정
 * published -> archived: 모든 assignments를 closed로 변경, archived_at 설정
 * archived -> draft: 아카이브 해제, archived_at 제거
 */
export const updateCourseStatusService = async (
  supabase: SupabaseClient,
  courseId: string,
  instructorId: string,
  payload: UpdateCourseStatusRequest
): Promise<HandlerResult<Course, typeof courseErrorCodes[keyof typeof courseErrorCodes]>> => {
  try {
    // 코스 조회 및 권한 확인
    const { data: course, error: fetchError } = await supabase
      .from('courses')
      .select('id, owner_id, status, title, description, category_id, difficulty_id')
      .eq('id', courseId)
      .is('deleted_at', null)
      .maybeSingle();

    if (fetchError) {
      return failure(500, courseErrorCodes.COURSE_STATUS_CHANGE_ERROR, fetchError.message);
    }

    if (!course) {
      return failure(404, courseErrorCodes.COURSE_NOT_FOUND, 'Course not found');
    }

    if (course.owner_id !== instructorId) {
      return failure(403, courseErrorCodes.INSUFFICIENT_PERMISSIONS, 'You do not have permission to change this course status');
    }

    const currentStatus = course.status as string;
    const newStatus = payload.status;

    // 상태 전환 검증
    if (currentStatus === newStatus) {
      return failure(400, courseErrorCodes.INVALID_STATUS_TRANSITION, `Course is already in ${currentStatus} status`);
    }

    // draft -> published 검증
    if (currentStatus === 'draft' && newStatus === 'published') {
      if (!course.title || !course.description) {
        return failure(400, courseErrorCodes.VALIDATION_ERROR, 'Title and description are required before publishing');
      }
    }

    // published -> archived 시 모든 assignments를 closed로 변경
    if (currentStatus === 'published' && newStatus === 'archived') {
      const { error: assignmentError } = await supabase
        .from('assignments')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
        })
        .eq('course_id', courseId)
        .eq('status', 'published')
        .is('deleted_at', null);

      if (assignmentError) {
        return failure(500, courseErrorCodes.COURSE_STATUS_CHANGE_ERROR, `Failed to close assignments: ${assignmentError.message}`);
      }
    }

    // 상태 업데이트
    const updatePayload: Record<string, unknown> = {
      status: newStatus,
    };

    if (newStatus === 'published') {
      updatePayload.published_at = new Date().toISOString();
    } else if (newStatus === 'archived') {
      updatePayload.archived_at = new Date().toISOString();
    } else if (newStatus === 'draft') {
      // draft로 돌아갈 때는 archived_at 제거
      updatePayload.archived_at = null;
    }

    const { data: updatedCourse, error: updateError } = await supabase
      .from('courses')
      .update(updatePayload)
      .eq('id', courseId)
      .select()
      .single();

    if (updateError) {
      return failure(500, courseErrorCodes.COURSE_STATUS_CHANGE_ERROR, updateError.message);
    }

    return success(updatedCourse as Course);
  } catch (err) {
    return failure(500, courseErrorCodes.COURSE_STATUS_CHANGE_ERROR, String(err));
  }
};

/**
 * 코스 소프트 삭제
 * 활성 등록이 있는 경우 삭제 불가
 */
export const deleteCourseService = async (
  supabase: SupabaseClient,
  courseId: string,
  instructorId: string
): Promise<HandlerResult<{ id: string }, typeof courseErrorCodes[keyof typeof courseErrorCodes]>> => {
  try {
    // 코스 소유권 확인
    const { data: course, error: fetchError } = await supabase
      .from('courses')
      .select('owner_id')
      .eq('id', courseId)
      .is('deleted_at', null)
      .maybeSingle();

    if (fetchError) {
      return failure(500, courseErrorCodes.COURSE_DELETE_ERROR, fetchError.message);
    }

    if (!course) {
      return failure(404, courseErrorCodes.COURSE_NOT_FOUND, 'Course not found');
    }

    if (course.owner_id !== instructorId) {
      return failure(403, courseErrorCodes.INSUFFICIENT_PERMISSIONS, 'You do not have permission to delete this course');
    }

    // 활성 등록 확인
    const { data: activeEnrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id', { count: 'exact' })
      .eq('course_id', courseId)
      .eq('status', 'active');

    if (enrollmentError) {
      return failure(500, courseErrorCodes.COURSE_DELETE_ERROR, enrollmentError.message);
    }

    if ((activeEnrollments?.length || 0) > 0) {
      return failure(400, courseErrorCodes.COURSE_HAS_ENROLLMENTS, 'Cannot delete a course with active enrollments. Please archive it first.');
    }

    // 소프트 삭제 수행
    const { data: deletedCourse, error: deleteError } = await supabase
      .from('courses')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', courseId)
      .select('id')
      .single();

    if (deleteError) {
      return failure(500, courseErrorCodes.COURSE_DELETE_ERROR, deleteError.message);
    }

    return success({ id: deletedCourse.id });
  } catch (err) {
    return failure(500, courseErrorCodes.COURSE_DELETE_ERROR, String(err));
  }
};

/**
 * 카테고리와 난이도 목록 조회
 * 활성화된 항목만 반환
 */
export const getCategoriesAndDifficultiesService = async (
  supabase: SupabaseClient
): Promise<
  HandlerResult<
    { categories: Array<{ id: number; name: string }>; difficulties: Array<{ id: number; name: string }> },
    typeof courseErrorCodes[keyof typeof courseErrorCodes]
  >
> => {
  try {
    const [{ data: categories, error: categoryError }, { data: difficulties, error: difficultyError }] = await Promise.all([
      supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('difficulties')
        .select('id, name')
        .eq('is_active', true)
        .order('sort_order'),
    ]);

    if (categoryError) {
      return failure(500, courseErrorCodes.COURSE_UPDATE_ERROR, categoryError.message);
    }

    if (difficultyError) {
      return failure(500, courseErrorCodes.COURSE_UPDATE_ERROR, difficultyError.message);
    }

    return success({
      categories: categories || [],
      difficulties: difficulties || [],
    });
  } catch (err) {
    return failure(500, courseErrorCodes.COURSE_UPDATE_ERROR, String(err));
  }
};
