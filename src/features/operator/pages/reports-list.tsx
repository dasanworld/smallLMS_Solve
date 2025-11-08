'use client';

import React from 'react';
import ReportManagement from '../components/ReportManagement';
import { useReports } from '../hooks';

const ReportsListPage = () => {
  const { reports, loading, error, updateReportStatus, takeReportAction } = useReports();

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>에러: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <ReportManagement 
        reports={reports} 
        onStatusChange={updateReportStatus}
      />
    </div>
  );
};

export default ReportsListPage;