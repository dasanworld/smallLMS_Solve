import { 
  createAssignmentService,
  updateAssignmentService,
  deleteAssignmentService,
  updateAssignmentStatusService,
  getCourseAssignmentsService,
  getAssignmentDetailsService,
  validateAssignmentWeightsService
} from '../backend/service';
import { AssignmentManagementError } from '../backend/error';

// Mock the Supabase client
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
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

describe('Assignment Management Service', () => {
  const mockUserId = 'user-123';
  const mockCourseId = 'course-123';
  const mockAssignmentId = 'assignment-123';

  describe('createAssignmentService', () => {
    it('should create a new assignment when user is course instructor', async () => {
      const mockAssignmentData = {
        title: 'Test Assignment',
        description: 'A test assignment',
        due_date: new Date().toISOString(),
        points_weight: 0.1,
        status: 'draft' as const,
      };

      // Mock the Supabase responses
      const mockCourseData = { id: mockCourseId, instructor_id: mockUserId };
      const mockNewAssignment = { id: mockAssignmentId, ...mockAssignmentData, course_id: mockCourseId };

      require('@/utils/supabase/server').createClient().from.mockImplementation((table: string) => {
        if (table === 'courses') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({ data: mockCourseData, error: null })),
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

      const result = await createAssignmentService(
        mockUserId,
        mockCourseId,
        mockAssignmentData
      );

      expect(result).toEqual(mockNewAssignment);
    });

    it('should throw an error if user is not course instructor', async () => {
      const mockAssignmentData = {
        title: 'Test Assignment',
        description: 'A test assignment',
        due_date: new Date().toISOString(),
        points_weight: 0.1,
        status: 'draft' as const,
      };

      // Mock a course with a different instructor
      const mockCourseData = { id: mockCourseId, instructor_id: 'other-user' };

      require('@/utils/supabase/server').createClient().from.mockImplementation((table: string) => {
        if (table === 'courses') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({ data: mockCourseData, error: null })),
              })),
            })),
          };
        }
      });

      await expect(createAssignmentService(
        mockUserId,
        mockCourseId,
        mockAssignmentData
      )).rejects.toThrow(AssignmentManagementError);
    });
  });

  describe('updateAssignmentService', () => {
    it('should update an assignment when user is course instructor', async () => {
      const mockUpdateData = { title: 'Updated Assignment' };
      const mockCurrentAssignment = {
        id: mockAssignmentId,
        title: 'Original Assignment',
        course_id: mockCourseId,
        courses: { instructor_id: mockUserId },
        points_weight: 0.1,
      };

      require('@/utils/supabase/server').createClient().from.mockImplementation((table: string) => {
        if (table === 'assignments') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({ data: mockCurrentAssignment, error: null })),
              })),
            })),
            update: jest.fn(() => ({
              eq: jest.fn(() => ({
                select: jest.fn(() => ({
                  single: jest.fn(() => Promise.resolve({ data: { ...mockCurrentAssignment, ...mockUpdateData }, error: null })),
                })),
              })),
            })),
          };
        }
      });

      const result = await updateAssignmentService(
        mockUserId,
        mockAssignmentId,
        mockUpdateData
      );

      expect(result).toEqual({ ...mockCurrentAssignment, ...mockUpdateData });
    });

    it('should throw an error if user is not course instructor', async () => {
      const mockUpdateData = { title: 'Updated Assignment' };
      const mockCurrentAssignment = {
        id: mockAssignmentId,
        title: 'Original Assignment',
        course_id: mockCourseId,
        courses: { instructor_id: 'other-user' },
        points_weight: 0.1,
      };

      require('@/utils/supabase/server').createClient().from.mockImplementation((table: string) => {
        if (table === 'assignments') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({ data: mockCurrentAssignment, error: null })),
              })),
            })),
          };
        }
      });

      await expect(updateAssignmentService(
        mockUserId,
        mockAssignmentId,
        mockUpdateData
      )).rejects.toThrow(AssignmentManagementError);
    });
  });

  describe('deleteAssignmentService', () => {
    it('should soft delete an assignment when user is course instructor', async () => {
      const mockAssignment = {
        id: mockAssignmentId,
        title: 'Test Assignment',
        course_id: mockCourseId,
        courses: { instructor_id: mockUserId },
      };

      require('@/utils/supabase/server').createClient().from.mockImplementation((table: string) => {
        if (table === 'assignments') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({ data: mockAssignment, error: null })),
              })),
            })),
            update: jest.fn(() => ({
              eq: jest.fn(() => ({
                data: null,
                error: null,
              })),
            })),
          };
        }
      });

      await expect(deleteAssignmentService(mockUserId, mockAssignmentId)).resolves.not.toThrow();
    });
  });

  describe('updateAssignmentStatusService', () => {
    it('should update assignment status when user is course instructor', async () => {
      const mockAssignment = {
        id: mockAssignmentId,
        title: 'Test Assignment',
        course_id: mockCourseId,
        status: 'draft',
        due_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        courses: { instructor_id: mockUserId },
      };

      require('@/utils/supabase/server').createClient().from.mockImplementation((table: string) => {
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
                  single: jest.fn(() => Promise.resolve({ data: { ...mockAssignment, status: 'published' }, error: null })),
                })),
              })),
            })),
          };
        }
      });

      const result = await updateAssignmentStatusService(
        mockUserId,
        mockAssignmentId,
        'published'
      );

      expect(result.status).toBe('published');
    });
  });

  describe('getCourseAssignmentsService', () => {
    it('should return assignments for a course when user is instructor', async () => {
      const mockAssignments = [
        { id: '1', title: 'Assignment 1', course_id: mockCourseId, status: 'published' },
        { id: '2', title: 'Assignment 2', course_id: mockCourseId, status: 'draft' },
      ];
      const mockCourse = { id: mockCourseId, instructor_id: mockUserId };

      require('@/utils/supabase/server').createClient().from.mockImplementation((table: string) => {
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

      const result = await getCourseAssignmentsService(mockUserId, mockCourseId);

      expect(result).toEqual(mockAssignments);
    });
  });

  describe('getAssignmentDetailsService', () => {
    it('should return assignment details when user is course instructor', async () => {
      const mockAssignment = {
        id: mockAssignmentId,
        title: 'Test Assignment',
        course_id: mockCourseId,
        status: 'published',
        courses: { instructor_id: mockUserId },
      };

      require('@/utils/supabase/server').createClient().from.mockImplementation((table: string) => {
        if (table === 'assignments') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({ data: mockAssignment, error: null })),
              })),
            })),
          };
        }
      });

      const result = await getAssignmentDetailsService(mockUserId, mockAssignmentId);

      expect(result).toEqual(mockAssignment);
    });
  });

  describe('validateAssignmentWeightsService', () => {
    it('should return true if total weight is within limits', async () => {
      const mockAssignments = [
        { points_weight: 0.3 },
        { points_weight: 0.4 },
      ];

      require('@/utils/supabase/server').createClient().from.mockImplementation((table: string) => {
        if (table === 'assignments') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                is: jest.fn(() => ({
                  neq: jest.fn(() => ({
                    data: mockAssignments,
                    error: null,
                  })),
                })),
                data: mockAssignments,
                error: null,
              })),
            })),
          };
        }
      });

      const result = await validateAssignmentWeightsService(mockCourseId, 0.2);

      // Total would be 0.3 + 0.4 + 0.2 = 0.9, which is <= 1.0
      expect(result).toBe(true);
    });

    it('should throw an error if total weight exceeds limits', async () => {
      const mockAssignments = [
        { points_weight: 0.6 },
        { points_weight: 0.5 },
      ];

      require('@/utils/supabase/server').createClient().from.mockImplementation((table: string) => {
        if (table === 'assignments') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                is: jest.fn(() => ({
                  data: mockAssignments,
                  error: null,
                })),
              })),
            })),
          };
        }
      });

      await expect(validateAssignmentWeightsService(mockCourseId, 0.2)).rejects.toThrow(AssignmentManagementError);
    });
  });
});