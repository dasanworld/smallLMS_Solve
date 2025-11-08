import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GradeSubmissionForm } from '@/features/grade/components/grade-submission-form';

// Mock react-hook-form
vi.mock('react-hook-form', async () => {
  const actual = await vi.importActual('react-hook-form');
  return {
    ...actual,
    useForm: () => ({
      register: vi.fn(),
      handleSubmit: vi.fn((callback) => (data) => callback(data)),
      formState: { errors: {} },
      control: {},
      watch: vi.fn().mockReturnValue('grade'),
    }),
  };
});

// Mock @hookform/resolvers/zod
vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: vi.fn(),
}));

// Mock zod
vi.mock('zod', () => ({
  z: {
    object: vi.fn().mockReturnThis(),
    string: vi.fn().mockReturnThis(),
    number: vi.fn().mockReturnThis(),
    min: vi.fn().mockReturnThis(),
    max: vi.fn().mockReturnThis(),
    enum: vi.fn().mockReturnThis(),
  },
}));

describe('GradeSubmissionForm', () => {
  const mockOnSubmit = vi.fn();

  const defaultProps = {
    submissionId: 'sub-123',
    onSubmit: mockOnSubmit,
    isSubmitting: false,
  };

  it('renders the grading form with default values', () => {
    render(<GradeSubmissionForm {...defaultProps} />);

    // Check if the action radio buttons are present
    expect(screen.getByLabelText('Grade Submission')).toBeInTheDocument();
    expect(screen.getByLabelText('Request Resubmission')).toBeInTheDocument();

    // Check if the score input is present when grading is selected
    expect(screen.getByLabelText('Grade (%)')).toBeInTheDocument();

    // Check if the feedback textarea is present
    expect(screen.getByLabelText('Feedback')).toBeInTheDocument();

    // Check if the submit button is present
    expect(screen.getByRole('button', { name: /Submit Grade/i })).toBeInTheDocument();
  });

  it('switches between grading and resubmission modes', () => {
    const mockWatch = vi.fn().mockReturnValue('grade');
    vi.mock('react-hook-form', async () => {
      const actual = await vi.importActual('react-hook-form');
      return {
        ...actual,
        useForm: () => ({
          register: vi.fn(),
          handleSubmit: vi.fn((callback) => (data) => callback(data)),
          formState: { errors: {} },
          control: {},
          watch: mockWatch,
        }),
      };
    });

    render(<GradeSubmissionForm {...defaultProps} />);
    
    // Initially grading mode should be selected
    expect(screen.getByLabelText('Grade (%)')).toBeInTheDocument();
    
    // Switch to resubmission mode
    mockWatch.mockReturnValue('resubmission_required');
    render(<GradeSubmissionForm {...defaultProps} />);
    
    // In resubmission mode, score input should not be present
    expect(screen.queryByLabelText('Grade (%)')).not.toBeInTheDocument();
  });

  it('submits the form with correct data', () => {
    render(<GradeSubmissionForm {...defaultProps} />);

    // Fill in the form fields
    const scoreInput = screen.getByLabelText('Grade (%)');
    fireEvent.change(scoreInput, { target: { value: '85' } });

    const feedbackTextarea = screen.getByLabelText('Feedback');
    fireEvent.change(feedbackTextarea, { target: { value: 'Good work!' } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Submit Grade/i });
    fireEvent.click(submitButton);

    // Verify that the onSubmit function was called
    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('disables the submit button when isSubmitting is true', () => {
    render(<GradeSubmissionForm {...defaultProps} isSubmitting={true} />);

    const submitButton = screen.getByRole('button', { name: /Submit Grade/i });
    expect(submitButton).toBeDisabled();
  });
});