import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import { getLogger } from '@/backend/hono/context';
import {
  getPublishedCoursesRequestSchema,
  courseSchema,
  createEnrollmentRequestSchema,
  enrollmentSchema,
  type Course,
  type Enrollment,
} from './schema';

const COURSES_TABLE = 'courses';
const ENROLLMENTS_TABLE = 'enrollments';
const CATEGORIES_TABLE = 'categories';
const DIFFICULTIES_TABLE = 'difficulties';

export type CourseServiceDependencies = {
  supabase: SupabaseClient;
  logger: ReturnType<typeof getLogger>;
};

export type GetPublishedCoursesOptions = {
  search?: string;
  category_id?: number;
  difficulty_id?: number;
  sort?: 'newest' | 'popular';
  page?: number;
  limit?: number;
};

export const getPublishedCoursesService = async (
  deps: CourseServiceDependencies,
  options: GetPublishedCoursesOptions = {}
): Promise<HandlerResult<{ 
  courses: Course[]; 
  total: number; 
  page: number; 
  limit: number; 
  totalPages: number; 
}, typeof courseErrorCodes[keyof typeof courseErrorCodes], unknown>> => {
  const { supabase, logger } = deps;
  const { search, category_id, difficulty_id, sort = 'newest', page = 1, limit = 10 } = options;

  try {
    // Build query with joins for category and difficulty names
    let query = supabase
      .from(COURSES_TABLE)
      .select(`
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
        categories!inner (name, is_active),
        difficulties!inner (name, is_active)
      `, { count: 'exact' })
      .eq('status', 'published')
      .is('deleted_at', null); // 소프트 삭제 필터

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply category filter (활성 카테고리만)
    if (category_id) {
      query = query.eq('category_id', category_id).eq('categories.is_active', true);
    } else {
      // 카테고리가 지정되지 않은 경우에도 활성 카테고리만 표시
      query = query.or('category_id.is.null,categories.is_active.eq.true');
    }

    // Apply difficulty filter (활성 난이도만)
    if (difficulty_id) {
      query = query.eq('difficulty_id', difficulty_id).eq('difficulties.is_active', true);
    } else {
      // 난이도가 지정되지 않은 경우에도 활성 난이도만 표시
      query = query.or('difficulty_id.is.null,difficulties.is_active.eq.true');
    }

    // Apply sorting
    if (sort === 'popular') {
      query = query.order('enrollment_count', {ascending: false});
    } else {
      query = query.order('created_at', {ascending: false});
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch published courses', error.message);
      return failure(500, 'COURSES_FETCH_ERROR', error.message);
    }

    // Transform data to match schema expectations
    const transformedCourses = data.map(course => {
      // Extract category and difficulty names from joined data
      const categoryData = (course as any).categories;
      const difficultyData = (course as any).difficulties;
      
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
        category_name: categoryData?.name || null,
        difficulty_name: difficultyData?.name || null,
      };
    });

    // Validate the result data
    const validatedCourses = transformedCourses.map(course => courseSchema.parse(course));

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return success({
      courses: validatedCourses,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    logger.error('Error fetching published courses', error);
    return failure(500, 'COURSES_FETCH_ERROR', error instanceof Error ? error.message : 'Unknown error');
  }
};

export type CreateEnrollmentOptions = {
  userId: string;
  courseId: string;
};

export const createEnrollmentService = async (
  deps: CourseServiceDependencies,
  options: CreateEnrollmentOptions
): Promise<HandlerResult<Enrollment, typeof courseErrorCodes[keyof typeof courseErrorCodes], unknown>> => {
  const { supabase, logger } = deps;
  const { userId, courseId } = options;

  try {
    // 1. Check if the course is published (소프트 삭제 필터 추가)
    const { data: course, error: courseError } = await supabase
      .from(COURSES_TABLE)
      .select('status')
      .eq('id', courseId)
      .is('deleted_at', null) // 소프트 삭제 필터
      .single();

    if (courseError) {
      logger.error('Failed to fetch course', courseError.message);
      return failure(404, 'COURSE_NOT_FOUND', 'Course not found');
    }

    if (course.status !== 'published') {
      logger.info('Attempted to enroll in non-published course', { courseId, userId });
      return failure(400, 'COURSE_NOT_PUBLISHED', 'Course is not published');
    }

    // 2. Check if user is already enrolled
    const { data: existingEnrollment, error: checkError } = await supabase
      .from(ENROLLMENTS_TABLE)
      .select('id, status')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (existingEnrollment) {
      if (existingEnrollment.status === 'active') {
        logger.info('User already enrolled in course', { courseId, userId });
        return failure(409, 'DUPLICATE_ENROLLMENT', 'User is already enrolled in this course');
      } else {
        // If user is enrolled but cancelled, update to active
        const { data: updatedEnrollment, error: updateError } = await supabase
          .from(ENROLLMENTS_TABLE)
          .update({ status: 'active', enrolled_at: new Date().toISOString() })
          .eq('id', existingEnrollment.id)
          .select()
          .single();

        if (updateError) {
          logger.error('Failed to update enrollment', updateError.message);
          return failure(500, 'ENROLLMENT_UPDATE_ERROR', updateError.message);
        }

        return success(enrollmentSchema.parse(updatedEnrollment));
      }
    }

    // 3. Create new enrollment
    const { data: newEnrollment, error: insertError } = await supabase
      .from(ENROLLMENTS_TABLE)
      .insert([
        {
          user_id: userId,
          course_id: courseId,
          status: 'active',
        },
      ])
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to create enrollment', insertError.message);
      
      // Check if the error is due to the unique constraint
      if (insertError.code === '23505') { // Unique violation
        return failure(409, 'DUPLICATE_ENROLLMENT', 'User is already enrolled in this course');
      }
      
      return failure(500, 'ENROLLMENT_CREATION_ERROR', insertError.message);
    }

    return success(enrollmentSchema.parse(newEnrollment));
  } catch (error) {
    logger.error('Error creating enrollment', error);
    return failure(500, 'ENROLLMENT_CREATION_ERROR', error instanceof Error ? error.message : 'Unknown error');
  }
};

