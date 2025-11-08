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
      title: 'Courses',
      value: coursesCount,
      icon: BookOpen,
      description: 'Total courses you manage',
    },
    {
      title: 'Students',
      value: enrollmentCount,
      icon: Users,
      description: 'Total enrolled students',
    },
    {
      title: 'Assignments',
      value: assignmentCount,
      icon: FileText,
      description: 'Total assignments created',
    },
    {
      title: 'Pending Grading',
      value: pendingGradingCount,
      icon: Clock,
      description: 'Submissions awaiting grading',
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