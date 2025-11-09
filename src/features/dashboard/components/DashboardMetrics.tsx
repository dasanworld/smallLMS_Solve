import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, FileText, Clock } from 'lucide-react';

interface DashboardMetricsProps {
  coursesCount: number;
  pendingGradingCount: number;
  enrollmentCount: number;
  assignmentCount: number;
}

export function DashboardMetrics({ 
  coursesCount, 
  pendingGradingCount, 
  enrollmentCount, 
  assignmentCount 
}: DashboardMetricsProps) {
  const metrics = [
    {
      title: '코스',
      value: coursesCount,
      icon: BookOpen,
      description: '관리 중인 총 코스',
    },
    {
      title: '학생',
      value: enrollmentCount,
      icon: Users,
      description: '수강 중인 총 학생',
    },
    {
      title: '과제',
      value: assignmentCount,
      icon: FileText,
      description: '생성된 총 과제',
    },
    {
      title: '채점 대기 중',
      value: pendingGradingCount,
      icon: Clock,
      description: '채점 대기 중인 제출물',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">{metric.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}