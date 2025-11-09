import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock } from 'lucide-react';

interface PendingGradingCounterProps {
  count: number;
}

export function PendingGradingCounter({ count }: PendingGradingCounterProps) {
  if (count === 0) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <Clock className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          모든 제출물이 채점되었습니다. 잘하셨어요!
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-orange-500" />
            <h3 className="text-lg font-semibold">채점 대기 중</h3>
          </div>
          <span className="text-2xl font-bold text-orange-600">{count}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {count}개의 제출물이 당신의 검토를 기다리고 있습니다.
        </p>
      </CardContent>
    </Card>
  );
}