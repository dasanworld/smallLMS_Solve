import { Database } from "@/types/supabase";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { SubmissionManagementError, SUBMISSION_MANAGEMENT_ERROR_CODES } from "./error";

// Type definitions
type Submission = Database["public"]["Tables"]["submissions"]["Row"];
type NewSubmission = Database["public"]["Tables"]["submissions"]["Insert"];
type UpdateSubmission = Database["public"]["Tables"]["submissions"]["Update"];

export type SubmissionErrorCode = keyof typeof SUBMISSION_MANAGEMENT_ERROR_CODES;

/**
 * Gets all submissions for an assignment
 */
export async function getAssignmentSubmissionsService(
  userId: string,
  assignmentId: string
): Promise<Submission[]> {
  const supabase = await createClient();

  // Get the assignment to check if user is instructor
  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .select("*, courses(instructor_id)")
    .eq("id", assignmentId)
    .single();

  if (assignmentError || !assignment) {
    throw new SubmissionError("Assignment not found", "ASSIGNMENT_NOT_FOUND");
  }

  // Check if user is the instructor of the course
  if (assignment.courses.instructor_id !== userId) {
    throw new SubmissionError("Insufficient permissions", "INSUFFICIENT_PERMISSIONS");
  }

  // Get all submissions for the assignment
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("assignment_id", assignmentId)
    .order("submitted_at", { ascending: false });

  if (error) {
    throw new SubmissionError(error.message, "SUBMISSION_NOT_FOUND");
  }

  return data;
}

/**
 * Updates submission status
 */
export async function updateSubmissionStatusService(
  userId: string,
  submissionId: string,
  status: "pending" | "graded" | "resubmission_required"
): Promise<Submission> {
  const supabase = await createClient();

  // Get the submission with assignment and course info
  const { data: submission, error: fetchError } = await supabase
    .from("submissions")
    .select("*, assignments!inner(*, courses(instructor_id))")
    .eq("id", submissionId)
    .single();

  if (fetchError || !submission) {
    throw new SubmissionError("Submission not found", "SUBMISSION_NOT_FOUND");
  }

  // Check if user is the instructor of the course
  if (submission.assignments.courses.instructor_id !== userId) {
    throw new SubmissionError("Insufficient permissions", "INSUFFICIENT_PERMISSIONS");
  }

  // Update the submission status
  const { data, error } = await supabase
    .from("submissions")
    .update({ status })
    .eq("id", submissionId)
    .select()
    .single();

  if (error) {
    throw new SubmissionError(error.message, "SUBMISSION_NOT_FOUND");
  }

  // Revalidate the assignment submissions page
  revalidatePath(`/assignments/${submission.assignment_id}/submissions`);

  return data;
}

/**
 * Grades a submission
 */
export async function gradeSubmissionService(
  userId: string,
  submissionId: string,
  grade: number,
  feedback?: string
): Promise<Submission> {
  const supabase = await createClient();

  // Get the submission with assignment and course info
  const { data: submission, error: fetchError } = await supabase
    .from("submissions")
    .select("*, assignments!inner(*, courses(instructor_id))")
    .eq("id", submissionId)
    .single();

  if (fetchError || !submission) {
    throw new SubmissionError("Submission not found", "SUBMISSION_NOT_FOUND");
  }

  // Check if user is the instructor of the course
  if (submission.assignments.courses.instructor_id !== userId) {
    throw new SubmissionError("Insufficient permissions", "INSUFFICIENT_PERMISSIONS");
  }

  // Update the submission with grade and feedback
  const { data, error } = await supabase
    .from("submissions")
    .update({
      grade,
      feedback,
      status: "graded",
      graded_at: new Date().toISOString(),
    })
    .eq("id", submissionId)
    .select()
    .single();

  if (error) {
    throw new SubmissionError(error.message, "SUBMISSION_NOT_FOUND");
  }

  // Revalidate the assignment submissions page
  revalidatePath(`/assignments/${submission.assignment_id}/submissions`);

  return data;
}

/**
 * Gets submission statistics for an assignment
 */
