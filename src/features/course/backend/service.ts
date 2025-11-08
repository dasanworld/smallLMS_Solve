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
 * Retrieve courses owned by the instructor
 */
export type GetInstructorCoursesOptions = {
  userId: string;
  search?: string;
  status?: 'draft' | 'published' | 'archived';
  category_id?: number;
  difficulty_id?: number;
  sort?: 'newest' | 'popular';
  page?: number;
  limit?: number;
};

export const getInstructorCoursesService = async (
  deps: CourseServiceDependencies,
  options: GetInstructorCoursesOptions
): Promise<HandlerResult<{
  courses: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}, typeof courseErrorCodes[keyof typeof courseErrorCodes], unknown>> => {
  const { supabase, logger } = deps;
  const { 
    userId, 
    search, 
    status, 
    category_id, 
    difficulty_id, 
    sort = 'newest', 
    page = 1, 
    limit = 10 
  } = options;

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
        archived_at,
        categories!inner (name, is_active),
        difficulties!inner (name, is_active)
      `, { count: 'exact' })
      .eq('owner_id', userId)
      .is('deleted_at', null); // 소프트 삭제 필터

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
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
      logger.error('Failed to fetch instructor courses', error.message);
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
        archived_at: course.archived_at,
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
    logger.error('Error fetching instructor courses', error);
    return failure(500, 'COURSES_FETCH_ERROR', error instanceof Error ? error.message : 'Unknown error');
  }
};

/**
 * Create a new course with draft status
 */
export type CreateCourseOptions = {
  userId: string;
  title: string;
  description?: string;
  category_id?: number | null;
  difficulty_id?: number | null;
};

export const createCourseService = async (
  deps: CourseServiceDependencies,
  options: CreateCourseOptions
): Promise<HandlerResult<Course, typeof courseErrorCodes[keyof typeof courseErrorCodes], unknown>> => {
  const { supabase, logger } = deps;
  const { userId, title, description, category_id, difficulty_id } = options;

  try {
    // Check if user already has a course with the same title
    const { data: existingCourse, error: checkError } = await supabase
      .from(COURSES_TABLE)
      .select('id')
      .eq('owner_id', userId)
      .eq('title', title)
      .is('deleted_at', null)
      .single();

    if (existingCourse) {
      logger.info('Course title already exists for user', { userId, title });
      return failure(409, 'COURSE_TITLE_DUPLICATE', 'A course with this title already exists');
    }

    // Create the course with draft status
    const { data: newCourse, error: insertError } = await supabase
      .from(COURSES_TABLE)
      .insert([
        {
          owner_id: userId,
          title,
          description: description || null,
          category_id: category_id || null,
          difficulty_id: difficulty_id || null,
          status: 'draft',
        },
      ])
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to create course', insertError.message);
      return failure(500, 'COURSE_CREATION_ERROR', insertError.message);
    }

    // Transform and validate the result data
    const transformedCourse = {
      id: newCourse.id,
      owner_id: newCourse.owner_id,
      title: newCourse.title,
      description: newCourse.description,
      category_id: newCourse.category_id,
      difficulty_id: newCourse.difficulty_id,
      status: newCourse.status,
      enrollment_count: newCourse.enrollment_count,
      created_at: newCourse.created_at,
      updated_at: newCourse.updated_at,
      published_at: newCourse.published_at,
      archived_at: newCourse.archived_at,
      category_name: null, // Will be populated when joined with categories
      difficulty_name: null, // Will be populated when joined with difficulties
    };

    const validatedCourse = courseSchema.parse(transformedCourse);

    return success(validatedCourse);
  } catch (error) {
    logger.error('Error creating course', error);
    return failure(500, 'COURSE_CREATION_ERROR', error instanceof Error ? error.message : 'Unknown error');
  }
};

/**
 * Get specific course by ID with validation
 */
export type GetCourseByIdOptions = {
  courseId: string;
  userId?: string; // Optional user ID to check ownership
};

export const getCourseByIdService = async (
  deps: CourseServiceDependencies,
  options: GetCourseByIdOptions
): Promise<HandlerResult<Course, typeof courseErrorCodes[keyof typeof courseErrorCodes], unknown>> => {
  const { supabase, logger } = deps;
  const { courseId, userId } = options;

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
        archived_at,
        categories!inner (name, is_active),
        difficulties!inner (name, is_active)
      `)
      .eq('id', courseId)
      .is('deleted_at', null);

    // If userId is provided, check ownership
    if (userId) {
      query = query.eq('owner_id', userId);
    }

    const { data, error } = await query.single();

    if (error) {
      logger.error('Failed to fetch course by ID', error.message);
      return failure(404, 'COURSE_NOT_FOUND', 'Course not found');
    }

    // Transform data to match schema expectations
    const categoryData = (data as any).categories;
    const difficultyData = (data as any).difficulties;

    const transformedCourse = {
      id: data.id,
      owner_id: data.owner_id,
      title: data.title,
      description: data.description,
      category_id: data.category_id,
      difficulty_id: data.difficulty_id,
      status: data.status,
      enrollment_count: data.enrollment_count,
      created_at: data.created_at,
      updated_at: data.updated_at,
      published_at: data.published_at,
      archived_at: data.archived_at,
      category_name: categoryData?.name || null,
      difficulty_name: difficultyData?.name || null,
    };

    const validatedCourse = courseSchema.parse(transformedCourse);

    return success(validatedCourse);
  } catch (error) {
    logger.error('Error fetching course by ID', error);
    return failure(500, 'COURSE_FETCH_ERROR', error instanceof Error ? error.message : 'Unknown error');
  }
};

