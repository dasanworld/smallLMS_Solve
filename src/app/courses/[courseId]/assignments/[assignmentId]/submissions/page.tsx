"use client";

import { useParams } from "next/navigation";
import { SubmissionList } from "../../../components/submission-list";

export default function AssignmentSubmissionsPage() {
  const { assignmentId } = useParams();

  // Ensure assignmentId is a string
  const assignmentIdString = Array.isArray(assignmentId) ? assignmentId[0] : assignmentId;

  if (!assignmentIdString) {
    return <div>Assignment ID is required</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <SubmissionList assignmentId={assignmentIdString} />
    </div>
  );
}