import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import { getLogger } from '@/backend/hono/context';

// Database table names
const REPORTS_TABLE = 'reports';
const CATEGORIES_TABLE = 'categories';
const DIFFICULTIES_TABLE = 'difficulties';
const USERS_TABLE = 'users';
const AUDIT_LOG_TABLE = 'audit_log';

export type OperatorServiceDependencies = {
  supabase: SupabaseClient;
  logger: ReturnType<typeof getLogger>;
};

// Report types
export type ReportType = 'course' | 'assignment' | 'submission' | 'user';
export type ReportStatus = 'received' | 'investigating' | 'resolved';
export type AdminAction = 'resolve' | 'escalate' | 'dismiss' | 'contact_user';

// Report interface
export interface Report {
  id: string;
  reporter_id: string;
  target_type: ReportType;
  target_id: string;
  reason: string;
  content: string;
  status: ReportStatus;
  resolved_at?: string | null;
  resolved_by?: string | null;
  created_at: string;
}

// Category interface
export interface Category {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Difficulty interface
export interface Difficulty {
  id: number;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Get reports service
export type GetReportsOptions = {
  type?: ReportType;
  status?: ReportStatus;
  page?: number;
  limit?: number;
};

export const getReportsService = async (
  deps: OperatorServiceDependencies,
  options: GetReportsOptions = {}
): Promise<HandlerResult<{
  reports: Report[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}, typeof operatorErrorCodes[keyof typeof operatorErrorCodes], unknown>> => {
  const { supabase, logger } = deps;
  const { type, status, page = 1, limit = 10 } = options;

  try {
    // Build query
    let query = supabase
      .from(REPORTS_TABLE)
      .select('*', { count: 'exact' });

    // Apply filters
    if (type) {
      query = query.eq('target_type', type);
    }
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1)
      .order('created_at', { ascending: false }); // Order by newest first

    const { data, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch reports', error.message);
      return failure(500, additionalOperatorErrorCodes.REPORTS_FETCH_ERROR, error.message);
    }

    // Transform data to match interface
    const transformedReports = data.map(report => ({
      id: report.id,
      reporter_id: report.reporter_id,
      target_type: report.target_type,
      target_id: report.target_id,
      reason: report.reason,
      content: report.content,
      status: report.status as ReportStatus,
      resolved_at: report.resolved_at,
      resolved_by: report.resolved_by,
      created_at: report.created_at,
    }));

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return success({
      reports: transformedReports,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    logger.error('Error fetching reports', error);
    return failure(500, additionalOperatorErrorCodes.REPORTS_FETCH_ERROR, error instanceof Error ? error.message : 'Unknown error');
  }
};

// Get report by ID service
export const getReportByIdService = async (
  deps: OperatorServiceDependencies,
  reportId: string
): Promise<HandlerResult<Report, typeof operatorErrorCodes[keyof typeof operatorErrorCodes], unknown>> => {
  const { supabase, logger } = deps;

  try {
    const { data, error } = await supabase
      .from(REPORTS_TABLE)
      .select('*')
      .eq('id', reportId)
      .single();

    if (error) {
      logger.error('Failed to fetch report by ID', error.message);
      return failure(404, additionalOperatorErrorCodes.REPORT_NOT_FOUND, 'Report not found');
    }

    // Transform data to match interface
    const report: Report = {
      id: data.id,
      reporter_id: data.reporter_id,
      target_type: data.target_type,
      target_id: data.target_id,
      reason: data.reason,
      content: data.content,
      status: data.status as ReportStatus,
      resolved_at: data.resolved_at,
      resolved_by: data.resolved_by,
      created_at: data.created_at,
    };

    return success(report);
  } catch (error) {
    logger.error('Error fetching report by ID', error);
    return failure(500, additionalOperatorErrorCodes.REPORT_FETCH_ERROR, error instanceof Error ? error.message : 'Unknown error');
  }
};

// Update report status service
export type UpdateReportStatusOptions = {
  reportId: string;
  newStatus: ReportStatus;
  operatorId: string;
};

export const updateReportStatusService = async (
  deps: OperatorServiceDependencies,
  options: UpdateReportStatusOptions
): Promise<HandlerResult<Report, typeof operatorErrorCodes[keyof typeof operatorErrorCodes], unknown>> => {
  const { supabase, logger } = deps;
  const { reportId, newStatus, operatorId } = options;

  try {
    // First, get the current report to validate status transition
    const { data: currentReport, error: fetchError } = await supabase
      .from(REPORTS_TABLE)
      .select('status, resolved_at')
      .eq('id', reportId)
      .single();

    if (fetchError) {
      logger.error('Failed to fetch current report for status update', fetchError.message);
      return failure(404, additionalOperatorErrorCodes.REPORT_NOT_FOUND, 'Report not found');
    }

    // Validate status transition
    const currentStatus = currentReport.status as ReportStatus;
    if (!isValidStatusTransition(currentStatus, newStatus)) {
      logger.info('Invalid report status transition attempted', {
        reportId,
        from: currentStatus,
        to: newStatus
      });
      return failure(400, operatorErrorCodes.INVALID_REPORT_STATUS_TRANSITION, 'Invalid status transition');
    }

    // Update the report status
    const updateData: { status: ReportStatus; resolved_at?: string; resolved_by?: string } = {
      status: newStatus
    };

    // If status is resolved, set resolved_at and resolved_by
    if (newStatus === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = operatorId;
    } else if (currentReport.status === 'resolved' && newStatus !== 'resolved') {
      // If changing from resolved to another status, clear resolved fields
      updateData.resolved_at = null;
      updateData.resolved_by = null;
    }

    const { data: updatedReport, error: updateError } = await supabase
      .from(REPORTS_TABLE)
      .update(updateData)
      .eq('id', reportId)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to update report status', updateError.message);
      return failure(500, additionalOperatorErrorCodes.REPORT_STATUS_UPDATE_ERROR, updateError.message);
    }

    // Log the action
    await logAdminActionService(deps, {
      user_id: operatorId,
      action: 'UPDATE_REPORT_STATUS',
      target_type: 'report',
      target_id: reportId,
      details: {
        previous_status: currentStatus,
        new_status: newStatus
      }
    });

    // Transform data to match interface
    const report: Report = {
      id: updatedReport.id,
      reporter_id: updatedReport.reporter_id,
      target_type: updatedReport.target_type,
      target_id: updatedReport.target_id,
      reason: updatedReport.reason,
      content: updatedReport.content,
      status: updatedReport.status as ReportStatus,
      resolved_at: updatedReport.resolved_at,
      resolved_by: updatedReport.resolved_by,
      created_at: updatedReport.created_at,
    };

    return success(report);
  } catch (error) {
    logger.error('Error updating report status', error);
    return failure(500, additionalOperatorErrorCodes.REPORT_STATUS_UPDATE_ERROR, error instanceof Error ? error.message : 'Unknown error');
  }
};

// Validate status transition
const isValidStatusTransition = (current: ReportStatus, next: ReportStatus): boolean => {
  // Define valid transitions
  const validTransitions: Record<ReportStatus, ReportStatus[]> = {
    'received': ['investigating', 'resolved'],
    'investigating': ['resolved'],
    'resolved': ['received', 'investigating'] // Allow re-opening resolved reports
  };

  return validTransitions[current]?.includes(next) || false;
};

// Take report action service
export type TakeReportActionOptions = {
  reportId: string;
  action: AdminAction;
  operatorId: string;
  notes?: string;
};

export const takeReportActionService = async (
  deps: OperatorServiceDependencies,
  options: TakeReportActionOptions
): Promise<HandlerResult<Report, typeof operatorErrorCodes[keyof typeof operatorErrorCodes], unknown>> => {
  const { supabase, logger } = deps;
  const { reportId, action, operatorId, notes } = options;

  try {
    // Get the current report
    const { data: currentReport, error: fetchError } = await supabase
      .from(REPORTS_TABLE)
      .select('*')
      .eq('id', reportId)
      .single();

    if (fetchError) {
      logger.error('Failed to fetch report for action', fetchError.message);
      return failure(404, additionalOperatorErrorCodes.REPORT_NOT_FOUND, 'Report not found');
    }

    // Perform the action based on type
    let newStatus: ReportStatus | undefined;
    let additionalUpdates: Record<string, any> = {};

    switch (action) {
      case 'resolve':
        newStatus = 'resolved';
        additionalUpdates.resolved_at = new Date().toISOString();
        additionalUpdates.resolved_by = operatorId;
        break;
      case 'escalate':
        newStatus = 'investigating';
        break;
      case 'dismiss':
        newStatus = 'resolved';
        additionalUpdates.resolved_at = new Date().toISOString();
        additionalUpdates.resolved_by = operatorId;
        break;
      case 'contact_user':
        newStatus = 'investigating';
        break;
      default:
        return failure(400, operatorErrorCodes.INVALID_ADMIN_ACTION, 'Invalid administrative action');
    }

    // Update the report
    const updateData = {
      status: newStatus,
      ...additionalUpdates
    };

    const { data: updatedReport, error: updateError } = await supabase
      .from(REPORTS_TABLE)
      .update(updateData)
      .eq('id', reportId)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to take report action', updateError.message);
      return failure(500, additionalOperatorErrorCodes.REPORT_ACTION_ERROR, updateError.message);
    }

    // Log the action
    await logAdminActionService(deps, {
      user_id: operatorId,
      action: `REPORT_${action.toUpperCase()}`,
      target_type: 'report',
      target_id: reportId,
      details: {
        action,
        notes,
        previous_status: currentReport.status,
        new_status: newStatus
      }
    });

    // Transform data to match interface
    const report: Report = {
      id: updatedReport.id,
      reporter_id: updatedReport.reporter_id,
      target_type: updatedReport.target_type,
      target_id: updatedReport.target_id,
      reason: updatedReport.reason,
      content: updatedReport.content,
      status: updatedReport.status as ReportStatus,
      resolved_at: updatedReport.resolved_at,
      resolved_by: updatedReport.resolved_by,
      created_at: updatedReport.created_at,
    };

    return success(report);
  } catch (error) {
    logger.error('Error taking report action', error);
    return failure(500, additionalOperatorErrorCodes.REPORT_ACTION_ERROR, error instanceof Error ? error.message : 'Unknown error');
  }
};

// Get metadata service
export type GetMetadataOptions = {
  type: 'categories' | 'difficulties';
  isActive?: boolean;
};

export const getMetadataService = async (
  deps: OperatorServiceDependencies,
  options: GetMetadataOptions
): Promise<HandlerResult<Category[] | Difficulty[], typeof operatorErrorCodes[keyof typeof operatorErrorCodes], unknown>> => {
  const { supabase, logger } = deps;
  const { type, isActive } = options;

  try {
    let query;
    if (type === 'categories') {
      query = supabase.from(CATEGORIES_TABLE).select('*');
    } else {
      query = supabase.from(DIFFICULTIES_TABLE).select('*');
    }

    // Apply is_active filter if specified
    if (typeof isActive === 'boolean') {
      query = query.eq('is_active', isActive);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      logger.error(`Failed to fetch ${type}`, error.message);
      return failure(500, additionalOperatorErrorCodes.METADATA_FETCH_ERROR, error.message);
    }

    if (type === 'categories') {
      return success(data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || undefined,
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at,
      } as Category)));
    } else {
      return success(data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || undefined,
        sort_order: item.sort_order,
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at,
      } as Difficulty)));
    }
  } catch (error) {
    logger.error(`Error fetching ${type}`, error);
    return failure(500, additionalOperatorErrorCodes.METADATA_FETCH_ERROR, error instanceof Error ? error.message : 'Unknown error');
  }
};

