import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ReportManagement from '../ReportManagement';

// Mock report data
const mockReports = [
  {
    id: '1',
    reporter_id: 'user1',
    target_type: 'course',
    target_id: 'course1',
    reason: 'inappropriate_content',
    content: 'This course contains inappropriate content.',
    status: 'received' as const,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    reporter_id: 'user2',
    target_type: 'user',
    target_id: 'user3',
    reason: 'spam',
    content: 'This user is posting spam messages.',
    status: 'investigating' as const,
    created_at: new Date().toISOString(),
  }
];

describe('ReportManagement', () => {
  const mockOnStatusChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders report management title', () => {
    render(
      <ReportManagement 
        reports={mockReports} 
        onStatusChange={mockOnStatusChange} 
      />
    );
    
    expect(screen.getByText('신고 관리')).toBeInTheDocument();
  });

  it('renders report list table', () => {
    render(
      <ReportManagement 
        reports={mockReports} 
        onStatusChange={mockOnStatusChange} 
      />
    );
    
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('타입')).toBeInTheDocument();
    expect(screen.getByText('이유')).toBeInTheDocument();
    expect(screen.getByText('내용')).toBeInTheDocument();
    expect(screen.getByText('상태')).toBeInTheDocument();
    expect(screen.getByText('작성일')).toBeInTheDocument();
    expect(screen.getByText('작업')).toBeInTheDocument();
  });

  it('displays reports in the table', () => {
    render(
      <ReportManagement 
        reports={mockReports} 
        onStatusChange={mockOnStatusChange} 
      />
    );
    
    // Check if the report data is displayed
    expect(screen.getByText('course')).toBeInTheDocument();
    expect(screen.getByText('inappropriate_content')).toBeInTheDocument();
    expect(screen.getByText('This course contains inappropriate content.')).toBeInTheDocument();
    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('spam')).toBeInTheDocument();
  });

  it('shows appropriate status badges', () => {
    render(
      <ReportManagement 
        reports={mockReports} 
        onStatusChange={mockOnStatusChange} 
      />
    );
    
    // Check for status badges
    expect(screen.getByText('접수됨')).toBeInTheDocument(); // received
    expect(screen.getByText('조사중')).toBeInTheDocument(); // investigating
  });

  it('calls onStatusChange when buttons are clicked', () => {
    render(
      <ReportManagement 
        reports={mockReports} 
        onStatusChange={mockOnStatusChange} 
      />
    );
    
    // Find and click the first "조사 시작" button
    const investigateButtons = screen.getAllByText('조사 시작');
    fireEvent.click(investigateButtons[0]);
    
    expect(mockOnStatusChange).toHaveBeenCalledWith('1', 'investigating');
  });
});