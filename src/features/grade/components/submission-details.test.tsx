import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SubmissionDetails } from '@/features/grade/components/submission-details';
import { SubmissionGradingData } from '@/features/grade/types';

describe('SubmissionDetails', () => {
  const mockSubmission: SubmissionGradingData = {
    id: 'sub-123',
    assignment_id: 'assign-123',
    user_id: 'user-123',
    user_name: 'John Doe',
    content: 'This is a test submission',
    link: 'https://example.com/submission',
    submitted_at: '2023-01-01T10:00:00Z',
    is_late: false,
    score: 85,
    feedback: 'Good work with some areas for improvement',
    status: 'graded',
    assignment_title: 'Test Assignment',
    course_title: 'Test Course',
  };

  it('renders submission details correctly', () => {
    render(<SubmissionDetails submission={mockSubmission} />);

    // Check if the card is rendered
    expect(screen.getByText('Submission Details')).toBeInTheDocument();

    // Check if user name is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();

    // Check if assignment title is displayed
    expect(screen.getByText('Test Assignment')).toBeInTheDocument();

    // Check if submission content is displayed
    expect(screen.getByText('This is a test submission')).toBeInTheDocument();

    // Check if submission link is displayed
    const linkElement = screen.getByText('https://example.com/submission');
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveAttribute('href', 'https://example.com/submission');

    // Check if submitted date is displayed
    expect(screen.getByText('2023-01-01 19:00')).toBeInTheDocument(); // Adjusted for timezone
  });

  it('shows late badge when submission is late', () => {
    const lateSubmission = { ...mockSubmission, is_late: true };
    render(<SubmissionDetails submission={lateSubmission} />);

    expect(screen.getByText('LATE')).toBeInTheDocument();
  });

  it('shows correct status badge', () => {
    render(<SubmissionDetails submission={mockSubmission} />);

    expect(screen.getByText('GRADED')).toBeInTheDocument();
  });

  it('does not show link if not provided', () => {
    const submissionWithoutLink = { ...mockSubmission, link: null };
    render(<SubmissionDetails submission={submissionWithoutLink} />);

    expect(screen.queryByText('Submission Link')).not.toBeInTheDocument();
  });

  it('shows different status for resubmission required', () => {
    const resubmissionSubmission = { ...mockSubmission, status: 'resubmission_required' };
    render(<SubmissionDetails submission={resubmissionSubmission} />);

    expect(screen.getByText('RESUBMISSION REQUIRED')).toBeInTheDocument();
  });
});