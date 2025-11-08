import { useState, useEffect } from 'react';
import { Report, Category, Difficulty } from '../backend/service';

// Define types for the hooks
export interface UseReportsReturn {
  reports: Report[];
  loading: boolean;
  error: string | null;
  fetchReports: (filters?: { type?: string; status?: string; page?: number; limit?: number }) => Promise<void>;
  updateReportStatus: (reportId: string, newStatus: 'received' | 'investigating' | 'resolved') => Promise<void>;
  takeReportAction: (reportId: string, action: 'resolve' | 'escalate' | 'dismiss' | 'contact_user', notes?: string) => Promise<void>;
}

export const useReports = (): UseReportsReturn => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async (filters?: { type?: string; status?: string; page?: number; limit?: number }) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would make an API call
      // For now, returning mock data
      const mockReports: Report[] = [
        {
          id: '1',
          reporter_id: 'user1',
          target_type: 'course',
          target_id: 'course1',
          reason: 'inappropriate_content',
          content: 'This course contains inappropriate content.',
          status: 'received',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          reporter_id: 'user2',
          target_type: 'user',
          target_id: 'user3',
          reason: 'spam',
          content: 'This user is posting spam messages.',
          status: 'investigating',
          created_at: new Date().toISOString(),
        }
      ];
      
      setReports(mockReports);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, newStatus: 'received' | 'investigating' | 'resolved') => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would make an API call
      console.log(`Updating report ${reportId} to status ${newStatus}`);
      // Update the local state to reflect the change
      setReports(prev => 
        prev.map(report => 
          report.id === reportId ? { ...report, status: newStatus } : report
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const takeReportAction = async (reportId: string, action: 'resolve' | 'escalate' | 'dismiss' | 'contact_user', notes?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would make an API call
      console.log(`Taking action ${action} on report ${reportId}`, { notes });
      // Update the local state to reflect the change
      setReports(prev => 
        prev.map(report => 
          report.id === reportId ? { ...report, status: action === 'dismiss' || action === 'resolve' ? 'resolved' : 'investigating' } : report
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchReports();
  }, []);

  return {
    reports,
    loading,
    error,
    fetchReports,
    updateReportStatus,
    takeReportAction,
  };
};

export interface UseMetadataReturn {
  categories: Category[];
  difficulties: Difficulty[];
  loading: boolean;
  error: string | null;
  fetchMetadata: () => Promise<void>;
  createCategory: (name: string, description?: string) => Promise<void>;
  createDifficulty: (name: string, description?: string, sort_order?: number) => Promise<void>;
  updateCategory: (id: number, name: string, description?: string) => Promise<void>;
  updateDifficulty: (id: number, name: string, description?: string, sort_order?: number) => Promise<void>;
  deactivateCategory: (id: number) => Promise<void>;
  deactivateDifficulty: (id: number) => Promise<void>;
}

export const useMetadata = (): UseMetadataReturn => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would make an API call
      // For now, returning mock data
      const mockCategories: Category[] = [
        {
          id: 1,
          name: '프로그래밍',
          description: 'Programming related courses',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 2,
          name: '디자인',
          description: 'Design related courses',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
      
      const mockDifficulties: Difficulty[] = [
        {
          id: 1,
          name: '초급',
          description: 'Beginner level',
          sort_order: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 2,
          name: '중급',
          description: 'Intermediate level',
          sort_order: 1,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
      
      setCategories(mockCategories);
      setDifficulties(mockDifficulties);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (name: string, description?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would make an API call
      console.log(`Creating category: ${name}`, { description });
      // Add to local state
      const newCategory: Category = {
        id: categories.length + 1,
        name,
        description,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setCategories(prev => [...prev, newCategory]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createDifficulty = async (name: string, description?: string, sort_order?: number) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would make an API call
      console.log(`Creating difficulty: ${name}`, { description, sort_order });
      // Add to local state
      const newDifficulty: Difficulty = {
        id: difficulties.length + 1,
        name,
        description,
        sort_order: sort_order || 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setDifficulties(prev => [...prev, newDifficulty]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async (id: number, name: string, description?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would make an API call
      console.log(`Updating category ${id}: ${name}`, { description });
      // Update in local state
      setCategories(prev => 
        prev.map(cat => 
          cat.id === id ? { ...cat, name, description, updated_at: new Date().toISOString() } : cat
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateDifficulty = async (id: number, name: string, description?: string, sort_order?: number) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would make an API call
      console.log(`Updating difficulty ${id}: ${name}`, { description, sort_order });
      // Update in local state
      setDifficulties(prev => 
        prev.map(diff => 
          diff.id === id ? { ...diff, name, description, sort_order, updated_at: new Date().toISOString() } : diff
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const deactivateCategory = async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would make an API call
      console.log(`Deactivating category ${id}`);
      // Update in local state
      setCategories(prev => 
        prev.map(cat => 
          cat.id === id ? { ...cat, is_active: false, updated_at: new Date().toISOString() } : cat
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const deactivateDifficulty = async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would make an API call
      console.log(`Deactivating difficulty ${id}`);
      // Update in local state
      setDifficulties(prev => 
        prev.map(diff => 
          diff.id === id ? { ...diff, is_active: false, updated_at: new Date().toISOString() } : diff
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchMetadata();
  }, []);

  return {
    categories,
    difficulties,
    loading,
    error,
    fetchMetadata,
    createCategory,
    createDifficulty,
    updateCategory,
    updateDifficulty,
    deactivateCategory,
    deactivateDifficulty,
  };
};

export interface UseCategoryManagementReturn {
  categories: Category[];
  loading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  createCategory: (name: string, description?: string) => Promise<void>;
  updateCategory: (id: number, name: string, description?: string) => Promise<void>;
  deactivateCategory: (id: number) => Promise<void>;
}

export const useCategoryManagement = (): UseCategoryManagementReturn => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would make an API call
      // For now, returning mock data
      const mockCategories: Category[] = [
        {
          id: 1,
          name: '프로그래밍',
          description: 'Programming related courses',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 2,
          name: '디자인',
          description: 'Design related courses',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
      
      setCategories(mockCategories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (name: string, description?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would make an API call
      console.log(`Creating category: ${name}`, { description });
      // Add to local state
      const newCategory: Category = {
        id: categories.length + 1,
        name,
        description,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setCategories(prev => [...prev, newCategory]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async (id: number, name: string, description?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would make an API call
      console.log(`Updating category ${id}: ${name}`, { description });
      // Update in local state
      setCategories(prev => 
        prev.map(cat => 
          cat.id === id ? { ...cat, name, description, updated_at: new Date().toISOString() } : cat
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const deactivateCategory = async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would make an API call
      console.log(`Deactivating category ${id}`);
      // Update in local state
      setCategories(prev => 
        prev.map(cat => 
          cat.id === id ? { ...cat, is_active: false, updated_at: new Date().toISOString() } : cat
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deactivateCategory,
  };
};

export interface UseDifficultyManagementReturn {
  difficulties: Difficulty[];
  loading: boolean;
  error: string | null;
  fetchDifficulties: () => Promise<void>;
  createDifficulty: (name: string, description?: string, sort_order?: number) => Promise<void>;
  updateDifficulty: (id: number, name: string, description?: string, sort_order?: number) => Promise<void>;
  deactivateDifficulty: (id: number) => Promise<void>;
}

export const useDifficultyManagement = (): UseDifficultyManagementReturn => {
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDifficulties = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would make an API call
      // For now, returning mock data
      const mockDifficulties: Difficulty[] = [
        {
          id: 1,
          name: '초급',
          description: 'Beginner level',
          sort_order: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 2,
          name: '중급',
          description: 'Intermediate level',
          sort_order: 1,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
      
      setDifficulties(mockDifficulties);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createDifficulty = async (name: string, description?: string, sort_order?: number) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would make an API call
      console.log(`Creating difficulty: ${name}`, { description, sort_order });
      // Add to local state
      const newDifficulty: Difficulty = {
        id: difficulties.length + 1,
        name,
        description,
        sort_order: sort_order || 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setDifficulties(prev => [...prev, newDifficulty]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateDifficulty = async (id: number, name: string, description?: string, sort_order?: number) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would make an API call
      console.log(`Updating difficulty ${id}: ${name}`, { description, sort_order });
      // Update in local state
      setDifficulties(prev => 
        prev.map(diff => 
          diff.id === id ? { ...diff, name, description, sort_order, updated_at: new Date().toISOString() } : diff
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const deactivateDifficulty = async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would make an API call
      console.log(`Deactivating difficulty ${id}`);
      // Update in local state
      setDifficulties(prev => 
        prev.map(diff => 
          diff.id === id ? { ...diff, is_active: false, updated_at: new Date().toISOString() } : diff
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchDifficulties();
  }, []);

  return {
    difficulties,
    loading,
    error,
    fetchDifficulties,
    createDifficulty,
    updateDifficulty,
    deactivateDifficulty,
  };
};