import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Users, 
  FileText, 
  Eye, 
  Edit,
  Archive,
  ExternalLink
} from 'lucide-react';

interface CourseStatusCardProps {
  course: {
    id: string;
    title: string;
    status: 'draft' | 'published' | 'archived';
    enrollmentCount: number;
    assignmentCount: number;
    createdAt?: string;
  };
}

export function CourseStatusCard({ course }: CourseStatusCardProps) {
  const statusColors = {
    draft: 'bg-gray-500',
    published: 'bg-green-500',
    archived: 'bg-red-500',
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{course.title}</h3>
              <Badge variant="outline" className={`${statusColors[course.status]} text-white`}>
                {course.status}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{course.enrollmentCount} students</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{course.assignmentCount} assignments</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 p-4 pt-0">
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        {course.status !== 'archived' && (
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
            <Archive className="h-4 w-4 mr-1" />
            Archive
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}