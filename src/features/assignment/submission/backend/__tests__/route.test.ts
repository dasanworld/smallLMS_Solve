import { Hono } from 'hono';
import { registerSubmissionRoutes } from '../backend/route';
import { createHonoApp } from '@/backend/hono/app';
import { getSupabase } from '@/backend/hono/context';
import { submissionErrorCodes } from '../backend/error';
import { SubmissionRequest } from '../backend/schema';

// Mock the Supabase client
jest.mock('@/backend/hono/context', () => ({
  ...jest.requireActual('@/backend/hono/context'),
  getSupabase: jest.fn(),
  getLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  })),
}));

// Mock the authentication middleware
jest.mock('@/backend/middleware/auth', () => ({
  authenticate: jest.fn((handler) => handler),
  getAuthenticatedUser: jest.fn(() => ({ id: 'test-user-id' })),
}));

describe('Submission API Integration Tests', () => {
  let app: Hono<any>;

  beforeEach(() => {
    app = createHonoApp();
    registerSubmissionRoutes(app);
    jest.clearAllMocks();
  });

  describe('POST /api/assignments/:id/submit', () => {
    it('should successfully submit an assignment', async () => {
      // Mock the Supabase client
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
      };

      (getSupabase as jest.Mock).mockReturnValue(mockSupabase);

      // Mock successful assignment validation
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'assignments') {
          mockSupabase.select.mockReturnThis();
          mockSupabase.eq.mockReturnThis();
          mockSupabase.single.mockResolvedValue({
            data: { 
              id: 'assignment-123', 
              title: 'Test Assignment', 
              due_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
              is_open: true, 
              course_id: 'course-123' 
            },
            error: null
          });
        } else if (table === 'enrollments') {
          mockSupabase.select.mockReturnThis();
          mockSupabase.eq.mockReturnThis();
          mockSupabase.single.mockResolvedValue({
            data: { id: 'enrollment-123' },
            error: null
          });
        } else if (table === 'submissions') {
          mockSupabase.select.mockReturnThis();
          mockSupabase.eq.mockReturnThis();
          mockSupabase.single.mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' } // No rows returned
          });
        }
        return mockSupabase;
      });

      // Mock successful submission creation
      mockSupabase.insert.mockResolvedValue({
        data: [{ id: 'submission-123' }],
        error: null
      });

      const reqBody: SubmissionRequest = {
        content: 'Test assignment content',
        link: 'https://example.com'
      };

      const req = new Request('http://localhost/api/assignments/assignment-123/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify(reqBody)
      });

      const response = await app.request(req);
      
      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody.success).toBe(true);
      expect(responseBody.submission_id).toBe('submission-123');
    });

    it('should return 400 for invalid input', async () => {
      const reqBody = {
        content: '', // Invalid: empty content
        link: 'invalid-url' // Invalid: not a proper URL
      };

      const req = new Request('http://localhost/api/assignments/assignment-123/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify(reqBody)
      });

      const response = await app.request(req);
      
      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody.error.code).toBe(submissionErrorCodes.INVALID_INPUT);
    });

    it('should return 401 for unauthorized access', async () => {
      // Mock the Supabase client to return an auth error
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Invalid token' }
          })
        }
      };

      (getSupabase as jest.Mock).mockReturnValue(mockSupabase);

      const reqBody: SubmissionRequest = {
        content: 'Test assignment content',
        link: 'https://example.com'
      };

      const req = new Request('http://localhost/api/assignments/assignment-123/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token'
        },
        body: JSON.stringify(reqBody)
      });

      const response = await app.request(req);
      
      expect(response.status).toBe(401);
      const responseBody = await response.json();
      expect(responseBody.error.code).toBe(submissionErrorCodes.UNAUTHORIZED);
    });

    it('should return 404 if assignment is not found', async () => {
      // Mock the Supabase client
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
      };

      (getSupabase as jest.Mock).mockReturnValue(mockSupabase);

      // Mock assignment not found
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'assignments') {
          mockSupabase.select.mockReturnThis();
          mockSupabase.eq.mockReturnThis();
          mockSupabase.single.mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' } // No rows returned
          });
        }
        return mockSupabase;
      });

      const reqBody: SubmissionRequest = {
        content: 'Test assignment content',
        link: 'https://example.com'
      };

      const req = new Request('http://localhost/api/assignments/assignment-123/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify(reqBody)
      });

      const response = await app.request(req);
      
      expect(response.status).toBe(404);
      const responseBody = await response.json();
      expect(responseBody.error.code).toBe(submissionErrorCodes.ASSIGNMENT_NOT_FOUND);
    });
  });
});