'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, FileText } from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { type AssignmentInfo } from '@/features/dashboard/lib/dto';

interface UpcomingAssignmentsProps {
  assignments: AssignmentInfo[];
}

export const UpcomingAssignments = ({ assignments }: UpcomingAssignmentsProps) => {
  if (assignments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-slate-500">
          다가오는 과제가 없습니다
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>과제 목록</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const dueDate = new Date(assignment.dueDate);
            const isLate = assignment.isLate || false;
            let dateLabel = format(dueDate, 'MM월 dd일', { locale: ko });
            
            if (isToday(dueDate)) {
              dateLabel = '오늘';
            } else if (isTomorrow(dueDate)) {
              dateLabel = '내일';
            }

            return (
              <div key={assignment.id} className="flex items-center border-b pb-3 last:border-b-0 last:pb-0">
                <div className="flex-shrink-0 mr-4">
                  <div className="bg-slate-100 p-2 rounded-full">
                    <FileText className="h-5 w-5 text-slate-600" />
                  </div>
                </div>
                
                <div className="flex-grow min-w-0">
                  <h3 className="font-medium truncate">{assignment.title}</h3>
                  <p className="text-sm text-slate-500 truncate">{assignment.courseTitle}</p>
                  
                  <div className="mt-2 flex flex-wrap gap-2">
                    <div className="flex items-center text-sm text-slate-600">
                      <Calendar className="mr-1 h-4 w-4" />
                      <span>{dateLabel}</span>
                    </div>
                    
                    <Badge variant={isLate ? 'destructive' : 'secondary'}>
                      {isLate ? '지각' : assignment.status === 'graded' ? '채점 완료' : 
                       assignment.status === 'submitted' ? '제출 완료' : '미제출'}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};