export type GetUserEnrollmentsOptions = {
  userId: string;
  status?: 'active' | 'cancelled';
};

export const getUserEnrollmentsService = async (
  deps: CourseServiceDependencies,
  options: GetUserEnrollmentsOptions
): Promise<HandlerResult<Enrollment[], typeof courseErrorCodes[keyof typeof courseErrorCodes], unknown>> => {
  const { supabase, logger } = deps;
  const { userId, status = 'active' } = options;

  try {
    let query = supabase
      .from(ENROLLMENTS_TABLE)
      .select('*')
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch user enrollments', error.message);
      return failure(500, courseErrorCodes.ENROLLMENTS_FETCH_ERROR, error.message);
    }

    // Validate the result data
    const validatedEnrollments = data.map(enrollment => enrollmentSchema.parse(enrollment));

    return success(validatedEnrollments);
  } catch (error) {
    logger.error('Error fetching user enrollments', error);
    return failure(500, 'ENROLLMENTS_FETCH_ERROR', error instanceof Error ? error.message : 'Unknown error');
  }
};

export type CheckEnrollmentStatusOptions = {
  userId: string;
  courseId: string;
};

export const checkEnrollmentStatusService = async (
  deps: CourseServiceDependencies,
  options: CheckEnrollmentStatusOptions
): Promise<HandlerResult<{ isEnrolled: boolean; enrollment?: Enrollment }, typeof courseErrorCodes[keyof typeof courseErrorCodes], unknown>> => {
  const { supabase, logger } = deps;
  const { userId, courseId } = options;

  try {
    const { data, error } = await supabase
      .from(ENROLLMENTS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is for no rows returned
      logger.error('Error checking enrollment status', error.message);
      return failure(500, 'ENROLLMENT_STATUS_CHECK_ERROR', error.message);
    }

    if (!data) {
      return success({ isEnrolled: false });
    }

    const enrollment = enrollmentSchema.parse(data);
    return success({ 
      isEnrolled: enrollment.status === 'active', 
      enrollment 
    });
  } catch (error) {
    logger.error('Error checking enrollment status', error);
    return failure(500, courseErrorCodes.ENROLLMENT_STATUS_CHECK_ERROR, error instanceof Error ? error.message : 'Unknown error');
  }
};

export type CancelEnrollmentOptions = {
  userId: string;
  enrollmentId: string;
};