// Create metadata service
export type CreateMetadataOptions = {
  type: 'categories' | 'difficulties';
  name: string;
  description?: string;
  sort_order?: number;
};

export const createMetadataService = async (
  deps: OperatorServiceDependencies,
  options: CreateMetadataOptions
): Promise<HandlerResult<Category | Difficulty, typeof operatorErrorCodes[keyof typeof operatorErrorCodes], unknown>> => {
  const { supabase, logger } = deps;
  const { type, name, description, sort_order } = options;

  try {
    // Check if name already exists (case-insensitive)
    let query;
    if (type === 'categories') {
      query = supabase.from(CATEGORIES_TABLE).select('id').ilike('name', name);
    } else {
      query = supabase.from(DIFFICULTIES_TABLE).select('id').ilike('name', name);
    }

    const { data: existing, error: checkError } = await query;

    if (checkError) {
      logger.error(`Failed to check existing ${type}`, checkError.message);
      return failure(500, additionalOperatorErrorCodes.METADATA_CHECK_ERROR, checkError.message);
    }

    if (existing && existing.length > 0) {
      logger.info(`${type} with name already exists`, { name });
      return failure(409, additionalOperatorErrorCodes.METADATA_DUPLICATE, `${type === 'categories' ? 'Category' : 'Difficulty'} with this name already exists`);
    }

    // Insert the new metadata
    let insertData: any = {
      name,
      is_active: true, // New metadata is always active
      description: description || null,
    };

    if (type === 'difficulties') {
      insertData.sort_order = sort_order || 0;
    }

    let result;
    if (type === 'categories') {
      result = await supabase.from(CATEGORIES_TABLE).insert([insertData]).select().single();
    } else {
      result = await supabase.from(DIFFICULTIES_TABLE).insert([insertData]).select().single();
    }

    if (result.error) {
      logger.error(`Failed to create ${type}`, result.error.message);
      return failure(500, additionalOperatorErrorCodes.METADATA_CREATION_ERROR, result.error.message);
    }

    // Log the action
    await logAdminActionService(deps, {
      user_id: 'system', // System action for creation
      action: `CREATE_${type.toUpperCase().slice(0, -1)}`, // Remove 'ies' and add 'y' or just remove 's'
      target_type: type === 'categories' ? 'category' : 'difficulty',
      target_id: result.data.id.toString(),
      details: { name }
    });

    if (type === 'categories') {
      return success({
        id: result.data.id,
        name: result.data.name,
        description: result.data.description || undefined,
        is_active: result.data.is_active,
        created_at: result.data.created_at,
        updated_at: result.data.updated_at,
      } as Category);
    } else {
      return success({
        id: result.data.id,
        name: result.data.name,
        description: result.data.description || undefined,
        sort_order: result.data.sort_order,
        is_active: result.data.is_active,
        created_at: result.data.created_at,
        updated_at: result.data.updated_at,
      } as Difficulty);
    }
  } catch (error) {
    logger.error(`Error creating ${type}`, error);
    return failure(500, additionalOperatorErrorCodes.METADATA_CREATION_ERROR, error instanceof Error ? error.message : 'Unknown error');
  }
};

