import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AssignmentDetail from './components/AssignmentDetail';
import { useAssignmentDetailQuery } from './hooks/useAssignmentDetailQuery';
import { useAssignmentSubmissionMutation } from './hooks/useAssignmentSubmissionMutation';

// Mock the custom hooks
vi.mock('./hooks/useAssignmentDetailQuery', () => ({
  useAssignmentDetailQuery: vi.fn(),
}));

vi.mock('./hooks/useAssignmentSubmissionMutation', () => ({
  useAssignmentSubmissionMutation: vi.fn(),
}));

// Create a test query client
const createTestQueryClient = () => 
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe('AssignmentDetail Component', () => {
  const mockAssignmentData = {
    id: '1',
    title: 'Test Assignment',
    description: 'This is a test assignment',
    deadline: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    score_weight: 20,
    submission_policy: {
      allow_text_submission: true,
      allow_link_submission: true,
      allow_file_submission: false,
      max_file_size: 10485760,
      allowed_file_types: ['pdf', 'doc', 'docx'],
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    course_id: 'course-1',
    course_title: 'Test Course',
    is_submitted: false,
    submission_id: null,
    submission_content: null,
    submission_link: null,
    submission_status: null,
    submission_created_at: null,
    submission_updated_at: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    (useAssignmentDetailQuery as vi.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <AssignmentDetail assignmentId="1" />
      </QueryClientProvider>
    );

    expect(screen.getByText(/h-8 w-1\/3 mb-6/)).toBeInTheDocument(); // Skeleton loader
  });

  it('renders error state', () => {
    (useAssignmentDetailQuery as vi.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch assignment'),
    });

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <AssignmentDetail assignmentId="1" />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Error:/)).toBeInTheDocument();
    expect(screen.getByText(/Failed to fetch assignment/)).toBeInTheDocument();
  });

  it('renders assignment detail when data is available', () => {
    (useAssignmentDetailQuery as vi.Mock).mockReturnValue({
      data: mockAssignmentData,
      isLoading: false,
      error: null,
    });

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <AssignmentDetail assignmentId="1" />
      </QueryClientProvider>
    );

    // Check that the assignment title is rendered
    expect(screen.getByText('Test Assignment')).toBeInTheDocument();
    
    // Check that the course title is rendered
    expect(screen.getByText('Test Course')).toBeInTheDocument();
    
    // Check that the description is rendered
    expect(screen.getByText('This is a test assignment')).toBeInTheDocument();
    
    // Check that the submission form is rendered when not submitted
    expect(screen.getByText('Submit Assignment')).toBeInTheDocument();
  });

  it('renders submitted state when assignment is submitted', () => {
    const submittedAssignment = {
      ...mockAssignmentData,
      is_submitted: true,
      submission_id: 'sub-1',
      submission_content: 'Test submission content',
      submission_created_at: new Date().toISOString(),
    };

    (useAssignmentDetailQuery as vi.Mock).mockReturnValue({
      data: submittedAssignment,
      isLoading: false,
      error: null,
    });

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <AssignmentDetail assignmentId="1" />
      </QueryClientProvider>
    );

    // Check that the submitted state is rendered
    expect(screen.getByText('Assignment Submitted')).toBeInTheDocument();
    
    // Check that the submission content is rendered
    expect(screen.getByText('Test submission content')).toBeInTheDocument();
  });
});