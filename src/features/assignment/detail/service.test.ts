import { describe, it, expect, beforeEach, vi, Mocked } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';
import { 
  getAssignmentDetailService, 
  submitAssignmentService,
  isAssignmentOpen,
  isAssignmentSubmitted
} from '../backend/service';
import { AssignmentDetailError } from '../backend/error';

// Mock the Supabase client
vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn(),
  };
});

describe('Assignment Detail Service', () => {
  let mockSupabase: Mocked<SupabaseClient<any>>;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Create a mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    } as unknown as Mocked<SupabaseClient<any>>;
  });

  describe('getAssignmentDetailService', () => {
    it('should fetch assignment details successfully', async () => {
      const mockAssignmentData = {
        id: '1',
        title: 'Test Assignment',
        description: 'Test Description',
        deadline: new Date().toISOString(),
        score_weight: 20,
        submission_policy: {
          allow_text_submission: true,
          allow_link_submission: false,
          allow_file_submission: false,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        course_id: 'course-1',
        courses: {
          title: 'Test Course'
        }
      };

      const mockSubmissionData = {
        id: 'sub-1',
        content: 'Test content',
        link: null,
        status: 'submitted',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Mock the Supabase calls
      (mockSupabase.from as Mocked<any>)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockAssignmentData, error: null })
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockSubmissionData, error: null })
        });

      const result = await getAssignmentDetailService(
        mockSupabase,
        'assignment-1',
        'user-1'
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
      expect(result.title).toBe('Test Assignment');
      expect(result.is_submitted).toBe(true);
    });

    it('should throw AssignmentDetailError if assignment is not found', async () => {
      (mockSupabase.from as Mocked<any>)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
        });

      await expect(
        getAssignmentDetailService(mockSupabase, 'assignment-1', 'user-1')
      ).rejects.toThrow(AssignmentDetailError);
    });
  });

  describe('submitAssignmentService', () => {
    it('should submit assignment successfully', async () => {
      const mockAssignmentData = {
        id: '1',
        deadline: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        submission_policy: {
          allow_text_submission: true,
          allow_link_submission: false,
          allow_file_submission: false,
        }
      };

      const mockSubmissionResult = {
        id: 'new-submission-id'
      };

      // Mock the Supabase calls
      (mockSupabase.from as Mocked<any>)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockAssignmentData, error: null })
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }) // No existing submission
        })
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockSubmissionResult, error: null })
        });

      const result = await submitAssignmentService(
        mockSupabase,
        'assignment-1',
        'user-1',
        { content: 'Test submission content' }
      );

      expect(result).toBeDefined();
      expect(result.submission_id).toBe('new-submission-id');
    });

    it('should throw error if assignment deadline has passed', async () => {
      const mockAssignmentData = {
        id: '1',
        deadline: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        submission_policy: {
          allow_text_submission: true,
          allow_link_submission: false,
          allow_file_submission: false,
        }
      };

      (mockSupabase.from as Mocked<any>)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockAssignmentData, error: null })
        });

      await expect(
        submitAssignmentService(
          mockSupabase,
          'assignment-1',
          'user-1',
          { content: 'Test submission content' }
        )
      ).rejects.toThrow(AssignmentDetailError);
    });

    it('should update existing submission if one exists', async () => {
      const mockAssignmentData = {
        id: '1',
        deadline: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        submission_policy: {
          allow_text_submission: true,
          allow_link_submission: false,
          allow_file_submission: false,
        }
      };

      const mockExistingSubmission = {
        id: 'existing-submission-id'
      };

      // Mock the Supabase calls
      (mockSupabase.from as Mocked<any>)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockAssignmentData, error: null })
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockExistingSubmission, error: null })
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        });

      const result = await submitAssignmentService(
        mockSupabase,
        'assignment-1',
        'user-1',
        { content: 'Updated submission content' }
      );

      expect(result).toBeDefined();
      expect(result.submission_id).toBe('existing-submission-id');
    });
  });

  describe('isAssignmentOpen', () => {
    it('should return true if deadline is in the future', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString(); // Tomorrow
      expect(isAssignmentOpen(futureDate)).toBe(true);
    });

    it('should return false if deadline is in the past', () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString(); // Yesterday
      expect(isAssignmentOpen(pastDate)).toBe(false);
    });
  });

  describe('isAssignmentSubmitted', () => {
    it('should return true if submission id exists', () => {
      expect(isAssignmentSubmitted('some-id')).toBe(true);
    });

    it('should return false if submission id is null', () => {
      expect(isAssignmentSubmitted(null)).toBe(false);
    });
  });
});