export async function getSubmissionStatsService(
  userId: string,
  assignmentId: string
): Promise<{
  totalSubmissions: number;
  gradedSubmissions: number;
  pendingSubmissions: number;
  averageGrade: number | null;
}> {
  const supabase = await createClient();

  // Get the assignment to check if user is instructor
  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .select("*, courses(instructor_id)")
    .eq("id", assignmentId)
    .single();

  if (assignmentError || !assignment) {
    throw new SubmissionError("Assignment not found", "ASSIGNMENT_NOT_FOUND");
  }

  // Check if user is the instructor of the course
  if (assignment.courses.instructor_id !== userId) {
    throw new SubmissionError("Insufficient permissions", "INSUFFICIENT_PERMISSIONS");
  }

  // Get submission statistics
  const { count: totalSubmissions } = await supabase
    .from("submissions")
    .select("*", { count: "exact", head: true })
    .eq("assignment_id", assignmentId);

  const { count: gradedSubmissions } = await supabase
    .from("submissions")
    .select("*", { count: "exact", head: true })
    .eq("assignment_id", assignmentId)
    .eq("status", "graded");

  const { count: pendingSubmissions } = await supabase
    .from("submissions")
    .select("*", { count: "exact", head: true })
    .eq("assignment_id", assignmentId)
    .eq("status", "pending");

  // Calculate average grade
  const { data: gradesData, error: gradesError } = await supabase
    .from("submissions")
    .select("grade")
    .eq("assignment_id", assignmentId)
    .not("grade", "is", null);

  if (gradesError) {
    throw new SubmissionError(gradesError.message, "SUBMISSION_NOT_FOUND");
  }

  let averageGrade: number | null = null;
  if (gradesData.length > 0) {
    const totalGrade = gradesData.reduce((sum, sub) => sum + (sub.grade || 0), 0);
    averageGrade = totalGrade / gradesData.length;
  }

  return {
    totalSubmissions: totalSubmissions || 0,
    gradedSubmissions: gradedSubmissions || 0,
    pendingSubmissions: pendingSubmissions || 0,
    averageGrade,
  };
}

/**
 * Submits an assignment (for students)
 */
export async function submitAssignmentService(
  userId: string,
  assignmentId: string,
  content: string
): Promise<Submission> {
  const supabase = await createClient();

  // Get the assignment to check if it's open and if student is enrolled
  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .select("*, courses(students(user_id))")
    .eq("id", assignmentId)
    .single();

  if (assignmentError || !assignment) {
    throw new SubmissionError("Assignment not found", "ASSIGNMENT_NOT_FOUND");
  }

  // Check if assignment is published and not closed
  if (assignment.status !== "published") {
    throw new SubmissionError("Assignment is not available", "ASSIGNMENT_CLOSED");
  }

  if (assignment.status === "closed") {
    throw new SubmissionError("Assignment is closed", "ASSIGNMENT_CLOSED");
  }

  // Check if user is enrolled in the course
  const isEnrolled = assignment.courses.students.some(student => student.user_id === userId);
  if (!isEnrolled) {
    throw new SubmissionError("Insufficient permissions", "INSUFFICIENT_PERMISSIONS");
  }

  // Check if user already submitted
  const { data: existingSubmission, error: existingError } = await supabase
    .from("submissions")
    .select("id")
    .eq("assignment_id", assignmentId)
    .eq("user_id", userId)
    .single();

  if (existingSubmission) {
    // If resubmission is allowed, update the existing submission
    if (assignment.allow_resubmission) {
      const { data, error } = await supabase
        .from("submissions")
        .update({
          content,
          submitted_at: new Date().toISOString(),
          status: "pending"
        })
        .eq("id", existingSubmission.id)
        .select()
        .single();

      if (error) {
        throw new SubmissionError(error.message, "SUBMISSION_NOT_FOUND");
      }

      return data;
    } else {
      throw new SubmissionError("Resubmission not allowed", "INSUFFICIENT_PERMISSIONS");
    }
  }

  // Create new submission
  const { data, error } = await supabase
    .from("submissions")
    .insert([{
      assignment_id: assignmentId,
      user_id: userId,
      content,
      status: "pending",
      submitted_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    throw new SubmissionError(error.message, "SUBMISSION_NOT_FOUND");
  }

  // Revalidate the assignment page
  revalidatePath(`/assignments/${assignmentId}`);

  return data;
}