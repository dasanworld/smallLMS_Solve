import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Logger } from 'winston';
import { 
  signupUserService, 
  createUserProfile, 
  recordTermsAgreement,
  type SignupServiceDependencies 
} from './service';
import { signupErrorCodes } from './error';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

describe('Auth Service', () => {
  let mockSupabase: SupabaseClient;
  let mockLogger: Logger;
  let deps: SignupServiceDependencies;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mock Supabase client
    mockSupabase = {
      auth: {
        signUp: vi.fn(),
        admin: {
          deleteUser: vi.fn(),
        },
      },
      from: vi.fn(() => ({
        insert: vi.fn(),
        delete: vi.fn(),
        eq: vi.fn(),
      })),
    } as unknown as SupabaseClient;
    
    // Create mock logger
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    } as unknown as Logger;
    
    deps = {
      supabase: mockSupabase,
      logger: mockLogger,
    };
  });

  describe('createUserProfile', () => {
    it('should create a user profile successfully', async () => {
      const mockInsert = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };
      (mockSupabase.from as Mock).mockReturnValue(mockInsert);

      const result = await createUserProfile(deps, 'user-id', 'test@example.com', 'learner', 'Test User', '010-1234-5678');

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockInsert.insert).toHaveBeenCalledWith([
        {
          id: 'user-id',
          email: 'test@example.com',
          role: 'learner',
          name: 'Test User',
          phone: '010-1234-5678',
        },
      ]);
      expect(result.ok).toBe(true);
      expect(result.value).toBeUndefined();
    });

    it('should return an error if profile creation fails', async () => {
      const mockInsert = {
        insert: vi.fn().mockResolvedValue({ error: { message: 'Database error' } }),
      };
      (mockSupabase.from as Mock).mockReturnValue(mockInsert);

      const result = await createUserProfile(deps, 'user-id', 'test@example.com', 'learner', 'Test User', '010-1234-5678');

      expect(result.ok).toBe(false);
      expect(result.error.code).toBe(signupErrorCodes.profileCreationError);
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to create user profile', 'Database error');
    });
  });

  describe('recordTermsAgreement', () => {
    it('should record terms agreement successfully', async () => {
      const mockInsert = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };
      (mockSupabase.from as Mock).mockReturnValue(mockInsert);

      const result = await recordTermsAgreement(deps, 'user-id', 'v1.0', '127.0.0.1');

      expect(mockSupabase.from).toHaveBeenCalledWith('user_terms_agreement');
      expect(mockInsert.insert).toHaveBeenCalledWith([
        {
          user_id: 'user-id',
          terms_version: 'v1.0',
          ip_address: '127.0.0.1',
        },
      ]);
      expect(result.ok).toBe(true);
      expect(result.value).toBeUndefined();
    });

    it('should record terms agreement with null IP if not provided', async () => {
      const mockInsert = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };
      (mockSupabase.from as Mock).mockReturnValue(mockInsert);

      const result = await recordTermsAgreement(deps, 'user-id', 'v1.0');

      expect(mockSupabase.from).toHaveBeenCalledWith('user_terms_agreement');
      expect(mockInsert.insert).toHaveBeenCalledWith([
        {
          user_id: 'user-id',
          terms_version: 'v1.0',
          ip_address: null,
        },
      ]);
      expect(result.ok).toBe(true);
      expect(result.value).toBeUndefined();
    });

    it('should return an error if terms agreement recording fails', async () => {
      const mockInsert = {
        insert: vi.fn().mockResolvedValue({ error: { message: 'Database error' } }),
      };
      (mockSupabase.from as Mock).mockReturnValue(mockInsert);

      const result = await recordTermsAgreement(deps, 'user-id', 'v1.0', '127.0.0.1');

      expect(result.ok).toBe(false);
      expect(result.error.code).toBe(signupErrorCodes.termsAgreementError);
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to record terms agreement', 'Database error');
    });
  });

  describe('signupUserService', () => {
    it('should complete user signup successfully', async () => {
      // Mock Supabase Auth signUp
      (mockSupabase.auth.signUp as Mock).mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      });
      
      // Mock database operations
      const mockUsersTable = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };
      const mockTermsTable = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };
      
      (mockSupabase.from as Mock)
        .mockImplementation((table: string) => {
          if (table === 'users') return mockUsersTable;
          if (table === 'user_terms_agreement') return mockTermsTable;
          return { insert: vi.fn() };
        });

      const signupData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'learner' as const,
        name: 'Test User',
        phone: '010-1234-5678',
        termsAgreed: true,
      };

      const result = await signupUserService(deps, signupData);

      expect(result.ok).toBe(true);
      expect(result.value.redirectTo).toBe('/courses');
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            role: 'learner',
            name: 'Test User',
            phone: '010-1234-5678',
          },
        },
      });
      expect(mockUsersTable.insert).toHaveBeenCalledWith([
        {
          id: 'user-id',
          email: 'test@example.com',
          role: 'learner',
          name: 'Test User',
          phone: '010-1234-5678',
        },
      ]);
      expect(mockTermsTable.insert).toHaveBeenCalledWith([
        {
          user_id: 'user-id',
          terms_version: 'v1.0',
          ip_address: null,
        },
      ]);
    });

    it('should return validation error for invalid input', async () => {
      const signupData = {
        email: 'invalid-email',
        password: 'short',
        role: 'invalid-role' as any,
        name: '',
        phone: '',
        termsAgreed: false,
      };

      const result = await signupUserService(deps, signupData);

      expect(result.ok).toBe(false);
      expect(result.error.code).toBe(signupErrorCodes.validationError);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Invalid signup data',
        expect.any(Object)
      );
    });

    it('should return error if terms are not agreed', async () => {
      const signupData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'learner' as const,
        name: 'Test User',
        phone: '010-1234-5678',
        termsAgreed: false,
      };

      const result = await signupUserService(deps, signupData);

      expect(result.ok).toBe(false);
      expect(result.error.code).toBe(signupErrorCodes.termsNotAgreed);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Terms not agreed during signup',
        { email: 'test@example.com' }
      );
    });

    it('should return error if Supabase Auth creation fails', async () => {
      (mockSupabase.auth.signUp as Mock).mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth error' },
      });

      const signupData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'learner' as const,
        name: 'Test User',
        phone: '010-1234-5678',
        termsAgreed: true,
      };

      const result = await signupUserService(deps, signupData);

      expect(result.ok).toBe(false);
      expect(result.error.code).toBe(signupErrorCodes.authCreationError);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create Supabase Auth user',
        'Auth error'
      );
    });

    it('should return user already exists error', async () => {
      (mockSupabase.auth.signUp as Mock).mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered' },
      });

      const signupData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'learner' as const,
        name: 'Test User',
        phone: '010-1234-5678',
        termsAgreed: true,
      };

      const result = await signupUserService(deps, signupData);

      expect(result.ok).toBe(false);
      expect(result.error.code).toBe(signupErrorCodes.userAlreadyExists);
    });

    it('should return error if profile creation fails and clean up auth user', async () => {
      (mockSupabase.auth.signUp as Mock).mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      });
      
      const mockUsersTable = {
        insert: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }),
      };
      const mockAuthAdmin = {
        deleteUser: vi.fn().mockResolvedValue({ error: null }),
      };
      
      (mockSupabase.from as Mock).mockReturnValue(mockUsersTable);
      mockSupabase.auth.admin = mockAuthAdmin as any;

      const signupData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'learner' as const,
        name: 'Test User',
        phone: '010-1234-5678',
        termsAgreed: true,
      };

      const result = await signupUserService(deps, signupData);

      expect(result.ok).toBe(false);
      expect(result.error.code).toBe(signupErrorCodes.profileCreationError);
      expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith('user-id');
    });
  });
});