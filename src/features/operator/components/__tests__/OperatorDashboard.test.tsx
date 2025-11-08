import React from 'react';
import { render, screen } from '@testing-library/react';
import OperatorDashboard from '../OperatorDashboard';

describe('OperatorDashboard', () => {
  it('renders the dashboard title', () => {
    render(<OperatorDashboard />);
    
    expect(screen.getByText('운영자 대시보드')).toBeInTheDocument();
  });

  it('renders dashboard cards', () => {
    render(<OperatorDashboard />);
    
    expect(screen.getByText('신고 관리')).toBeInTheDocument();
    expect(screen.getByText('메타데이터 관리')).toBeInTheDocument();
    expect(screen.getByText('대시보드 통계')).toBeInTheDocument();
  });

  it('renders dashboard card content', () => {
    render(<OperatorDashboard />);
    
    expect(screen.getByText('신고된 콘텐츠 및 사용자 관리')).toBeInTheDocument();
    expect(screen.getByText('카테고리 및 난이도 관리')).toBeInTheDocument();
  });
});