'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Report {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  content: string;
  status: 'received' | 'investigating' | 'resolved';
  created_at: string;
}

interface ReportManagementProps {
  reports: Report[];
  onStatusChange: (reportId: string, newStatus: 'received' | 'investigating' | 'resolved') => void;
}

const ReportManagement: React.FC<ReportManagementProps> = ({ reports, onStatusChange }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">신고 관리</h2>
        <div className="flex space-x-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="상태 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="received">접수됨</SelectItem>
              <SelectItem value="investigating">조사중</SelectItem>
              <SelectItem value="resolved">해결됨</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="타입 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="course">코스</SelectItem>
              <SelectItem value="assignment">과제</SelectItem>
              <SelectItem value="submission">제출물</SelectItem>
              <SelectItem value="user">사용자</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>신고 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>타입</TableHead>
                <TableHead>이유</TableHead>
                <TableHead>내용</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>작성일</TableHead>
                <TableHead>작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{report.id.substring(0, 8)}...</TableCell>
                  <TableCell>{report.target_type}</TableCell>
                  <TableCell>{report.reason}</TableCell>
                  <TableCell className="max-w-xs truncate">{report.content}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={report.status === 'received' ? 'default' : 
                               report.status === 'investigating' ? 'secondary' : 
                               'outline'}
                    >
                      {report.status === 'received' ? '접수됨' : 
                       report.status === 'investigating' ? '조사중' : 
                       '해결됨'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onStatusChange(report.id, 'investigating')}
                      >
                        조사 시작
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onStatusChange(report.id, 'resolved')}
                      >
                        해결
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportManagement;