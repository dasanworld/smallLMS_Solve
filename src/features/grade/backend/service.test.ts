import { describe, it, expect, beforeEach, vi, MockedFunction } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';
import { gradeSubmissionService, getSubmissionForGradingService, getAssignmentSubmissionsService } from '@/features/grade/backend/service';
import { gradeErrorCodes } from '@/features/grade/backend/error';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
} as unknown as SupabaseClient;

describe('Grade Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('gradeSubmissionService', () => {
    it('should successfully grade a submission', async () => {
      // Mock data
      const mockSubmission = {
        id: 'sub-123',
        assignment_id: 'assign-123',
        user_id: 'user-123',
        content: 'Test submission content',
        link: null,
        submitted_at: '2023-01-01T00:00:00Z',
        is_late: false,
        score: null,
        feedback: null,
        status: 'submitted',
        assignments: {
          course_id: 'course-123',
          courses: { instructor_id: 'instructor-123' }
        }
      };

      const mockUser = { name: 'John Doe' };
      const mockAssignment = { title: 'Test Assignment' };
      const mockCourse = { title: 'Test Course' };
      const mockUpdatedSubmission = {
        id: 'sub-123',
        assignment_id: 'assign-123',
        user_id: 'user-123',
        content: 'Test submission content',
        link: null,
        submitted_at: '2023-01-01T00:00:00Z',
        is_late: false,
        score: 95,
        feedback: 'Great work!',
        status: 'graded',
        graded_at: '2023-01-02T00:00:00Z'
      };

      // Setup mock chain
      (mockSupabase.from as MockedFunction<any>)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockSubmission, error: null })
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockUser, error: null })
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockAssignment, error: null })
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockCourse, error: null })
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockUpdatedSubmission, error: null })
        });

      const result = await gradeSubmissionService(
        mockSupabase,
        'instructor-123',
        'sub-123',
        95,
        'Great work!',
        'grade'
      );

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.score).toBe(95);
        expect(result.value.feedback).toBe('Great work!');
        expect(result.value.status).toBe('graded');
      }
    });

    it('should return error for invalid score range', async () => {
      const result = await gradeSubmissionService(
        mockSupabase,
        'instructor-123',
        'sub-123',
        150, // Invalid score
        'Feedback',
        'grade'
      );

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error.code).toBe(gradeErrorCodes.INVALID_SCORE_RANGE);
      }
    });

    it('should return error for missing feedback when grading', async () => {
      const result = await gradeSubmissionService(
        mockSupabase,
        'instructor-123',
        'sub-123',
        85,
        '', // Empty feedback
        'grade'
      );

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error.code).toBe(gradeErrorCodes.MISSING_FEEDBACK);
      }
    });

    it('should return error for insufficient permissions', async () => {
      const mockSubmission = {
        id: 'sub-123',
        assignments: {
          course_id: 'course-123',
          courses: { instructor_id: 'different-instructor' } // Different instructor
        }
      };

      (mockSupabase.from as MockedFunction<any>)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockSubmission, error: null })
        });

      const result = await gradeSubmissionService(
        mockSupabase,
        'instructor-123',
        'sub-123',
        85,
        'Feedback',
        'grade'
      );

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error.code).toBe(gradeErrorCodes.INSUFFICIENT_PERMISSIONS);
      }
    });
  });

  describe('getSubmissionForGradingService', () => {
    it('should successfully retrieve submission for grading', async () => {
      const mockSubmission = {
        id: 'sub-123',
        assignment_id: 'assign-123',
        user_id: 'user-123',
        content: 'Test submission content',
        link: null,
        submitted_at: '2023-01-01T00:00:00Z',
        is_late: false,
        score: null,
        feedback: null,
        status: 'submitted',
        assignments: {
          title: 'Test Assignment',
          course_id: 'course-123',
          courses: { 
            title: 'Test Course',
            instructor_id: 'instructor-123' 
          }
        }
      };

      const mockUser = { name: 'John Doe' };

      (mockSupabase.from as MockedFunction<any>)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockSubmission, error: null })
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockUser, error: null })
        });

      const result = await getSubmissionForGradingService(
        mockSupabase,
        'instructor-123',
        'sub-123'
      );

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.id).toBe('sub-123');
        expect(result.value.user_name).toBe('John Doe');
      }
    });

    it('should return error for insufficient permissions', async () => {
      const mockSubmission = {
        id: 'sub-123',
        assignments: {
          course_id: 'course-123',
          courses: { instructor_id: 'different-instructor' }
        }
      };

      (mockSupabase.from as MockedFunction<any>)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockSubmission, error: null })
        });

      const result = await getSubmissionForGradingService(
        mockSupabase,
        'instructor-123',
        'sub-123'
      );

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error.code).toBe(gradeErrorCodes.INSUFFICIENT_PERMISSIONS);
      }
    });
  });

  describe('getAssignmentSubmissionsService', () => {
    it('should successfully retrieve assignment submissions', async () => {
      const mockAssignment = {
        id: 'assign-123',
        title: 'Test Assignment',
        course_id: 'course-123',
        courses: { 
          title: 'Test Course',
          instructor_id: 'instructor-123' 
        }
      };

      const mockSubmissions = [
        {
          id: 'sub-123',
          assignment_id: 'assign-123',
          user_id: 'user-123',
          content: 'Test submission content',
          link: null,
          submitted_at: '2023-01-01T00:00:00Z',
          is_late: false,
          score: null,
          feedback: null,
          status: 'submitted'
        }
      ];

      const mockUsers = [
        { id: 'user-123', name: 'John Doe' }
      ];

      (mockSupabase.from as MockedFunction<any>)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockAssignment, error: null })
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockSubmissions, error: null })
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockUsers, error: null })
        });

      const result = await getAssignmentSubmissionsService(
        mockSupabase,
        'instructor-123',
        'assign-123'
      );

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.length).toBe(1);
        expect(result.value[0].user_name).toBe('John Doe');
      }
    });

    it('should return error for insufficient permissions', async () => {
      const mockAssignment = {
        id: 'assign-123',
        courses: { instructor_id: 'different-instructor' }
      };

      (mockSupabase.from as MockedFunction<any>)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockAssignment, error: null })
        });

      const result = await getAssignmentSubmissionsService(
        mockSupabase,
        'instructor-123',
        'assign-123'
      );

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error.code).toBe(gradeErrorCodes.INSUFFICIENT_PERMISSIONS);
      }
    });
  });
});