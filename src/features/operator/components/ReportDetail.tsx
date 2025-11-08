'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Report {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  content: string;
  status: 'received' | 'investigating' | 'resolved';
  resolved_at?: string | null;
  resolved_by?: string | null;
  created_at: string;
}

interface ReportDetailProps {
  report: Report;
  onStatusChange: (newStatus: 'received' | 'investigating' | 'resolved') => void;
  onAction: (action: 'resolve' | 'escalate' | 'dismiss' | 'contact_user') => void;
}

const ReportDetail: React.FC<ReportDetailProps> = ({ report, onStatusChange, onAction }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">신고 상세</h2>
        <Badge 
          variant={report.status === 'received' ? 'default' : 
                   report.status === 'investigating' ? 'secondary' : 
                   'outline'}
        >
          {report.status === 'received' ? '접수됨' : 
           report.status === 'investigating' ? '조사중' : 
           '해결됨'}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>신고 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">ID</h3>
            <p>{report.id}</p>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-medium">타입</h3>
            <p>{report.target_type}</p>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-medium">신고 대상 ID</h3>
            <p>{report.target_id}</p>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-medium">이유</h3>
            <p>{report.reason}</p>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-medium">내용</h3>
            <p>{report.content}</p>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-medium">작성일</h3>
            <p>{new Date(report.created_at).toLocaleString()}</p>
          </div>
          
          {report.resolved_at && (
            <>
              <Separator />
              <div>
                <h3 className="font-medium">해결일</h3>
                <p>{new Date(report.resolved_at).toLocaleString()}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>상태 변경</CardTitle>
        </CardHeader>
        <CardContent className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => onStatusChange('received')}
          >
            접수됨
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onStatusChange('investigating')}
          >
            조사중
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onStatusChange('resolved')}
          >
            해결됨
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>조치</CardTitle>
        </CardHeader>
        <CardContent className="flex space-x-2">
          <Button 
            variant="default" 
            onClick={() => onAction('resolve')}
          >
            해결
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onAction('escalate')}
          >
            상위 보고
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onAction('dismiss')}
          >
            기각
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onAction('contact_user')}
          >
            사용자 연락
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportDetail;