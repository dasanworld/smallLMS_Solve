import { z } from 'zod';
import { paginationSchema, type PaginationParams } from '../validation';

// Define pagination response type
export type PaginationMeta = {
  total: number;
  limit: number;
  offset: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type PaginatedData<T> = {
  items: T[];
  pagination: PaginationMeta;
};

/**
 * Creates pagination metadata based on total items, limit, and offset
 */
export const createPaginationMeta = (
  total: number,
  limit: number,
  offset: number,
): PaginationMeta => {
  const hasNext = offset + limit < total;
  const hasPrev = offset > 0;

  return {
    total,
    limit,
    offset,
    hasNext,
    hasPrev,
  };
};

/**
 * Creates a paginated response object
 */
export const createPaginationResponse = <T>(
  items: T[],
  total: number,
  limit: number,
  offset: number,
): PaginatedData<T> => {
  return {
    items,
    pagination: createPaginationMeta(total, limit, offset),
  };
};

/**
 * Parses pagination parameters from request with defaults
 */
export const parsePaginationParams = (params: Partial<PaginationParams>): PaginationParams => {
  const validated = paginationSchema.safeParse(params);

  if (!validated.success) {
    // Return defaults if validation fails
    return {
      limit: 20,
      offset: 0,
      sort: undefined,
      order: 'desc',
    };
  }

  return validated.data;
};

/**
 * Builds a database query with pagination parameters
 * This is a generic function that can be adapted for different databases
 */
export const applyPaginationToQuery = <T>(
  query: any, // This would be specific to your database client (e.g., Supabase, Prisma)
  pagination: PaginationParams,
  tableName: string = 'items'
) => {
  // Apply ordering
  if (pagination.sort) {
    query = query.order(pagination.sort, { ascending: pagination.order === 'asc' });
  } else {
    // Default ordering by created_at if available, otherwise by id
    query = query.order('created_at', { ascending: false });
  }

  // Apply pagination
  query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);

  return query;
};

/**
 * Calculates pagination offsets for a given page number
 */
export const calculateOffset = (page: number, limit: number): number => {
  if (page < 1) {
    return 0;
  }
  return (page - 1) * limit;
};

/**
 * Gets pagination info for a specific page
 */
export const getPageInfo = (
  total: number,
  currentPage: number,
  limit: number,
): PaginationMeta => {
  const offset = calculateOffset(currentPage, limit);
  return createPaginationMeta(total, limit, offset);
};

/**
 * Validates pagination parameters
 */
export const validatePagination = (params: Partial<PaginationParams>) => {
  return paginationSchema.safeParse(params);
};
