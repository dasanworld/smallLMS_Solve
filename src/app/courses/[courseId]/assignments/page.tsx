"use client";

import { useParams } from "next/navigation";
import { AssignmentList } from "../components/assignment-list";

export default function AssignmentManagementPage() {
  const { courseId } = useParams();

  // Ensure courseId is a string
  const courseIdString = Array.isArray(courseId) ? courseId[0] : courseId;

  if (!courseIdString) {
    return <div>Course ID is required</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <AssignmentList courseId={courseIdString} />
    </div>
  );
}