// Update metadata service
export type UpdateMetadataOptions = {
  type: 'categories' | 'difficulties';
  id: number;
  name?: string;
  description?: string;
  sort_order?: number;
};

export const updateMetadataService = async (
  deps: OperatorServiceDependencies,
  options: UpdateMetadataOptions
): Promise<HandlerResult<Category | Difficulty, typeof operatorErrorCodes[keyof typeof operatorErrorCodes], unknown>> => {
  const { supabase, logger } = deps;
  const { type, id, name, description, sort_order } = options;

  try {
    // Check if metadata exists
    let query;
    if (type === 'categories') {
      query = supabase.from(CATEGORIES_TABLE).select('*').eq('id', id).single();
    } else {
      query = supabase.from(DIFFICULTIES_TABLE).select('*').eq('id', id).single();
    }

    const { data: existing, error: fetchError } = await query;

    if (fetchError) {
      logger.error(`Failed to fetch ${type} for update`, fetchError.message);
      return failure(404, additionalOperatorErrorCodes.METADATA_NOT_FOUND, `${type === 'categories' ? 'Category' : 'Difficulty'} not found`);
    }

    // Check if name already exists for a different record (case-insensitive)
    if (name) {
      let checkQuery;
      if (type === 'categories') {
        checkQuery = supabase.from(CATEGORIES_TABLE).select('id').ilike('name', name).neq('id', id);
      } else {
        checkQuery = supabase.from(DIFFICULTIES_TABLE).select('id').ilike('name', name).neq('id', id);
      }

      const { data: existingName, error: checkError } = await checkQuery;

      if (checkError) {
        logger.error(`Failed to check existing ${type} name`, checkError.message);
        return failure(500, additionalOperatorErrorCodes.METADATA_CHECK_ERROR, checkError.message);
      }

      if (existingName && existingName.length > 0) {
        logger.info(`${type} with name already exists`, { name });
        return failure(409, additionalOperatorErrorCodes.METADATA_DUPLICATE, `${type === 'categories' ? 'Category' : 'Difficulty'} with this name already exists`);
      }
    }

    // Prepare update data
    let updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (sort_order !== undefined && type === 'difficulties') updateData.sort_order = sort_order;

    // Update the metadata
    let result;
    if (type === 'categories') {
      result = await supabase.from(CATEGORIES_TABLE).update(updateData).eq('id', id).select().single();
    } else {
      result = await supabase.from(DIFFICULTIES_TABLE).update(updateData).eq('id', id).select().single();
    }

    if (result.error) {
      logger.error(`Failed to update ${type}`, result.error.message);
      return failure(500, additionalOperatorErrorCodes.METADATA_UPDATE_ERROR, result.error.message);
    }

    // Log the action
    await logAdminActionService(deps, {
      user_id: 'system', // System action for update
      action: `UPDATE_${type.toUpperCase().slice(0, -1)}`, // Remove 'ies' and add 'y' or just remove 's'
      target_type: type === 'categories' ? 'category' : 'difficulty',
      target_id: id.toString(),
      details: { 
        name: result.data.name,
        changes: {
          name: name ? { from: existing.name, to: name } : undefined,
          description: description !== undefined ? { from: existing.description, to: description } : undefined,
          sort_order: sort_order !== undefined ? { from: existing.sort_order, to: sort_order } : undefined,
        }
      }
    });

    if (type === 'categories') {
      return success({
        id: result.data.id,
        name: result.data.name,
        description: result.data.description || undefined,
        is_active: result.data.is_active,
        created_at: result.data.created_at,
        updated_at: result.data.updated_at,
      } as Category);
    } else {
      return success({
        id: result.data.id,
        name: result.data.name,
        description: result.data.description || undefined,
        sort_order: result.data.sort_order,
        is_active: result.data.is_active,
        created_at: result.data.created_at,
        updated_at: result.data.updated_at,
      } as Difficulty);
    }
  } catch (error) {
    logger.error(`Error updating ${type}`, error);
    return failure(500, additionalOperatorErrorCodes.METADATA_UPDATE_ERROR, error instanceof Error ? error.message : 'Unknown error');
  }
};

