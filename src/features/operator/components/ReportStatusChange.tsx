'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReportStatusChangeProps {
  currentStatus: 'received' | 'investigating' | 'resolved';
  onStatusChange: (newStatus: 'received' | 'investigating' | 'resolved') => void;
}

const ReportStatusChange: React.FC<ReportStatusChangeProps> = ({ currentStatus, onStatusChange }) => {
  return (
    <div className="flex items-center space-x-4">
      <span className="text-sm font-medium">상태 변경:</span>
      <Select value={currentStatus} onValueChange={(value: 'received' | 'investigating' | 'resolved') => onStatusChange(value)}>
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="received">접수됨</SelectItem>
          <SelectItem value="investigating">조사중</SelectItem>
          <SelectItem value="resolved">해결됨</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ReportStatusChange;