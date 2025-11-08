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
} from '@/features/course/backend/schema';
import {
  getPublishedCoursesService,
  createEnrollmentService,
  cancelEnrollmentService,
  getUserEnrollmentsService,
  checkEnrollmentStatusService,
  getActiveMetadataService,
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
      logger.error('Failed to fetch active metadata', result.error);
      return respond(c, result);
    }

    return respond(c, result);
  });
};