// Deactivate metadata service
export type DeactivateMetadataOptions = {
  type: 'categories' | 'difficulties';
  id: number;
};

export const deactivateMetadataService = async (
  deps: OperatorServiceDependencies,
  options: DeactivateMetadataOptions
): Promise<HandlerResult<Category | Difficulty, typeof operatorErrorCodes[keyof typeof operatorErrorCodes], unknown>> => {
  const { supabase, logger } = deps;
  const { type, id } = options;

  try {
    // Check if metadata exists
    let query;
    if (type === 'categories') {
      query = supabase.from(CATEGORIES_TABLE).select('*').eq('id', id).single();
    } else {
      query = supabase.from(DIFFICULTIES_TABLE).select('*').eq('id', id).single();
    }

    const { data: existing, error: fetchError } = await query;

    if (fetchError) {
      logger.error(`Failed to fetch ${type} for deactivation`, fetchError.message);
      return failure(404, additionalOperatorErrorCodes.METADATA_NOT_FOUND, `${type === 'categories' ? 'Category' : 'Difficulty'} not found`);
    }

    // Check if metadata is already inactive
    if (!existing.is_active) {
      return success(existing as Category | Difficulty);
    }

    // Check if metadata is in use
    const inUse = await checkIfMetadataIsInUse(deps, type, id);
    if (inUse) {
      logger.info(`${type} is in use and cannot be deactivated`, { id });
      return failure(400, operatorErrorCodes.METADATA_IN_USE, `${type === 'categories' ? 'Category' : 'Difficulty'} is currently in use and cannot be deactivated`);
    }

    // Deactivate the metadata
    let result;
    if (type === 'categories') {
      result = await supabase.from(CATEGORIES_TABLE).update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    } else {
      result = await supabase.from(DIFFICULTIES_TABLE).update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    }

    if (result.error) {
      logger.error(`Failed to deactivate ${type}`, result.error.message);
      return failure(500, additionalOperatorErrorCodes.METADATA_DEACTIVATION_ERROR, result.error.message);
    }

    // Log the action
    await logAdminActionService(deps, {
      user_id: 'system', // System action for deactivation
      action: `DEACTIVATE_${type.toUpperCase().slice(0, -1)}`, // Remove 'ies' and add 'y' or just remove 's'
      target_type: type === 'categories' ? 'category' : 'difficulty',
      target_id: id.toString(),
      details: { name: result.data.name }
    });

    if (type === 'categories') {
      return success({
        id: result.data.id,
        name: result.data.name,
        description: result.data.description || undefined,
        is_active: result.data.is_active,
        created_at: result.data.created_at,
        updated_at: result.data.updated_at,
      } as Category);
    } else {
      return success({
        id: result.data.id,
        name: result.data.name,
        description: result.data.description || undefined,
        sort_order: result.data.sort_order,
        is_active: result.data.is_active,
        created_at: result.data.created_at,
        updated_at: result.data.updated_at,
      } as Difficulty);
    }
  } catch (error) {
    logger.error(`Error deactivating ${type}`, error);
    return failure(500, additionalOperatorErrorCodes.METADATA_DEACTIVATION_ERROR, error instanceof Error ? error.message : 'Unknown error');
  }
};

