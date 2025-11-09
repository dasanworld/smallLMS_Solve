import type { Hono } from 'hono';
import {
  failure,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
import {
  getPublishedCoursesRequestSchema,
  createEnrollmentRequestSchema,
  createCourseRequestSchema,
  updateCourseRequestSchema,
  updateCourseStatusRequestSchema,
  getInstructorCoursesResponseSchema,
} from '@/features/course/backend/schema';
import {
  getPublishedCoursesService,
  createEnrollmentService,
  cancelEnrollmentService,
  getUserEnrollmentsService,
  checkEnrollmentStatusService,
  getActiveMetadataService,
  getInstructorCoursesService,
  createCourseService,
  getCourseByIdService,
  updateCourseService,
  updateCourseStatusService,
  deleteCourseService,
  courseErrorCodes,
} from './service';

export const registerCourseRoutes = (app: Hono<AppEnv>) => {
  // Get published courses with filters
  app.get('/api/courses', async (c) => {
    // Build query parameter object manually
    const queryParams = {
      search: c.req.query('search') || undefined,
      status: c.req.query('status') || undefined,
      category_id: c.req.query('category_id') || undefined,
      difficulty_id: c.req.query('difficulty_id') || undefined,
      sort: c.req.query('sort') || undefined,
      page: c.req.query('page') || undefined,
      limit: c.req.query('limit') || undefined,
    };
    
    const parsedQuery = getPublishedCoursesRequestSchema.safeParse(queryParams);

    if (!parsedQuery.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_COURSE_QUERY_PARAMS',
          'Invalid query parameters provided.',
          parsedQuery.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const deps = { supabase, logger };

    // Convert string values to appropriate types
    const filters = {
      search: parsedQuery.data.search,
      category_id: parsedQuery.data.category_id ? Number(parsedQuery.data.category_id) : undefined,
      difficulty_id: parsedQuery.data.difficulty_id ? Number(parsedQuery.data.difficulty_id) : undefined,
      sort: parsedQuery.data.sort,
      page: parsedQuery.data.page ? Number(parsedQuery.data.page) : 1,
      limit: parsedQuery.data.limit ? Number(parsedQuery.data.limit) : 10,
    };

    const result = await getPublishedCoursesService(deps, filters);

    if (!result.ok) {
      const errorResult = result as unknown as ErrorResult<typeof courseErrorCodes[keyof typeof courseErrorCodes], unknown>;

      if (errorResult.error.code === courseErrorCodes.COURSES_FETCH_ERROR) {
        logger.error('Failed to fetch courses', errorResult.error.message);
      } else {
        logger.error('Courses request failed', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });

  // Create new enrollment
  app.post('/api/enrollments', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    
    // Get the authorization token from the header
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return respond(
        c,
        failure(
          401,
          'UNAUTHENTICATED',
          'User must be authenticated to enroll in a course.',
        ),
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Use the token to get user info from Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.error('Failed to get user from auth token', error?.message);
      return respond(
        c,
        failure(
          401,
          'UNAUTHENTICATED',
          'Invalid or expired authentication token.',
        ),
      );
    }

    const requestBody = await c.req.json();
    const parsedBody = createEnrollmentRequestSchema.safeParse(requestBody);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_ENROLLMENT_REQUEST',
          'Invalid enrollment data provided.',
          parsedBody.error.format(),
        ),
      );
    }

    const deps = { supabase, logger };

    const result = await createEnrollmentService(deps, {
      userId: user.id,
      courseId: parsedBody.data.course_id,
    });

    if (!result.ok) {
      const errorResult = result as unknown as ErrorResult<typeof courseErrorCodes[keyof typeof courseErrorCodes], unknown>;

      if (errorResult.error.code === courseErrorCodes.COURSE_NOT_FOUND) {
        logger.info('Course not found for enrollment', errorResult.error.message);
      } else if (errorResult.error.code === courseErrorCodes.DUPLICATE_ENROLLMENT) {
        logger.info('Duplicate enrollment attempt', errorResult.error.message);
      } else {
        logger.error('Enrollment creation failed', errorResult.error.message);
      }

      return respond(c, result);
    }

    logger.info('User enrolled in course successfully', {
      userId: user.id,
      courseId: parsedBody.data.course_id,
    });

    return respond(c, result);
  });

  // Cancel enrollment
  // Get user's enrollments
  app.get('/api/enrollments', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    
    // Get the authorization token from the header
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return respond(
        c,
        failure(
          401,
          'UNAUTHENTICATED',
          'User must be authenticated to view enrollments.',
        ),
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Use the token to get user info from Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.error('Failed to get user from auth token', error?.message);
      return respond(
        c,
        failure(
          401,
          'UNAUTHENTICATED',
          'Invalid or expired authentication token.',
        ),
      );
    }

    // Get status query parameter
    const status = c.req.query('status');

    const deps = { supabase, logger };

    const result = await getUserEnrollmentsService(deps, {
      userId: user.id,
      status: status && ['active', 'cancelled'].includes(status) ? status as 'active' | 'cancelled' : undefined,
    });

    if (!result.ok) {
      const errorResult = result as unknown as ErrorResult<typeof courseErrorCodes[keyof typeof courseErrorCodes], unknown>;

      if (errorResult.error.code === courseErrorCodes.COURSES_FETCH_ERROR) {
        logger.error('Failed to fetch user enrollments', errorResult.error.message);
      } else {
        logger.error('Enrollments request failed', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });

  // Check enrollment status for a specific course
  app.get('/api/enrollments/status/:courseId', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    
    // Get the authorization token from the header
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return respond(
        c,
        failure(
          401,
          'UNAUTHENTICATED',
          'User must be authenticated to check enrollment status.',
        ),
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Use the token to get user info from Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.error('Failed to get user from auth token', error?.message);
      return respond(
        c,
        failure(
          401,
          'UNAUTHENTICATED',
          'Invalid or expired authentication token.',
        ),
      );
    }

    const courseId = c.req.param('courseId');
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(courseId)) {
      return respond(
        c,
        failure(
          400,
          'INVALID_COURSE_ID',
          'Invalid course ID format.',
        ),
      );
    }

    const deps = { supabase, logger };

    const result = await checkEnrollmentStatusService(deps, {
      userId: user.id,
      courseId,
    });

    if (!result.ok) {
      const errorResult = result as unknown as ErrorResult<typeof courseErrorCodes[keyof typeof courseErrorCodes], unknown>;

      if (errorResult.error.code === courseErrorCodes.ENROLLMENT_STATUS_CHECK_ERROR) {
        logger.error('Failed to check enrollment status', errorResult.error.message);
      } else {
        logger.error('Enrollment status check failed', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });

  app.delete('/api/enrollments/:id', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    
    // Get the authorization token from the header
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return respond(
        c,
        failure(
          401,
          'UNAUTHENTICATED',
          'User must be authenticated to cancel an enrollment.',
        ),
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Use the token to get user info from Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.error('Failed to get user from auth token', error?.message);
      return respond(
        c,
        failure(
          401,
          'UNAUTHENTICATED',
          'Invalid or expired authentication token.',
        ),
      );
    }

    const enrollmentId = c.req.param('id');
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(enrollmentId)) {
      return respond(
        c,
        failure(
          400,
          'INVALID_ENROLLMENT_ID',
          'Invalid enrollment ID format.',
        ),
      );
    }

    const deps = { supabase, logger };

    const result = await cancelEnrollmentService(deps, {
      userId: user.id,
      enrollmentId,
    });

    if (!result.ok) {
      const errorResult = result as unknown as ErrorResult<typeof courseErrorCodes[keyof typeof courseErrorCodes], unknown>;

      if (errorResult.error.code === courseErrorCodes.ENROLLMENT_NOT_FOUND) {
        logger.info('Enrollment not found for cancellation', errorResult.error.message);
      } else if (errorResult.error.code === courseErrorCodes.ENROLLMENT_ALREADY_CANCELLED) {
        logger.info('Enrollment already cancelled', errorResult.error.message);
      } else {
        logger.error('Enrollment cancellation failed', errorResult.error.message);
      }

      return respond(c, result);
    }

    logger.info('User cancelled enrollment successfully', {
      userId: user.id,
      enrollmentId,
    });

    return respond(c, result);
  });

  // Get active metadata (categories and difficulties)
  // 활성화된 메타데이터 조회 (인증 불필요, 공개 API)
  app.get('/api/metadata/active', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const deps = { supabase, logger };

    const result = await getActiveMetadataService(deps);

    if (!result.ok) {
      result.ok || logger.error('Failed to fetch active metadata', result);
      return respond(c, result);
    }

    return respond(c, result);
  });

  // Get instructor's courses
  app.get('/api/courses/my', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // Get the authorization token from the header
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return respond(
        c,
        failure(
          401,
          'UNAUTHENTICATED',
          'User must be authenticated to view their courses.',
        ),
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Use the token to get user info from Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.error('Failed to get user from auth token', error?.message);
      return respond(
        c,
        failure(
          401,
          'UNAUTHENTICATED',
          'Invalid or expired authentication token.',
        ),
      );
    }

    // Build query parameter object manually
    const queryParams = {
      search: c.req.query('search') || undefined,
      status: c.req.query('status') || undefined,
      category_id: c.req.query('category_id') || undefined,
      difficulty_id: c.req.query('difficulty_id') || undefined,
      sort: c.req.query('sort') || undefined,
      page: c.req.query('page') || undefined,
      limit: c.req.query('limit') || undefined,
    };

    const deps = { supabase, logger };

    // Convert string values to appropriate types
    const filters = {
      userId: user.id,
      search: queryParams.search,
      status: queryParams.status ? queryParams.status as 'draft' | 'published' | 'archived' : undefined,
      category_id: queryParams.category_id ? Number(queryParams.category_id) : undefined,
      difficulty_id: queryParams.difficulty_id ? Number(queryParams.difficulty_id) : undefined,
      sort: queryParams.sort ? (queryParams.sort === 'popular' ? 'popular' : 'newest') : 'newest',
      page: queryParams.page ? Number(queryParams.page) : 1,
      limit: queryParams.limit ? Number(queryParams.limit) : 10,
    };

    const result = await getInstructorCoursesService(deps, filters);

    if (!result.ok) {
      const errorResult = result as unknown as ErrorResult<typeof courseErrorCodes[keyof typeof courseErrorCodes], unknown>;

      if (errorResult.error.code === courseErrorCodes.COURSES_FETCH_ERROR) {
        logger.error('Failed to fetch instructor courses', errorResult.error.message);
      } else {
        logger.error('Instructor courses request failed', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });

  // Create new course
  app.post('/api/courses', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // Get the authorization token from the header
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return respond(
        c,
        failure(
          401,
          'UNAUTHENTICATED',
          'User must be authenticated to create a course.',
        ),
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Use the token to get user info from Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.error('Failed to get user from auth token', error?.message);
      return respond(
        c,
        failure(
          401,
          'UNAUTHENTICATED',
          'Invalid or expired authentication token.',
        ),
      );
    }

    const requestBody = await c.req.json();
    const parsedBody = createCourseRequestSchema.safeParse(requestBody);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_COURSE_REQUEST',
          'Invalid course data provided.',
          parsedBody.error.format(),
        ),
      );
    }

    const deps = { supabase, logger };

    const result = await createCourseService(deps, {
      userId: user.id,
      title: parsedBody.data.title,
      description: parsedBody.data.description,
      category_id: parsedBody.data.category_id,
      difficulty_id: parsedBody.data.difficulty_id,
    });

    if (!result.ok) {
      const errorResult = result as unknown as ErrorResult<typeof courseErrorCodes[keyof typeof courseErrorCodes], unknown>;

      if (errorResult.error.code === courseErrorCodes.COURSE_TITLE_DUPLICATE) {
        logger.info('Course title duplicate', errorResult.error.message);
      } else if (errorResult.error.code === courseErrorCodes.COURSE_CREATION_ERROR) {
        logger.error('Course creation failed', errorResult.error.message);
      } else {
        logger.error('Course creation request failed', errorResult.error.message);
      }

      return respond(c, result);
    }

    logger.info('Course created successfully', {
      userId: user.id,
      courseId: result.data.id,
    });

    return respond(c, result);
  });

  // Get specific course details
  app.get('/api/courses/:id', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // Get the authorization token from the header
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return respond(
        c,
        failure(
          401,
          'UNAUTHENTICATED',
          'User must be authenticated to view course details.',
        ),
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Use the token to get user info from Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.error('Failed to get user from auth token', error?.message);
      return respond(
        c,
        failure(
          401,
          'UNAUTHENTICATED',
          'Invalid or expired authentication token.',
        ),
      );
    }

    const courseId = c.req.param('id');

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(courseId)) {
      return respond(
        c,
        failure(
          400,
          'INVALID_COURSE_ID',
          'Invalid course ID format.',
        ),
      );
    }

    const deps = { supabase, logger };

    const result = await getCourseByIdService(deps, {
      courseId,
      userId: user.id,
    });

    if (!result.ok) {
      const errorResult = result as unknown as ErrorResult<typeof courseErrorCodes[keyof typeof courseErrorCodes], unknown>;

      if (errorResult.error.code === courseErrorCodes.COURSE_NOT_FOUND) {
        logger.info('Course not found', errorResult.error.message);
      } else {
        logger.error('Course details request failed', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });

  // Update course details
  app.put('/api/courses/:id', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // Get the authorization token from the header
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return respond(
        c,
        failure(
          401,
          'UNAUTHENTICATED',
          'User must be authenticated to update a course.',
        ),
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Use the token to get user info from Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.error('Failed to get user from auth token', error?.message);
      return respond(
        c,
        failure(
          401,
          'UNAUTHENTICATED',
          'Invalid or expired authentication token.',
        ),
      );
    }

    const courseId = c.req.param('id');

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(courseId)) {
      return respond(
        c,
        failure(
          400,
          'INVALID_COURSE_ID',
          'Invalid course ID format.',
        ),
      );
    }

    const requestBody = await c.req.json();
    const parsedBody = updateCourseRequestSchema.safeParse(requestBody);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_COURSE_UPDATE_REQUEST',
          'Invalid course update data provided.',
          parsedBody.error.format(),
        ),
      );
    }

    const deps = { supabase, logger };

    const result = await updateCourseService(deps, {
      courseId,
      userId: user.id,
      title: parsedBody.data.title,
      description: parsedBody.data.description,
      category_id: parsedBody.data.category_id,
      difficulty_id: parsedBody.data.difficulty_id,
    });

    if (!result.ok) {
      const errorResult = result as unknown as ErrorResult<typeof courseErrorCodes[keyof typeof courseErrorCodes], unknown>;

      if (errorResult.error.code === courseErrorCodes.COURSE_NOT_FOUND) {
        logger.info('Course not found for update', errorResult.error.message);
      } else if (errorResult.error.code === courseErrorCodes.COURSE_TITLE_DUPLICATE) {
        logger.info('Course title duplicate during update', errorResult.error.message);
      } else if (errorResult.error.code === courseErrorCodes.COURSE_UPDATE_ERROR) {
        logger.error('Course update failed', errorResult.error.message);
      } else {
        logger.error('Course update request failed', errorResult.error.message);
      }

      return respond(c, result);
    }

    logger.info('Course updated successfully', {
      userId: user.id,
      courseId,
    });

    return respond(c, result);
  });

  // Update course status
  app.patch('/api/courses/:id/status', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // Get the authorization token from the header
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return respond(
        c,
        failure(
          401,
          'UNAUTHENTICATED',
          'User must be authenticated to update course status.',
        ),
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Use the token to get user info from Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.error('Failed to get user from auth token', error?.message);
      return respond(
        c,
        failure(
          401,
          'UNAUTHENTICATED',
          'Invalid or expired authentication token.',
        ),
      );
    }

    const courseId = c.req.param('id');

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(courseId)) {
      return respond(
        c,
        failure(
          400,
          'INVALID_COURSE_ID',
          'Invalid course ID format.',
        ),
      );
    }

    const requestBody = await c.req.json();
    const parsedBody = updateCourseStatusRequestSchema.safeParse(requestBody);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_COURSE_STATUS_UPDATE_REQUEST',
          'Invalid course status update data provided.',
          parsedBody.error.format(),
        ),
      );
    }

    const deps = { supabase, logger };

    const result = await updateCourseStatusService(deps, {
      courseId,
      userId: user.id,
      status: parsedBody.data.status,
    });

    if (!result.ok) {
      const errorResult = result as unknown as ErrorResult<typeof courseErrorCodes[keyof typeof courseErrorCodes], unknown>;

      if (errorResult.error.code === courseErrorCodes.COURSE_NOT_FOUND) {
        logger.info('Course not found for status update', errorResult.error.message);
      } else if (errorResult.error.code === courseErrorCodes.COURSE_STATUS_CHANGE_ERROR) {
        logger.info('Course status change not allowed', errorResult.error.message);
      } else {
        logger.error('Course status update request failed', errorResult.error.message);
      }

      return respond(c, result);
    }

    logger.info('Course status updated successfully', {
      userId: user.id,
      courseId,
      status: parsedBody.data.status,
    });

    return respond(c, result);
  });

  // Delete course (soft delete)
  app.delete('/api/courses/:id', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // Get the authorization token from the header
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return respond(
        c,
        failure(
          401,
          'UNAUTHENTICATED',
          'User must be authenticated to delete a course.',
        ),
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Use the token to get user info from Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.error('Failed to get user from auth token', error?.message);
      return respond(
        c,
        failure(
          401,
          'UNAUTHENTICATED',
          'Invalid or expired authentication token.',
        ),
      );
    }

    const courseId = c.req.param('id');

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(courseId)) {
      return respond(
        c,
        failure(
          400,
          'INVALID_COURSE_ID',
          'Invalid course ID format.',
        ),
      );
    }

    const deps = { supabase, logger };

    const result = await deleteCourseService(deps, {
      courseId,
      userId: user.id,
    });

    if (!result.ok) {
      const errorResult = result as unknown as ErrorResult<typeof courseErrorCodes[keyof typeof courseErrorCodes], unknown>;

      if (errorResult.error.code === courseErrorCodes.COURSE_NOT_FOUND) {
        logger.info('Course not found for deletion', errorResult.error.message);
      } else if (errorResult.error.code === courseErrorCodes.COURSE_HAS_ACTIVE_ENROLLMENTS) {
        logger.info('Attempted to delete course with active enrollments', errorResult.error.message);
      } else if (errorResult.error.code === courseErrorCodes.COURSE_DELETE_ERROR) {
        logger.error('Course deletion failed', errorResult.error.message);
      } else {
        logger.error('Course deletion request failed', errorResult.error.message);
      }

      return respond(c, result);
    }

    logger.info('Course deleted successfully', {
      userId: user.id,
      courseId,
    });

    return respond(c, result);
  });
};