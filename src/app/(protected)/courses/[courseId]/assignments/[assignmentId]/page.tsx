import AssignmentDetail from '@/features/assignment/detail/components/AssignmentDetail';
import { notFound } from 'next/navigation';

interface AssignmentDetailPageProps {
  params: {
    courseId: string;
    assignmentId: string;
  };
}

export default function AssignmentDetailPage({ params }: AssignmentDetailPageProps) {
  const { courseId, assignmentId } = params;

  // Validate the IDs format if needed
  if (!courseId || !assignmentId) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <AssignmentDetail assignmentId={assignmentId} />
    </div>
  );
}