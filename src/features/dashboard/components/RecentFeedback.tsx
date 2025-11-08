'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Calendar, Award } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { type FeedbackSummary } from '@/features/dashboard/lib/dto';

interface RecentFeedbackProps {
  feedbacks: FeedbackSummary[];
}

export const RecentFeedback = ({ feedbacks }: RecentFeedbackProps) => {
  if (feedbacks.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-slate-500">
          최근 피드백이 없습니다
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>최근 피드백</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {feedbacks.map((feedback) => {
            let formattedDate = '날짜 없음';
            if (feedback.gradedAt) {
              formattedDate = format(parseISO(feedback.gradedAt), 'MM월 dd일', { locale: ko });
            }

            return (
              <div key={feedback.id} className="flex items-start border-b pb-3 last:border-b-0 last:pb-0">
                <div className="flex-shrink-0 mr-4 mt-1">
                  <div className="bg-slate-100 p-2 rounded-full">
                    <MessageCircle className="h-5 w-5 text-slate-600" />
                  </div>
                </div>
                
                <div className="flex-grow min-w-0">
                  <h3 className="font-medium truncate">{feedback.assignmentTitle}</h3>
                  <p className="text-sm text-slate-500 truncate">{feedback.courseTitle}</p>
                  
                  <div className="mt-2">
                    {feedback.feedback ? (
                      <p className="text-sm text-slate-700 line-clamp-2">{feedback.feedback}</p>
                    ) : (
                      <p className="text-sm text-slate-500 italic">피드백이 없습니다</p>
                    )}
                  </div>
                  
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {feedback.score !== undefined && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        <span>{feedback.score}점</span>
                      </Badge>
                    )}
                    
                    <div className="flex items-center text-sm text-slate-600">
                      <Calendar className="mr-1 h-4 w-4" />
                      <span>{formattedDate}</span>
                    </div>
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