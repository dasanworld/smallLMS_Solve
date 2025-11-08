import { describe, it, expect, beforeEach, vi, MockedFunction } from 'vitest';
import { getReportsService, getReportByIdService, updateReportStatusService, takeReportActionService, getMetadataService, createMetadataService, updateMetadataService, deactivateMetadataService } from './service';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getLogger } from '@/backend/hono/context';

// Mock dependencies
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
} as unknown as MockedFunction<() => SupabaseClient>;

const mockLogger = {
  error: vi.fn(),
  info: vi.fn(),
} as unknown as ReturnType<typeof getLogger>;

const deps = {
  supabase: mockSupabase,
  logger: mockLogger,
};

describe('Operator Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getReportsService', () => {
    it('should fetch reports with filters', async () => {
      const mockData = [
        {
          id: '1',
          reporter_id: 'user1',
          target_type: 'course',
          target_id: 'course1',
          reason: 'inappropriate_content',
          content: 'This course contains inappropriate content.',
          status: 'received',
          created_at: new Date().toISOString(),
        }
      ];
      
      const mockResult = {
        data: mockData,
        error: null,
        count: 1,
      };
      
      (mockSupabase.from as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.select as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.eq as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.range as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.order as MockedFunction<any>).mockReturnValueOnce(mockResult);

      const result = await getReportsService(deps, { type: 'course', status: 'received', page: 1, limit: 10 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.reports).toHaveLength(1);
        expect(result.data.total).toBe(1);
      }
    });

    it('should handle errors when fetching reports', async () => {
      const mockResult = {
        data: null,
        error: { message: 'Database error' },
        count: null,
      };
      
      (mockSupabase.from as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.select as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.eq as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.range as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.order as MockedFunction<any>).mockReturnValueOnce(mockResult);

      const result = await getReportsService(deps, { type: 'course', status: 'received', page: 1, limit: 10 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('REPORTS_FETCH_ERROR');
      }
    });
  });

  describe('getReportByIdService', () => {
    it('should fetch a report by ID', async () => {
      const mockReport = {
        id: '1',
        reporter_id: 'user1',
        target_type: 'course',
        target_id: 'course1',
        reason: 'inappropriate_content',
        content: 'This course contains inappropriate content.',
        status: 'received',
        created_at: new Date().toISOString(),
      };
      
      const mockResult = {
        data: mockReport,
        error: null,
      };
      
      (mockSupabase.from as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.select as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.eq as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.single as MockedFunction<any>).mockReturnValueOnce(mockResult);

      const result = await getReportByIdService(deps, '1');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.id).toBe('1');
      }
    });

    it('should return error if report not found', async () => {
      const mockResult = {
        data: null,
        error: { message: 'Report not found' },
      };
      
      (mockSupabase.from as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.select as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.eq as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.single as MockedFunction<any>).mockReturnValueOnce(mockResult);

      const result = await getReportByIdService(deps, 'nonexistent-id');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('REPORT_NOT_FOUND');
      }
    });
  });

  describe('updateReportStatusService', () => {
    it('should update report status', async () => {
      const mockCurrentReport = {
        id: '1',
        reporter_id: 'user1',
        target_type: 'course',
        target_id: 'course1',
        reason: 'inappropriate_content',
        content: 'This course contains inappropriate content.',
        status: 'received',
        created_at: new Date().toISOString(),
      };
      
      const mockUpdatedReport = {
        ...mockCurrentReport,
        status: 'investigating',
      };
      
      const mockResult = {
        data: mockUpdatedReport,
        error: null,
      };
      
      // First call for fetching current report
      (mockSupabase.from as MockedFunction<any>).mockReturnValueOnce({
        data: mockCurrentReport,
        error: null,
      });
      (mockSupabase.select as MockedFunction<any>).mockReturnValueOnce({
        data: mockCurrentReport,
        error: null,
      });
      (mockSupabase.eq as MockedFunction<any>).mockReturnValueOnce({
        data: mockCurrentReport,
        error: null,
      });
      (mockSupabase.single as MockedFunction<any>).mockReturnValueOnce({
        data: mockCurrentReport,
        error: null,
      });
      
      // Second call for updating report
      (mockSupabase.from as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.update as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.eq as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.select as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.single as MockedFunction<any>).mockReturnValueOnce(mockResult);

      const result = await updateReportStatusService(deps, {
        reportId: '1',
        newStatus: 'investigating',
        operatorId: 'operator1',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.status).toBe('investigating');
      }
    });

    it('should reject invalid status transitions', async () => {
      const mockCurrentReport = {
        id: '1',
        reporter_id: 'user1',
        target_type: 'course',
        target_id: 'course1',
        reason: 'inappropriate_content',
        content: 'This course contains inappropriate content.',
        status: 'resolved',
        created_at: new Date().toISOString(),
      };
      
      const mockResult = {
        data: mockCurrentReport,
        error: null,
      };
      
      (mockSupabase.from as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.select as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.eq as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.single as MockedFunction<any>).mockReturnValueOnce(mockResult);

      const result = await updateReportStatusService(deps, {
        reportId: '1',
        newStatus: 'invalid_status' as any,
        operatorId: 'operator1',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_REPORT_STATUS_TRANSITION');
      }
    });
  });

  describe('takeReportActionService', () => {
    it('should take a report action', async () => {
      const mockCurrentReport = {
        id: '1',
        reporter_id: 'user1',
        target_type: 'course',
        target_id: 'course1',
        reason: 'inappropriate_content',
        content: 'This course contains inappropriate content.',
        status: 'received',
        created_at: new Date().toISOString(),
      };
      
      const mockUpdatedReport = {
        ...mockCurrentReport,
        status: 'resolved',
      };
      
      const mockResult = {
        data: mockUpdatedReport,
        error: null,
      };
      
      // First call for fetching current report
      (mockSupabase.from as MockedFunction<any>).mockReturnValueOnce({
        data: mockCurrentReport,
        error: null,
      });
      (mockSupabase.select as MockedFunction<any>).mockReturnValueOnce({
        data: mockCurrentReport,
        error: null,
      });
      (mockSupabase.eq as MockedFunction<any>).mockReturnValueOnce({
        data: mockCurrentReport,
        error: null,
      });
      (mockSupabase.single as MockedFunction<any>).mockReturnValueOnce({
        data: mockCurrentReport,
        error: null,
      });
      
      // Second call for updating report
      (mockSupabase.from as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.update as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.eq as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.select as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.single as MockedFunction<any>).mockReturnValueOnce(mockResult);

      const result = await takeReportActionService(deps, {
        reportId: '1',
        action: 'resolve',
        operatorId: 'operator1',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.status).toBe('resolved');
      }
    });

    it('should return error for invalid action', async () => {
      const mockCurrentReport = {
        id: '1',
        reporter_id: 'user1',
        target_type: 'course',
        target_id: 'course1',
        reason: 'inappropriate_content',
        content: 'This course contains inappropriate content.',
        status: 'received',
        created_at: new Date().toISOString(),
      };
      
      const mockResult = {
        data: mockCurrentReport,
        error: null,
      };
      
      (mockSupabase.from as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.select as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.eq as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.single as MockedFunction<any>).mockReturnValueOnce(mockResult);

      const result = await takeReportActionService(deps, {
        reportId: '1',
        action: 'invalid_action' as any,
        operatorId: 'operator1',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_ADMIN_ACTION');
      }
    });
  });

  describe('getMetadataService', () => {
    it('should fetch categories', async () => {
      const mockCategories = [
        {
          id: 1,
          name: 'Programming',
          description: 'Programming related courses',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
      
      const mockResult = {
        data: mockCategories,
        error: null,
      };
      
      (mockSupabase.from as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.select as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.order as MockedFunction<any>).mockReturnValueOnce(mockResult);

      const result = await getMetadataService(deps, { type: 'categories', isActive: true });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toHaveLength(1);
        expect((result.data as any[])[0].name).toBe('Programming');
      }
    });

    it('should fetch difficulties', async () => {
      const mockDifficulties = [
        {
          id: 1,
          name: 'Beginner',
          description: 'For beginners',
          sort_order: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
      
      const mockResult = {
        data: mockDifficulties,
        error: null,
      };
      
      (mockSupabase.from as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.select as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.order as MockedFunction<any>).mockReturnValueOnce(mockResult);

      const result = await getMetadataService(deps, { type: 'difficulties', isActive: true });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toHaveLength(1);
        expect((result.data as any[])[0].name).toBe('Beginner');
      }
    });
  });

  describe('createMetadataService', () => {
    it('should create a new category', async () => {
      const newCategory = {
        id: 1,
        name: 'New Category',
        description: 'A new category',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const mockResult = {
        data: newCategory,
        error: null,
      };
      
      // First call to check if name already exists
      (mockSupabase.from as MockedFunction<any>).mockReturnValueOnce({
        data: [],
        error: null,
      });
      (mockSupabase.select as MockedFunction<any>).mockReturnValueOnce({
        data: [],
        error: null,
      });
      (mockSupabase.ilike as MockedFunction<any>).mockReturnValueOnce({
        data: [],
        error: null,
      });
      
      // Second call for insertion
      (mockSupabase.from as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.insert as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.select as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.single as MockedFunction<any>).mockReturnValueOnce(mockResult);

      const result = await createMetadataService(deps, {
        type: 'categories',
        name: 'New Category',
        description: 'A new category',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.name).toBe('New Category');
      }
    });

    it('should create a new difficulty', async () => {
      const newDifficulty = {
        id: 1,
        name: 'New Difficulty',
        description: 'A new difficulty',
        sort_order: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const mockResult = {
        data: newDifficulty,
        error: null,
      };
      
      // First call to check if name already exists
      (mockSupabase.from as MockedFunction<any>).mockReturnValueOnce({
        data: [],
        error: null,
      });
      (mockSupabase.select as MockedFunction<any>).mockReturnValueOnce({
        data: [],
        error: null,
      });
      (mockSupabase.ilike as MockedFunction<any>).mockReturnValueOnce({
        data: [],
        error: null,
      });
      
      // Second call for insertion
      (mockSupabase.from as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.insert as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.select as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.single as MockedFunction<any>).mockReturnValueOnce(mockResult);

      const result = await createMetadataService(deps, {
        type: 'difficulties',
        name: 'New Difficulty',
        description: 'A new difficulty',
        sort_order: 0,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.name).toBe('New Difficulty');
      }
    });

    it('should return error if name already exists', async () => {
      const existingCategory = {
        id: 1,
        name: 'Existing Category',
        description: 'An existing category',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const mockResult = {
        data: [existingCategory],
        error: null,
      };
      
      (mockSupabase.from as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.select as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.ilike as MockedFunction<any>).mockReturnValueOnce(mockResult);

      const result = await createMetadataService(deps, {
        type: 'categories',
        name: 'Existing Category',
        description: 'A new category',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('METADATA_DUPLICATE');
      }
    });
  });

  describe('updateMetadataService', () => {
    it('should update a category', async () => {
      const existingCategory = {
        id: 1,
        name: 'Old Category',
        description: 'Old description',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const updatedCategory = {
        id: 1,
        name: 'Updated Category',
        description: 'Updated description',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const mockResult = {
        data: updatedCategory,
        error: null,
      };
      
      // First call to fetch existing category
      (mockSupabase.from as MockedFunction<any>).mockReturnValueOnce({
        data: existingCategory,
        error: null,
      });
      (mockSupabase.select as MockedFunction<any>).mockReturnValueOnce({
        data: existingCategory,
        error: null,
      });
      (mockSupabase.eq as MockedFunction<any>).mockReturnValueOnce({
        data: existingCategory,
        error: null,
      });
      (mockSupabase.single as MockedFunction<any>).mockReturnValueOnce({
        data: existingCategory,
        error: null,
      });
      
      // Second call to check for duplicate name
      (mockSupabase.from as MockedFunction<any>).mockReturnValueOnce({
        data: [],
        error: null,
      });
      (mockSupabase.select as MockedFunction<any>).mockReturnValueOnce({
        data: [],
        error: null,
      });
      (mockSupabase.ilike as MockedFunction<any>).mockReturnValueOnce({
        data: [],
        error: null,
      });
      (mockSupabase.neq as MockedFunction<any>).mockReturnValueOnce({
        data: [],
        error: null,
      });
      
      // Third call for update
      (mockSupabase.from as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.update as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.eq as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.select as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.single as MockedFunction<any>).mockReturnValueOnce(mockResult);

      const result = await updateMetadataService(deps, {
        type: 'categories',
        id: 1,
        name: 'Updated Category',
        description: 'Updated description',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.name).toBe('Updated Category');
      }
    });
  });

  describe('deactivateMetadataService', () => {
    it('should deactivate a category', async () => {
      const existingCategory = {
        id: 1,
        name: 'Category to Deactivate',
        description: 'To be deactivated',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const deactivatedCategory = {
        ...existingCategory,
        is_active: false,
      };
      
      const mockResult = {
        data: deactivatedCategory,
        error: null,
      };
      
      // First call to fetch existing category
      (mockSupabase.from as MockedFunction<any>).mockReturnValueOnce({
        data: existingCategory,
        error: null,
      });
      (mockSupabase.select as MockedFunction<any>).mockReturnValueOnce({
        data: existingCategory,
        error: null,
      });
      (mockSupabase.eq as MockedFunction<any>).mockReturnValueOnce({
        data: existingCategory,
        error: null,
      });
      (mockSupabase.single as MockedFunction<any>).mockReturnValueOnce({
        data: existingCategory,
        error: null,
      });
      
      // Second call to check if category is in use
      (mockSupabase.from as MockedFunction<any>).mockReturnValueOnce({
        data: [],
        error: null,
      });
      (mockSupabase.select as MockedFunction<any>).mockReturnValueOnce({
        data: [],
        error: null,
      });
      (mockSupabase.eq as MockedFunction<any>).mockReturnValueOnce({
        data: [],
        error: null,
      });
      (mockSupabase.is as MockedFunction<any>).mockReturnValueOnce({
        data: [],
        error: null,
      });
      (mockSupabase.limit as MockedFunction<any>).mockReturnValueOnce({
        data: [],
        error: null,
      });
      
      // Third call for deactivation
      (mockSupabase.from as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.update as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.eq as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.select as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.single as MockedFunction<any>).mockReturnValueOnce(mockResult);

      const result = await deactivateMetadataService(deps, {
        type: 'categories',
        id: 1,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.is_active).toBe(false);
      }
    });

    it('should return error if metadata is in use', async () => {
      const existingCategory = {
        id: 1,
        name: 'Category to Deactivate',
        description: 'To be deactivated',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const mockResult = {
        data: existingCategory,
        error: null,
      };
      
      // First call to fetch existing category
      (mockSupabase.from as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.select as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.eq as MockedFunction<any>).mockReturnValueOnce(mockResult);
      (mockSupabase.single as MockedFunction<any>).mockReturnValueOnce(mockResult);
      
      // Second call to check if category is in use - return data showing it's in use
      (mockSupabase.from as MockedFunction<any>).mockReturnValueOnce({
        data: [{ id: 'course1' }],
        error: null,
      });
      (mockSupabase.select as MockedFunction<any>).mockReturnValueOnce({
        data: [{ id: 'course1' }],
        error: null,
      });
      (mockSupabase.eq as MockedFunction<any>).mockReturnValueOnce({
        data: [{ id: 'course1' }],
        error: null,
      });
      (mockSupabase.is as MockedFunction<any>).mockReturnValueOnce({
        data: [{ id: 'course1' }],
        error: null,
      });
      (mockSupabase.limit as MockedFunction<any>).mockReturnValueOnce({
        data: [{ id: 'course1' }],
        error: null,
      });

      const result = await deactivateMetadataService(deps, {
        type: 'categories',
        id: 1,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('METADATA_IN_USE');
      }
    });
  });
});