/**
 * Update course details
 */
export type UpdateCourseOptions = {
  courseId: string;
  userId: string;
  title?: string;
  description?: string;
  category_id?: number | null;
  difficulty_id?: number | null;
};

export const updateCourseService = async (
  deps: CourseServiceDependencies,
  options: UpdateCourseOptions
): Promise<HandlerResult<Course, typeof courseErrorCodes[keyof typeof courseErrorCodes], unknown>> => {
  const { supabase, logger } = deps;
  const { courseId, userId, ...updateData } = options;

  try {
    // First, verify the course exists and belongs to the user
    const { data: existingCourse, error: fetchError } = await supabase
      .from(COURSES_TABLE)
      .select('id, owner_id, title')
      .eq('id', courseId)
      .eq('owner_id', userId)
      .is('deleted_at', null)
      .single();

    if (fetchError) {
      logger.error('Failed to fetch course for update', fetchError.message);
      return failure(404, 'COURSE_NOT_FOUND', 'Course not found');
    }

    if (!existingCourse) {
      logger.info('User attempted to update non-existent course', { courseId, userId });
      return failure(404, 'COURSE_NOT_FOUND', 'Course not found');
    }

    // Check if title is being updated and if it already exists for this user
    if (updateData.title && updateData.title !== existingCourse.title) {
      const { data: duplicateCheck, error: duplicateError } = await supabase
        .from(COURSES_TABLE)
        .select('id')
        .eq('owner_id', userId)
        .eq('title', updateData.title)
        .is('id', 'not.eq', courseId) // Exclude current course from check
        .is('deleted_at', null)
        .single();

      if (duplicateCheck) {
        logger.info('Course title already exists for user', { userId, title: updateData.title });
        return failure(409, 'COURSE_TITLE_DUPLICATE', 'A course with this title already exists');
      }
    }

    // Update the course
    const { data: updatedCourse, error: updateError } = await supabase
      .from(COURSES_TABLE)
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', courseId)
      .eq('owner_id', userId)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to update course', updateError.message);
      return failure(500, 'COURSE_UPDATE_ERROR', updateError.message);
    }

    // Transform and validate the result data
    const transformedCourse = {
      id: updatedCourse.id,
      owner_id: updatedCourse.owner_id,
      title: updatedCourse.title,
      description: updatedCourse.description,
      category_id: updatedCourse.category_id,
      difficulty_id: updatedCourse.difficulty_id,
      status: updatedCourse.status,
      enrollment_count: updatedCourse.enrollment_count,
      created_at: updatedCourse.created_at,
      updated_at: updatedCourse.updated_at,
      published_at: updatedCourse.published_at,
      archived_at: updatedCourse.archived_at,
      category_name: null, // Will be populated when joined with categories
      difficulty_name: null, // Will be populated when joined with difficulties
    };

    const validatedCourse = courseSchema.parse(transformedCourse);

    return success(validatedCourse);
  } catch (error) {
    logger.error('Error updating course', error);
    return failure(500, 'COURSE_UPDATE_ERROR', error instanceof Error ? error.message : 'Unknown error');
  }
};

