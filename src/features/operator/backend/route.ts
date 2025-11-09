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
  getReportsRequestSchema,
  updateReportStatusRequestSchema,
  takeReportActionRequestSchema,
  createCategoryRequestSchema,
  createDifficultyRequestSchema,
  updateCategoryRequestSchema,
  updateDifficultyRequestSchema,
  reportSchema,
  categorySchema,
  difficultySchema,
} from './schema';
import {
  getReportsService,
  getReportByIdService,
  updateReportStatusService,
  takeReportActionService,
  getMetadataService,
  createMetadataService,
  updateMetadataService,
  deactivateMetadataService,
  type Report,
  type Category,
  type Difficulty,
} from './service';
import { operatorErrorCodes } from './error';

export const registerOperatorRoutes = (app: Hono<AppEnv>) => {
  // Middleware to check if user has operator role
  const operatorOnly = async (c: any, next: any) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // Get the authorization token from the header
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return respond(
        c,
        failure(
          401,
          'UNAUTHORIZED',
          'Authorization header missing or invalid.',
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
          'UNAUTHORIZED',
          'Invalid or expired authentication token.',
        ),
      );
    }

    // Check if user has operator role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      logger.error('Failed to fetch user role', userError?.message);
      return respond(
        c,
        failure(
          401,
          'UNAUTHORIZED',
          'Failed to verify user role.',
        ),
      );
    }

    if (userData.role !== 'operator') {
      logger.info('Non-operator user attempted to access operator route', { userId: user.id, role: userData.role });
      return respond(
        c,
        failure(
          403,
          operatorErrorCodes.OPERATOR_PERMISSION_DENIED,
          'Access denied: Operator role required.',
        ),
      );
    }

    // Add user info to context for use in handlers
    c.set('user', { id: user.id, role: userData.role });

    await next();
  };

  // GET /api/operator/reports - Get list of reports with filtering
  app.get('/api/operator/reports', operatorOnly, async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // Build query parameter object manually
    const queryParams = {
      type: c.req.query('type') || undefined,
      status: c.req.query('status') || undefined,
      page: c.req.query('page') || undefined,
      limit: c.req.query('limit') || undefined,
    };

    const parsedQuery = getReportsRequestSchema.safeParse(queryParams);

    if (!parsedQuery.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_REPORT_QUERY_PARAMS',
          'Invalid query parameters provided.',
          parsedQuery.error.format(),
        ),
      );
    }

    const deps = { supabase, logger };

    // Convert string values to appropriate types
    const filters = {
      type: parsedQuery.data.type,
      status: parsedQuery.data.status,
      page: parsedQuery.data.page ? Number(parsedQuery.data.page) : 1,
      limit: parsedQuery.data.limit ? Number(parsedQuery.data.limit) : 10,
    };

    const result = await getReportsService(deps, filters);

    if (!result.ok) {
      logger.error('Reports request failed', (result as any).error?.message);
      return respond(c, result);
    }

    return respond(c, result);
  });

  // GET /api/operator/reports/:id - Get report details
  app.get('/api/operator/reports/:id', operatorOnly, async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const reportId = c.req.param('id');

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(reportId)) {
      return respond(
        c,
        failure(
          400,
          'INVALID_REPORT_ID',
          'Invalid report ID format.',
        ),
      );
    }

    const deps = { supabase, logger };

    const result = await getReportByIdService(deps, reportId);

    if (!result.ok) {
      const errorResult = result as unknown as ErrorResult<typeof operatorErrorCodes[keyof typeof operatorErrorCodes], unknown>;

      if (errorResult.error.code === 'REPORT_NOT_FOUND') {
        logger.info('Report not found', errorResult.error.message);
      } else {
        logger.error('Report details request failed', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });

  // PUT /api/operator/reports/:id/status - Update report status
  app.put('/api/operator/reports/:id/status', operatorOnly, async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const reportId = c.req.param('id');
    const user = c.get('user');

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(reportId)) {
      return respond(
        c,
        failure(
          400,
          'INVALID_REPORT_ID',
          'Invalid report ID format.',
        ),
      );
    }

    const requestBody = await c.req.json();
    const parsedBody = updateReportStatusRequestSchema.safeParse(requestBody);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_REPORT_STATUS_UPDATE_REQUEST',
          'Invalid report status update data provided.',
          parsedBody.error.format(),
        ),
      );
    }

    const deps = { supabase, logger };

    const result = await updateReportStatusService(deps, {
      reportId,
      newStatus: parsedBody.data.newStatus,
      operatorId: user.id,
    });

    if (!result.ok) {
      const errorResult = result as unknown as ErrorResult<typeof operatorErrorCodes[keyof typeof operatorErrorCodes], unknown>;

      if (errorResult.error.code === operatorErrorCodes.INVALID_REPORT_STATUS_TRANSITION) {
        logger.info('Invalid report status transition', errorResult.error.message);
      } else {
        logger.error('Report status update failed', errorResult.error.message);
      }

      return respond(c, result);
    }

    logger.info('Report status updated successfully', {
      reportId,
      newStatus: parsedBody.data.newStatus,
      operatorId: user.id,
    });

    return respond(c, result);
  });

  // POST /api/operator/reports/:id/actions - Take administrative action on report
  app.post('/api/operator/reports/:id/actions', operatorOnly, async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const reportId = c.req.param('id');
    const user = c.get('user');

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(reportId)) {
      return respond(
        c,
        failure(
          400,
          'INVALID_REPORT_ID',
          'Invalid report ID format.',
        ),
      );
    }

    const requestBody = await c.req.json();
    const parsedBody = takeReportActionRequestSchema.safeParse(requestBody);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_ADMIN_ACTION_REQUEST',
          'Invalid administrative action data provided.',
          parsedBody.error.format(),
        ),
      );
    }

    const deps = { supabase, logger };

    const result = await takeReportActionService(deps, {
      reportId,
      action: parsedBody.data.action,
      operatorId: user.id,
      notes: parsedBody.data.notes,
    });

    if (!result.ok) {
      const errorResult = result as unknown as ErrorResult<typeof operatorErrorCodes[keyof typeof operatorErrorCodes], unknown>;

      if (errorResult.error.code === operatorErrorCodes.INVALID_ADMIN_ACTION) {
        logger.info('Invalid administrative action', errorResult.error.message);
      } else {
        logger.error('Report action failed', errorResult.error.message);
      }

      return respond(c, result);
    }

    logger.info('Report action taken successfully', {
      reportId,
      action: parsedBody.data.action,
      operatorId: user.id,
    });

    return respond(c, result);
  });

  // GET /api/operator/categories - Get categories with `is_active` status
  app.get('/api/operator/categories', operatorOnly, async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // Get query parameters
    const isActiveQuery = c.req.query('is_active');
    let isActive: boolean | undefined = undefined;
    if (isActiveQuery !== undefined) {
      isActive = isActiveQuery === 'true';
    }

    const deps = { supabase, logger };

    const result = await getMetadataService(deps, {
      type: 'categories',
      isActive,
    });

    if (!result.ok) {
      logger.error('Failed to fetch categories', (result as any).error?.message);
      return respond(c, result);
    }

    return respond(c, result);
  });

  // POST /api/operator/categories - Create new category
  app.post('/api/operator/categories', operatorOnly, async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const requestBody = await c.req.json();
    const parsedBody = createCategoryRequestSchema.safeParse(requestBody);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_CATEGORY_CREATION_REQUEST',
          'Invalid category creation data provided.',
          parsedBody.error.format(),
        ),
      );
    }

    const deps = { supabase, logger };

    const result = await createMetadataService(deps, {
      type: 'categories',
      name: parsedBody.data.name,
      description: parsedBody.data.description,
    });

    if (!result.ok) {
      logger.error('Failed to create category', (result as any).error?.message);
      return respond(c, result);
    }

    logger.info('Category created successfully', {
      name: parsedBody.data.name,
    });

    return respond(c, result);
  });

  // PUT /api/operator/categories/:id - Update category
  app.put('/api/operator/categories/:id', operatorOnly, async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const categoryId = c.req.param('id');

    // Validate that categoryId is a number
    const categoryIdNum = Number(categoryId);
    if (isNaN(categoryIdNum)) {
      return respond(
        c,
        failure(
          400,
          'INVALID_CATEGORY_ID',
          'Invalid category ID format.',
        ),
      );
    }

    const requestBody = await c.req.json();
    const parsedBody = updateCategoryRequestSchema.safeParse(requestBody);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_CATEGORY_UPDATE_REQUEST',
          'Invalid category update data provided.',
          parsedBody.error.format(),
        ),
      );
    }

    const deps = { supabase, logger };

    const result = await updateMetadataService(deps, {
      type: 'categories',
      id: categoryIdNum,
      name: parsedBody.data.name,
      description: parsedBody.data.description,
    });

    if (!result.ok) {
      logger.error('Failed to update category', (result as any).error?.message);
      return respond(c, result);
    }

    logger.info('Category updated successfully', {
      id: categoryIdNum,
    });

    return respond(c, result);
  });

  // PUT /api/operator/categories/:id/deactivate - Deactivate category
  app.put('/api/operator/categories/:id/deactivate', operatorOnly, async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const categoryId = c.req.param('id');

    // Validate that categoryId is a number
    const categoryIdNum = Number(categoryId);
    if (isNaN(categoryIdNum)) {
      return respond(
        c,
        failure(
          400,
          'INVALID_CATEGORY_ID',
          'Invalid category ID format.',
        ),
      );
    }

    const deps = { supabase, logger };

    const result = await deactivateMetadataService(deps, {
      type: 'categories',
      id: categoryIdNum,
    });

    if (!result.ok) {
      logger.error('Failed to deactivate category', (result as any).error?.message);
      return respond(c, result);
    }

    logger.info('Category deactivated successfully', {
      id: categoryIdNum,
    });

    return respond(c, result);
  });

  // GET /api/operator/difficulties - Get difficulties with `is_active` status
  app.get('/api/operator/difficulties', operatorOnly, async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // Get query parameters
    const isActiveQuery = c.req.query('is_active');
    let isActive: boolean | undefined = undefined;
    if (isActiveQuery !== undefined) {
      isActive = isActiveQuery === 'true';
    }

    const deps = { supabase, logger };

    const result = await getMetadataService(deps, {
      type: 'difficulties',
      isActive,
    });

    if (!result.ok) {
      logger.error('Failed to fetch difficulties', (result as any).error?.message);
      return respond(c, result);
    }

    return respond(c, result);
  });

  // POST /api/operator/difficulties - Create new difficulty
  app.post('/api/operator/difficulties', operatorOnly, async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const requestBody = await c.req.json();
    const parsedBody = createDifficultyRequestSchema.safeParse(requestBody);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_DIFFICULTY_CREATION_REQUEST',
          'Invalid difficulty creation data provided.',
          parsedBody.error.format(),
        ),
      );
    }

    const deps = { supabase, logger };

    const result = await createMetadataService(deps, {
      type: 'difficulties',
      name: parsedBody.data.name,
      description: parsedBody.data.description,
      sort_order: parsedBody.data.sort_order,
    });

    if (!result.ok) {
      logger.error('Failed to create difficulty', (result as any).error?.message);
      return respond(c, result);
    }

    logger.info('Difficulty created successfully', {
      name: parsedBody.data.name,
    });

    return respond(c, result);
  });

  // PUT /api/operator/difficulties/:id - Update difficulty
  app.put('/api/operator/difficulties/:id', operatorOnly, async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const difficultyId = c.req.param('id');

    // Validate that difficultyId is a number
    const difficultyIdNum = Number(difficultyId);
    if (isNaN(difficultyIdNum)) {
      return respond(
        c,
        failure(
          400,
          'INVALID_DIFFICULTY_ID',
          'Invalid difficulty ID format.',
        ),
      );
    }

    const requestBody = await c.req.json();
    const parsedBody = updateDifficultyRequestSchema.safeParse(requestBody);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_DIFFICULTY_UPDATE_REQUEST',
          'Invalid difficulty update data provided.',
          parsedBody.error.format(),
        ),
      );
    }

    const deps = { supabase, logger };

    const result = await updateMetadataService(deps, {
      type: 'difficulties',
      id: difficultyIdNum,
      name: parsedBody.data.name,
      description: parsedBody.data.description,
      sort_order: parsedBody.data.sort_order,
    });

    if (!result.ok) {
      logger.error('Failed to update difficulty', (result as any).error?.message);
      return respond(c, result);
    }

    logger.info('Difficulty updated successfully', {
      id: difficultyIdNum,
    });

    return respond(c, result);
  });

  // PUT /api/operator/difficulties/:id/deactivate - Deactivate difficulty
  app.put('/api/operator/difficulties/:id/deactivate', operatorOnly, async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const difficultyId = c.req.param('id');

    // Validate that difficultyId is a number
    const difficultyIdNum = Number(difficultyId);
    if (isNaN(difficultyIdNum)) {
      return respond(
        c,
        failure(
          400,
          'INVALID_DIFFICULTY_ID',
          'Invalid difficulty ID format.',
        ),
      );
    }

    const deps = { supabase, logger };

    const result = await deactivateMetadataService(deps, {
      type: 'difficulties',
      id: difficultyIdNum,
    });

    if (!result.ok) {
      logger.error('Failed to deactivate difficulty', (result as any).error?.message);
      return respond(c, result);
    }

    logger.info('Difficulty deactivated successfully', {
      id: difficultyIdNum,
    });

    return respond(c, result);
  });
};