import { 
  submitAssignmentService,
  validateAssignmentSubmission,
  checkSubmissionDeadline,
  checkSubmissionPermissions,
  createOrUpdateSubmission
} from '../backend/service';
import { submissionErrorCodes } from '../backend/error';
import { SubmissionRequest } from '../backend/schema';

// Mock dependencies
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
};

const mockDeps = {
  supabase: mockSupabase as any,
  logger: mockLogger,
};

describe('Assignment Submission Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('submitAssignmentService', () => {
    it('should successfully submit an assignment', async () => {
      const userId = 'user-123';
      const assignmentId = 'assignment-123';
      const data: SubmissionRequest = {
        content: 'Test assignment content',
        link: 'https://example.com'
      };

      // Mock assignment validation success
      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'assignments') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: assignmentId, title: 'Test Assignment', due_date: new Date(Date.now() + 86400000).toISOString(), is_open: true, course_id: 'course-123' },
              error: null
            })
          };
        } else if (table === 'enrollments') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'enrollment-123' },
              error: null
            })
          };
        } else if (table === 'submissions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' } // No rows returned
            })
          };
        }
      });

      // Mock submission creation
      (mockSupabase.insert as jest.Mock).mockResolvedValue({
        data: [{ id: 'submission-123' }],
        error: null
      });

      const result = await submitAssignmentService(mockDeps, userId, assignmentId, data);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('submission-123');
      }
    });

    it('should return error if assignment not found', async () => {
      const userId = 'user-123';
      const assignmentId = 'assignment-123';
      const data: SubmissionRequest = {
        content: 'Test assignment content',
        link: 'https://example.com'
      };

      // Mock assignment not found
      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'assignments') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' } // No rows returned
            })
          };
        }
      });

      const result = await submitAssignmentService(mockDeps, userId, assignmentId, data);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(submissionErrorCodes.ASSIGNMENT_NOT_FOUND);
      }
    });

    it('should return error if assignment is closed', async () => {
      const userId = 'user-123';
      const assignmentId = 'assignment-123';
      const data: SubmissionRequest = {
        content: 'Test assignment content',
        link: 'https://example.com'
      };

      // Mock assignment closed
      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'assignments') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: assignmentId, title: 'Test Assignment', due_date: new Date(Date.now() + 86400000).toISOString(), is_open: false, course_id: 'course-123' },
              error: null
            })
          };
        }
      });

      const result = await submitAssignmentService(mockDeps, userId, assignmentId, data);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(submissionErrorCodes.ASSIGNMENT_CLOSED);
      }
    });
  });

  describe('validateAssignmentSubmission', () => {
    it('should validate assignment submission successfully', async () => {
      const userId = 'user-123';
      const assignmentId = 'assignment-123';
      const data: SubmissionRequest = {
        content: 'Test assignment content',
        link: 'https://example.com'
      };

      // Mock successful validation
      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'assignments') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: assignmentId, title: 'Test Assignment', due_date: new Date(Date.now() + 86400000).toISOString(), is_open: true, course_id: 'course-123' },
              error: null
            })
          };
        } else if (table === 'enrollments') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'enrollment-123' },
              error: null
            })
          };
        }
      });

      const result = await validateAssignmentSubmission(mockDeps, userId, assignmentId, data);

      expect(result.ok).toBe(true);
    });

    it('should return error if user is not enrolled', async () => {
      const userId = 'user-123';
      const assignmentId = 'assignment-123';
      const data: SubmissionRequest = {
        content: 'Test assignment content',
        link: 'https://example.com'
      };

      // Mock user not enrolled
      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'assignments') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: assignmentId, title: 'Test Assignment', due_date: new Date(Date.now() + 86400000).toISOString(), is_open: true, course_id: 'course-123' },
              error: null
            })
          };
        } else if (table === 'enrollments') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' } // No rows returned
            })
          };
        }
      });

      const result = await validateAssignmentSubmission(mockDeps, userId, assignmentId, data);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(submissionErrorCodes.INSUFFICIENT_PERMISSIONS);
      }
    });
  });

  describe('checkSubmissionDeadline', () => {
    it('should pass deadline check if assignment is not past due', async () => {
      const assignmentId = 'assignment-123';

      // Mock assignment with future due date
      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'assignments') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { due_date: new Date(Date.now() + 86400000).toISOString() }, // Tomorrow
              error: null
            })
          };
        }
      });

      const result = await checkSubmissionDeadline(mockDeps, assignmentId);

      expect(result.ok).toBe(true);
    });

    it('should return error if assignment is past due', async () => {
      const assignmentId = 'assignment-123';

      // Mock assignment with past due date
      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'assignments') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { due_date: new Date(Date.now() - 86400000).toISOString() }, // Yesterday
              error: null
            })
          };
        }
      });

      const result = await checkSubmissionDeadline(mockDeps, assignmentId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(submissionErrorCodes.SUBMISSION_PAST_DUE_DATE);
      }
    });
  });

  describe('createOrUpdateSubmission', () => {
    it('should create a new submission', async () => {
      const userId = 'user-123';
      const assignmentId = 'assignment-123';
      const data: SubmissionRequest = {
        content: 'Test assignment content',
        link: 'https://example.com'
      };

      // Mock no existing submission
      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'submissions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' } // No rows returned
            })
          };
        } else if (table === 'assignments') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { due_date: new Date(Date.now() + 86400000).toISOString() }, // Future date
              error: null
            })
          };
        }
      });

      // Mock successful insertion
      (mockSupabase.insert as jest.Mock).mockResolvedValue({
        data: [{ id: 'new-submission-123' }],
        error: null
      });

      const result = await createOrUpdateSubmission(mockDeps, userId, assignmentId, data);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('new-submission-123');
      }
    });

    it('should update an existing submission', async () => {
      const userId = 'user-123';
      const assignmentId = 'assignment-123';
      const data: SubmissionRequest = {
        content: 'Updated assignment content',
        link: 'https://example.com'
      };

      // Mock existing submission
      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'submissions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'existing-submission-123', status: 'submitted' },
              error: null
            })
          };
        } else if (table === 'assignments') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { due_date: new Date(Date.now() + 86400000).toISOString() }, // Future date
              error: null
            })
          };
        }
      });

      // Mock successful update
      (mockSupabase.update as jest.Mock).mockResolvedValue({
        error: null
      });

      const result = await createOrUpdateSubmission(mockDeps, userId, assignmentId, data);

      expect(result.ok).toBe(true);
    });
  });
});