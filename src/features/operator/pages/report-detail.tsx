'use client';

import React from 'react';
import ReportDetail from '../components/ReportDetail';
import { useReports } from '../hooks';

const ReportDetailPage = () => {
  // In a real implementation, we would get the report ID from the router
  const reportId = '1'; // This would come from router query params
  
  const { reports, loading, error, updateReportStatus, takeReportAction } = useReports();
  
  const report = reports.find(r => r.id === reportId);

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>에러: {error}</div>;
  if (!report) return <div>신고를 찾을 수 없습니다.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <ReportDetail 
        report={report} 
        onStatusChange={updateReportStatus}
        onAction={takeReportAction}
      />
    </div>
  );
};

export default ReportDetailPage;