export const cancelEnrollmentService = async (
  deps: CourseServiceDependencies,
  options: CancelEnrollmentOptions
): Promise<HandlerResult<Enrollment, typeof courseErrorCodes[keyof typeof courseErrorCodes], unknown>> => {
  const { supabase, logger } = deps;
  const { userId, enrollmentId } = options;

  try {
    // 1. Check if the enrollment exists and belongs to the user
    const { data: enrollment, error: fetchError } = await supabase
      .from(ENROLLMENTS_TABLE)
      .select('id, user_id, status')
      .eq('id', enrollmentId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      logger.error('Failed to fetch enrollment', fetchError.message);
      return failure(404, 'ENROLLMENT_NOT_FOUND', 'Enrollment not found');
    }

    if (!enrollment) {
      logger.info('User attempted to cancel non-existent enrollment', { enrollmentId, userId });
      return failure(404, 'ENROLLMENT_NOT_FOUND', 'Enrollment not found');
    }

    // 2. Check if enrollment is already cancelled
    if (enrollment.status === 'cancelled') {
      logger.info('User attempted to cancel already cancelled enrollment', { enrollmentId, userId });
      return failure(400, 'ENROLLMENT_ALREADY_CANCELLED', 'Enrollment is already cancelled');
    }

    // 3. Update enrollment status to cancelled
    const { data: updatedEnrollment, error: updateError } = await supabase
      .from(ENROLLMENTS_TABLE)
      .update({ status: 'cancelled' })
      .eq('id', enrollmentId)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to cancel enrollment', updateError.message);
      return failure(500, 'ENROLLMENT_CANCELLATION_ERROR', updateError.message);
    }

    return success(enrollmentSchema.parse(updatedEnrollment));
  } catch (error) {
    logger.error('Error cancelling enrollment', error);
    return failure(500, 'ENROLLMENT_CANCELLATION_ERROR', error instanceof Error ? error.message : 'Unknown error');
  }
};

/**
 * 활성화된 카테고리와 난이도 목록을 조회합니다.
 * 코스 생성/수정 UI에서 사용됩니다.
 */
export const getActiveMetadataService = async (
  deps: CourseServiceDependencies
): Promise<HandlerResult<{
  categories: Array<{ id: number; name: string; description: string | null }>;
  difficulties: Array<{ id: number; name: string; description: string | null; sort_order: number }>;
}, string, unknown>> => {
  const { supabase, logger } = deps;

  try {
    // 활성 카테고리 조회
    const { data: categories, error: categoriesError } = await supabase
      .from(CATEGORIES_TABLE)
      .select('id, name, description')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (categoriesError) {
      logger.error('Failed to fetch active categories', categoriesError);
      return failure(500, 'METADATA_FETCH_ERROR', 'Failed to fetch categories');
    }

    // 활성 난이도 조회
    const { data: difficulties, error: difficultiesError } = await supabase
      .from(DIFFICULTIES_TABLE)
      .select('id, name, description, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (difficultiesError) {
      logger.error('Failed to fetch active difficulties', difficultiesError);
      return failure(500, 'METADATA_FETCH_ERROR', 'Failed to fetch difficulties');
    }

    return success({
      categories: categories || [],
      difficulties: difficulties || [],
    });
  } catch (error) {
    logger.error('Unexpected error fetching metadata', error);
    return failure(500, 'INTERNAL_SERVER_ERROR', 'Unexpected error');
  }
};

// Error codes
export const courseErrorCodes = {
  COURSES_FETCH_ERROR: 'COURSES_FETCH_ERROR',
  COURSE_NOT_FOUND: 'COURSE_NOT_FOUND',
  COURSE_NOT_PUBLISHED: 'COURSE_NOT_PUBLISHED',
  COURSE_DELETED: 'COURSE_DELETED',
  METADATA_INACTIVE: 'METADATA_INACTIVE',
  METADATA_FETCH_ERROR: 'METADATA_FETCH_ERROR',
  DUPLICATE_ENROLLMENT: 'DUPLICATE_ENROLLMENT',
  ENROLLMENT_CREATION_ERROR: 'ENROLLMENT_CREATION_ERROR',
  ENROLLMENT_UPDATE_ERROR: 'ENROLLMENT_UPDATE_ERROR',
  ENROLLMENT_NOT_FOUND: 'ENROLLMENT_NOT_FOUND',
  ENROLLMENT_ALREADY_CANCELLED: 'ENROLLMENT_ALREADY_CANCELLED',
  ENROLLMENT_CANCELLATION_ERROR: 'ENROLLMENT_CANCELLATION_ERROR',
  ENROLLMENTS_FETCH_ERROR: 'ENROLLMENTS_FETCH_ERROR',
  ENROLLMENT_STATUS_CHECK_ERROR: 'ENROLLMENT_STATUS_CHECK_ERROR',
} as const;