/**
 * Update course status with business rules
 */
export type UpdateCourseStatusOptions = {
  courseId: string;
  userId: string;
  status: 'draft' | 'published' | 'archived';
};

export const updateCourseStatusService = async (
  deps: CourseServiceDependencies,
  options: UpdateCourseStatusOptions
): Promise<HandlerResult<Course, typeof courseErrorCodes[keyof typeof courseErrorCodes], unknown>> => {
  const { supabase, logger } = deps;
  const { courseId, userId, status } = options;

  try {
    // First, verify the course exists and belongs to the user
    const { data: existingCourse, error: fetchError } = await supabase
      .from(COURSES_TABLE)
      .select('id, owner_id, title, description, status, enrollment_count')
      .eq('id', courseId)
      .eq('owner_id', userId)
      .is('deleted_at', null)
      .single();

    if (fetchError) {
      logger.error('Failed to fetch course for status update', fetchError.message);
      return failure(404, 'COURSE_NOT_FOUND', 'Course not found');
    }

    if (!existingCourse) {
      logger.info('User attempted to update status of non-existent course', { courseId, userId });
      return failure(404, 'COURSE_NOT_FOUND', 'Course not found');
    }

    const currentStatus = existingCourse.status;

    // Apply business rules for status transitions
    if (currentStatus === 'published' && status === 'published') {
      // No change needed
      return getCourseByIdService(deps, { courseId, userId });
    }

    if (currentStatus === 'published' && status === 'archived') {
      // When archiving a published course, close all assignments and block new enrollments
      // For now, we just update the archived_at timestamp
      const { data: updatedCourse, error: updateError } = await supabase
        .from(COURSES_TABLE)
        .update({
          status,
          archived_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', courseId)
        .eq('owner_id', userId)
        .select()
        .single();

      if (updateError) {
        logger.error('Failed to archive course', updateError.message);
        return failure(500, 'COURSE_STATUS_CHANGE_ERROR', updateError.message);
      }

      // Transform and validate the result data
      const transformedCourse = {
        id: updatedCourse.id,
        owner_id: updatedCourse.owner_id,
        title: updatedCourse.title,
        description: updatedCourse.description,
        category_id: updatedCourse.category_id,
        difficulty_id: updatedCourse.difficulty_id,
        status: updatedCourse.status,
        enrollment_count: updatedCourse.enrollment_count,
        created_at: updatedCourse.created_at,
        updated_at: updatedCourse.updated_at,
        published_at: updatedCourse.published_at,
        archived_at: updatedCourse.archived_at,
        category_name: null, // Will be populated when joined with categories
        difficulty_name: null, // Will be populated when joined with difficulties
      };

      const validatedCourse = courseSchema.parse(transformedCourse);

      return success(validatedCourse);
    }

    if (currentStatus === 'archived' && status === 'published') {
      // Not allowed directly - must go through draft
      logger.info('Direct transition from archived to published not allowed', { courseId, userId });
      return failure(400, 'COURSE_STATUS_CHANGE_ERROR', 'Cannot directly publish an archived course. Change to draft first.');
    }

    if (currentStatus === 'archived' && status === 'draft') {
      // Allow reactivation with warning
      const { data: updatedCourse, error: updateError } = await supabase
        .from(COURSES_TABLE)
        .update({
          status,
          archived_at: null, // Clear archived timestamp
          updated_at: new Date().toISOString(),
        })
        .eq('id', courseId)
        .eq('owner_id', userId)
        .select()
        .single();

      if (updateError) {
        logger.error('Failed to reactivate archived course to draft', updateError.message);
        return failure(500, 'COURSE_STATUS_CHANGE_ERROR', updateError.message);
      }

      // Transform and validate the result data
      const transformedCourse = {
        id: updatedCourse.id,
        owner_id: updatedCourse.owner_id,
        title: updatedCourse.title,
        description: updatedCourse.description,
        category_id: updatedCourse.category_id,
        difficulty_id: updatedCourse.difficulty_id,
        status: updatedCourse.status,
        enrollment_count: updatedCourse.enrollment_count,
        created_at: updatedCourse.created_at,
        updated_at: updatedCourse.updated_at,
        published_at: updatedCourse.published_at,
        archived_at: updatedCourse.archived_at,
        category_name: null, // Will be populated when joined with categories
        difficulty_name: null, // Will be populated when joined with difficulties
      };

      const validatedCourse = courseSchema.parse(transformedCourse);

      return success(validatedCourse);
    }

    if (currentStatus === 'draft' && status === 'published') {
      // Validate required fields before publishing
      if (!existingCourse.title || existingCourse.title.trim() === '') {
        logger.info('Cannot publish course without title', { courseId, userId });
        return failure(400, 'COURSE_PUBLISH_VALIDATION_ERROR', 'Title is required to publish a course');
      }

      // Set published_at timestamp
      const { data: updatedCourse, error: updateError } = await supabase
        .from(COURSES_TABLE)
        .update({
          status,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', courseId)
        .eq('owner_id', userId)
        .select()
        .single();

      if (updateError) {
        logger.error('Failed to publish course', updateError.message);
        return failure(500, 'COURSE_STATUS_CHANGE_ERROR', updateError.message);
      }

      // Transform and validate the result data
      const transformedCourse = {
        id: updatedCourse.id,
        owner_id: updatedCourse.owner_id,
        title: updatedCourse.title,
        description: updatedCourse.description,
        category_id: updatedCourse.category_id,
        difficulty_id: updatedCourse.difficulty_id,
        status: updatedCourse.status,
        enrollment_count: updatedCourse.enrollment_count,
        created_at: updatedCourse.created_at,
        updated_at: updatedCourse.updated_at,
        published_at: updatedCourse.published_at,
        archived_at: updatedCourse.archived_at,
        category_name: null, // Will be populated when joined with categories
        difficulty_name: null, // Will be populated when joined with difficulties
      };

      const validatedCourse = courseSchema.parse(transformedCourse);

      return success(validatedCourse);
    }

    // For other transitions, just update the status
    const { data: updatedCourse, error: updateError } = await supabase
      .from(COURSES_TABLE)
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', courseId)
      .eq('owner_id', userId)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to update course status', updateError.message);
      return failure(500, 'COURSE_STATUS_CHANGE_ERROR', updateError.message);
    }

    // Transform and validate the result data
    const transformedCourse = {
      id: updatedCourse.id,
      owner_id: updatedCourse.owner_id,
      title: updatedCourse.title,
      description: updatedCourse.description,
      category_id: updatedCourse.category_id,
      difficulty_id: updatedCourse.difficulty_id,
      status: updatedCourse.status,
      enrollment_count: updatedCourse.enrollment_count,
      created_at: updatedCourse.created_at,
      updated_at: updatedCourse.updated_at,
      published_at: updatedCourse.published_at,
      archived_at: updatedCourse.archived_at,
      category_name: null, // Will be populated when joined with categories
      difficulty_name: null, // Will be populated when joined with difficulties
    };

    const validatedCourse = courseSchema.parse(transformedCourse);

    return success(validatedCourse);
  } catch (error) {
    logger.error('Error updating course status', error);
    return failure(500, 'COURSE_STATUS_CHANGE_ERROR', error instanceof Error ? error.message : 'Unknown error');
  }
};

/**
 * Soft delete course with validation
 */
export type DeleteCourseOptions = {
  courseId: string;
  userId: string;
};

export const deleteCourseService = async (
  deps: CourseServiceDependencies,
  options: DeleteCourseOptions
): Promise<HandlerResult<Course, typeof courseErrorCodes[keyof typeof courseErrorCodes], unknown>> => {
  const { supabase, logger } = deps;
  const { courseId, userId } = options;

  try {
    // First, verify the course exists, belongs to the user, and check if it has active enrollments
    const { data: existingCourse, error: fetchError } = await supabase
      .from(COURSES_TABLE)
      .select('id, owner_id, title, status, enrollment_count')
      .eq('id', courseId)
      .eq('owner_id', userId)
      .is('deleted_at', null)
      .single();

    if (fetchError) {
      logger.error('Failed to fetch course for deletion', fetchError.message);
      return failure(404, 'COURSE_NOT_FOUND', 'Course not found');
    }

    if (!existingCourse) {
      logger.info('User attempted to delete non-existent course', { courseId, userId });
      return failure(404, 'COURSE_NOT_FOUND', 'Course not found');
    }

    // Prevent deletion of courses with active enrollments
    if (existingCourse.enrollment_count > 0) {
      logger.info('Attempted to delete course with active enrollments', { courseId, userId, enrollmentCount: existingCourse.enrollment_count });
      return failure(400, 'COURSE_HAS_ACTIVE_ENROLLMENTS', 'Cannot delete course with active enrollments');
    }

    // Perform soft deletion by setting deleted_at timestamp
    const { data: deletedCourse, error: deleteError } = await supabase
      .from(COURSES_TABLE)
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', courseId)
      .eq('owner_id', userId)
      .select()
      .single();

    if (deleteError) {
      logger.error('Failed to delete course', deleteError.message);
      return failure(500, 'COURSE_DELETE_ERROR', deleteError.message);
    }

    // Transform and validate the result data
    const transformedCourse = {
      id: deletedCourse.id,
      owner_id: deletedCourse.owner_id,
      title: deletedCourse.title,
      description: deletedCourse.description,
      category_id: deletedCourse.category_id,
      difficulty_id: deletedCourse.difficulty_id,
      status: deletedCourse.status,
      enrollment_count: deletedCourse.enrollment_count,
      created_at: deletedCourse.created_at,
      updated_at: deletedCourse.updated_at,
      published_at: deletedCourse.published_at,
      archived_at: deletedCourse.archived_at,
      category_name: null, // Will be populated when joined with categories
      difficulty_name: null, // Will be populated when joined with difficulties
    };

    const validatedCourse = courseSchema.parse(transformedCourse);

    return success(validatedCourse);
  } catch (error) {
    logger.error('Error deleting course', error);
    return failure(500, 'COURSE_DELETE_ERROR', error instanceof Error ? error.message : 'Unknown error');
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
  COURSE_TITLE_DUPLICATE: 'COURSE_TITLE_DUPLICATE',
  COURSE_CREATION_ERROR: 'COURSE_CREATION_ERROR',
  COURSE_UPDATE_ERROR: 'COURSE_UPDATE_ERROR',
  COURSE_STATUS_CHANGE_ERROR: 'COURSE_STATUS_CHANGE_ERROR',
  COURSE_DELETE_ERROR: 'COURSE_DELETE_ERROR',
  COURSE_HAS_ACTIVE_ENROLLMENTS: 'COURSE_HAS_ACTIVE_ENROLLMENTS',
  COURSE_PUBLISH_VALIDATION_ERROR: 'COURSE_PUBLISH_VALIDATION_ERROR',
  COURSE_FETCH_ERROR: 'COURSE_FETCH_ERROR',
} as const;