'use client';

import { GradeAssignment } from '@/features/grade/lib/dto';

interface AssignmentGradeCardProps {
  assignment: GradeAssignment;
}

export const AssignmentGradeCard = ({ assignment }: AssignmentGradeCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'graded':
        return 'bg-green-100 text-green-800';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'resubmission_required':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900 truncate">{assignment.assignmentTitle}</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(assignment.status)}`}>
              {assignment.status.replace('_', ' ')}
            </span>
            {assignment.isLate && (
              <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                Late
              </span>
            )}
            {assignment.isResubmission && (
              <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                Resubmitted
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {assignment.assignmentDescription}
          </p>
        </div>
        
        <div className="text-right ml-4">
          <div className="text-lg font-semibold text-gray-900">
            {assignment.score !== null ? `${assignment.score}%` : 'N/A'}
          </div>
          <div className="text-xs text-gray-500">
            Weight: {assignment.pointsWeight}%
          </div>
        </div>
      </div>
      
      {assignment.gradedAt && (
        <div className="mt-2 text-sm text-gray-500">
          Graded on: {formatDate(assignment.gradedAt)}
        </div>
      )}
      
      {assignment.feedback && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-900">Instructor Feedback</h4>
          <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
            {assignment.feedback}
          </div>
        </div>
      )}
    </div>
  );
};