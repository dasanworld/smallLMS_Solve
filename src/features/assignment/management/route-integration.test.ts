import { Hono } from 'hono';
import { registerAssignmentManagementRoutes } from '../backend/route';
import { AssignmentManagementError } from '../backend/error';

// Mock the authentication middleware
jest.mock('@/backend/middleware/auth', () => ({
  authenticate: jest.fn((c, next) => {
    c.set('user', { id: 'test-user-id' });
    return next();
  }),
}));

// Mock the Supabase client
jest.mock('@/lib/supabase/service-client', () => ({
  getSupabaseServiceClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(),
        })),
        neq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
    })),
  })),
}));

describe('Assignment Management Routes Integration', () => {
  let app: Hono;

  beforeAll(() => {
    app = new Hono();
    registerAssignmentManagementRoutes(app);
  });

  describe('GET /api/courses/:courseId/assignments', () => {
    it('should return assignments for a course', async () => {
      // Mock the database response
      const mockAssignments = [
        { id: '1', title: 'Assignment 1', course_id: 'course-1', status: 'published' },
        { id: '2', title: 'Assignment 2', course_id: 'course-1', status: 'draft' },
      ];
      const mockCourse = { id: 'course-1', instructor_id: 'test-user-id' };

      require('@/lib/supabase/service-client').getSupabaseServiceClient().from
        .mockImplementation((table: string) => {
          if (table === 'courses') {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn(() => Promise.resolve({ data: mockCourse, error: null })),
                })),
              })),
            };
          } else if (table === 'assignments') {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  is: jest.fn(() => ({
                    order: jest.fn(() => Promise.resolve({ data: mockAssignments, error: null })),
                  })),
                })),
              })),
            };
          }
        });

      const response = await app.request('/api/courses/course-1/assignments', {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.assignments).toEqual(mockAssignments);
    });

    it('should return 400 if user does not have permission', async () => {
      // Mock a course with a different instructor
      const mockCourse = { id: 'course-1', instructor_id: 'other-user' };

      require('@/lib/supabase/service-client').getSupabaseServiceClient().from
        .mockImplementation((table: string) => {
          if (table === 'courses') {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn(() => Promise.resolve({ data: mockCourse, error: null })),
                })),
              })),
            };
          }
        });

      const response = await app.request('/api/courses/course-1/assignments', {
        method: 'GET',
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('POST /api/courses/:courseId/assignments', () => {
    it('should create a new assignment', async () => {
      const newAssignmentData = {
        title: 'New Assignment',
        description: 'A new assignment',
        due_date: new Date().toISOString(),
        points_weight: 0.1,
        status: 'draft',
      };

      // Mock the course data (user is instructor)
      const mockCourse = { id: 'course-1', instructor_id: 'test-user-id' };
      const mockNewAssignment = { id: 'new-assignment-id', ...newAssignmentData, course_id: 'course-1' };

      require('@/lib/supabase/service-client').getSupabaseServiceClient().from
        .mockImplementation((table: string) => {
          if (table === 'courses') {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn(() => Promise.resolve({ data: mockCourse, error: null })),
                })),
              })),
            };
          } else if (table === 'assignments') {
            return {
              insert: jest.fn(() => ({
                select: jest.fn(() => ({
                  single: jest.fn(() => Promise.resolve({ data: mockNewAssignment, error: null })),
                })),
              })),
            };
          }
        });

      const response = await app.request('/api/courses/course-1/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAssignmentData),
      });

      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result.assignment).toEqual(mockNewAssignment);
    });

    it('should return 400 if validation fails', async () => {
      const invalidAssignmentData = {
        title: '', // Invalid: empty title
        due_date: new Date().toISOString(),
        points_weight: 1.5, // Invalid: too high
      };

      const response = await app.request('/api/courses/course-1/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidAssignmentData),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/assignments/:id/status', () => {
    it('should update assignment status', async () => {
      const mockAssignment = {
        id: 'assignment-1',
        title: 'Test Assignment',
        course_id: 'course-1',
        status: 'draft',
        courses: { instructor_id: 'test-user-id' },
      };
      const updatedAssignment = { ...mockAssignment, status: 'published' };

      require('@/lib/supabase/service-client').getSupabaseServiceClient().from
        .mockImplementation((table: string) => {
          if (table === 'assignments') {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn(() => Promise.resolve({ data: mockAssignment, error: null })),
                })),
              })),
              update: jest.fn(() => ({
                eq: jest.fn(() => ({
                  select: jest.fn(() => ({
                    single: jest.fn(() => Promise.resolve({ data: updatedAssignment, error: null })),
                  })),
                })),
              })),
            };
          }
        });

      const response = await app.request('/api/assignments/assignment-1/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'published' }),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.assignment.status).toBe('published');
    });
  });

  describe('GET /api/assignments/:assignmentId/submissions', () => {
    it('should return submissions for an assignment', async () => {
      const mockSubmissions = [
        { id: 'sub-1', assignment_id: 'assignment-1', user_id: 'user-1', status: 'pending' },
        { id: 'sub-2', assignment_id: 'assignment-1', user_id: 'user-2', status: 'graded' },
      ];
      const mockAssignment = {
        id: 'assignment-1',
        title: 'Test Assignment',
        course_id: 'course-1',
        courses: { instructor_id: 'test-user-id' },
      };

      require('@/lib/supabase/service-client').getSupabaseServiceClient().from
        .mockImplementation((table: string) => {
          if (table === 'assignments') {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn(() => Promise.resolve({ data: mockAssignment, error: null })),
                })),
              })),
            };
          } else if (table === 'submissions') {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  order: jest.fn(() => Promise.resolve({ data: mockSubmissions, error: null })),
                })),
              })),
            };
          }
        });

      const response = await app.request('/api/assignments/assignment-1/submissions', {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.submissions).toEqual(mockSubmissions);
    });
  });
});