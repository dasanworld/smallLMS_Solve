'use client';

import { AssignmentWithSubmission } from '../hooks/useLearnerAssignmentsQuery';
import AssignmentCard from './AssignmentCard';

interface AssignmentListProps {
  assignments: AssignmentWithSubmission[];
  onSelectAssignment: (assignmentId: string) => void;
  emptyMessage?: string;
}

export function AssignmentList({
  assignments,
  onSelectAssignment,
  emptyMessage = '과제가 없습니다',
}: AssignmentListProps) {
  if (assignments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-12 text-center">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {assignments.map((assignment) => (
        <AssignmentCard
          key={assignment.id}
          assignment={assignment}
          onSelect={() => onSelectAssignment(assignment.id)}
        />
      ))}
    </div>
  );
}

export default AssignmentList;