// Helper function to check if metadata is in use
const checkIfMetadataIsInUse = async (
  deps: OperatorServiceDependencies,
  type: 'categories' | 'difficulties',
  id: number
): Promise<boolean> => {
  const { supabase } = deps;

  // For categories, check if any active courses use this category
  if (type === 'categories') {
    const { data, error } = await supabase
      .from('courses')
      .select('id')
      .eq('category_id', id)
      .is('deleted_at', null) // Only check active courses
      .limit(1);

    if (error) {
      deps.logger.error('Failed to check if category is in use', error.message);
      // In case of error, assume it's in use to be safe
      return true;
    }

    return data && data.length > 0;
  }

  // For difficulties, check if any active courses use this difficulty
  if (type === 'difficulties') {
    const { data, error } = await supabase
      .from('courses')
      .select('id')
      .eq('difficulty_id', id)
      .is('deleted_at', null) // Only check active courses
      .limit(1);

    if (error) {
      deps.logger.error('Failed to check if difficulty is in use', error.message);
      // In case of error, assume it's in use to be safe
      return true;
    }

    return data && data.length > 0;
  }

  return false;
};

// Log admin action service
export type LogAdminActionOptions = {
  user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details?: Record<string, any>;
};

export const logAdminActionService = async (
  deps: OperatorServiceDependencies,
  options: LogAdminActionOptions
): Promise<void> => {
  const { supabase, logger } = deps;
  const { user_id, action, target_type, target_id, details } = options;

  try {
    const { error } = await supabase
      .from(AUDIT_LOG_TABLE)
      .insert([
        {
          user_id,
          action,
          target_type,
          target_id,
          details: details || {},
          created_at: new Date().toISOString(),
        }
      ]);

    if (error) {
      logger.error('Failed to log admin action', error.message);
      // Don't throw an error as this shouldn't break the main operation
    }
  } catch (error) {
    logger.error('Error logging admin action', error);
    // Don't throw an error as this shouldn't break the main operation
  }
};

import { operatorErrorCodes } from './error';// Additional error codes not in the main error file
export const additionalOperatorErrorCodes = {
  REPORTS_FETCH_ERROR: 'REPORTS_FETCH_ERROR',
  REPORT_FETCH_ERROR: 'REPORT_FETCH_ERROR',
  REPORT_STATUS_UPDATE_ERROR: 'REPORT_STATUS_UPDATE_ERROR',
  REPORT_ACTION_ERROR: 'REPORT_ACTION_ERROR',
  METADATA_FETCH_ERROR: 'METADATA_FETCH_ERROR',
  METADATA_CREATION_ERROR: 'METADATA_CREATION_ERROR',
  METADATA_UPDATE_ERROR: 'METADATA_UPDATE_ERROR',
  METADATA_DEACTIVATION_ERROR: 'METADATA_DEACTIVATION_ERROR',
  METADATA_CHECK_ERROR: 'METADATA_CHECK_ERROR',
  METADATA_DUPLICATE: 'METADATA_DUPLICATE',
  METADATA_NOT_FOUND: 'METADATA_NOT_FOUND',
} as const;

// Combine all error codes
export const allOperatorErrorCodes = {
  ...operatorErrorCodes,
  ...additionalOperatorErrorCodes,
} as const;

