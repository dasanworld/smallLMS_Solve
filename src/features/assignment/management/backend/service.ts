import { Database } from "@/types/supabase";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AssignmentManagementError, ASSIGNMENT_MANAGEMENT_ERROR_CODES } from "./error";

// Type definitions
type Assignment = Database["public"]["Tables"]["assignments"]["Row"];
type NewAssignment = Database["public"]["Tables"]["assignments"]["Insert"];
type UpdateAssignment = Database["public"]["Tables"]["assignments"]["Update"];

export type AssignmentErrorCode = keyof typeof ASSIGNMENT_MANAGEMENT_ERROR_CODES;

/**
 * Creates a new assignment with validation
 */
export async function createAssignmentService(
  userId: string,
  courseId: string,
  assignmentData: Omit<NewAssignment, "id" | "created_at" | "updated_at" | "published_at" | "closed_at" | "deleted_at">
): Promise<Assignment> {
  const supabase = await createClient();

  // Verify user is instructor of the course
  const { data: courseData, error: courseError } = await supabase
    .from("courses")
    .select("id, instructor_id")
    .eq("id", courseId)
    .single();

  if (courseError || !courseData) {
    throw new AssignmentManagementError("Course not found", "COURSE_NOT_FOUND");
  }

  if (courseData.instructor_id !== userId) {
    throw new AssignmentManagementError("Insufficient permissions", "INSUFFICIENT_PERMISSIONS");
  }

  // Validate assignment weight constraints
  await validateAssignmentWeightsService(courseId, assignmentData.points_weight);

  // Create the assignment
  const { data, error } = await supabase
    .from("assignments")
    .insert([{ ...assignmentData, course_id: courseId }])
    .select()
    .single();

  if (error) {
    throw new AssignmentError(error.message, "ASSIGNMENT_NOT_FOUND");
  }

  // Revalidate the course assignments page
  revalidatePath(`/courses/${courseId}/assignments`);

  return data;
}

/**
 * Updates an existing assignment
 */
export async function updateAssignmentService(
  userId: string,
  assignmentId: string,
  assignmentData: Partial<UpdateAssignment>
): Promise<Assignment> {
  const supabase = await createClient();

  // Get the current assignment to check ownership and existing values
  const { data: currentAssignment, error: fetchError } = await supabase
    .from("assignments")
    .select("*, courses(instructor_id)")
    .eq("id", assignmentId)
    .single();

  if (fetchError || !currentAssignment) {
    throw new AssignmentManagementError("Assignment not found", "ASSIGNMENT_NOT_FOUND");
  }

  // Check if user is the instructor of the course
  if (currentAssignment.courses.instructor_id !== userId) {
    throw new AssignmentManagementError("Insufficient permissions", "INSUFFICIENT_PERMISSIONS");
  }

  // If updating points_weight, validate the new weight
  let newWeight: number | undefined;
  if (assignmentData.points_weight !== undefined) {
    // Calculate the difference between old and new weight
    const weightDiff = assignmentData.points_weight - (currentAssignment.points_weight || 0);
    
    // Validate with the difference
    await validateAssignmentWeightsService(
      currentAssignment.course_id,
      weightDiff,
      assignmentId
    );
  }

  // If updating status to published, check if deadline is in the future
  if (assignmentData.status === "published" && currentAssignment.due_date) {
    const dueDate = new Date(currentAssignment.due_date);
    if (dueDate <= new Date()) {
      throw new AssignmentManagementError(
        "Published assignment deadline must be in the future",
        "ASSIGNMENT_PAST_DEADLINE"
      );
    }
  }

  // Update the assignment
  const { data, error } = await supabase
    .from("assignments")
    .update(assignmentData)
    .eq("id", assignmentId)
    .select()
    .single();

  if (error) {
    throw new AssignmentError(error.message, "ASSIGNMENT_NOT_FOUND");
  }

  // Revalidate the course assignments page
  revalidatePath(`/courses/${currentAssignment.course_id}/assignments`);
  revalidatePath(`/assignments/${assignmentId}`);

  return data;
}

/**
 * Soft deletes an assignment
 */
export async function deleteAssignmentService(
  userId: string,
  assignmentId: string
): Promise<void> {
  const supabase = await createClient();

  // Get the assignment to check ownership
  const { data: assignment, error: fetchError } = await supabase
    .from("assignments")
    .select("*, courses(instructor_id)")
    .eq("id", assignmentId)
    .single();

  if (fetchError || !assignment) {
    throw new AssignmentManagementError("Assignment not found", "ASSIGNMENT_NOT_FOUND");
  }

  if (assignment.courses.instructor_id !== userId) {
    throw new AssignmentManagementError("Insufficient permissions", "INSUFFICIENT_PERMISSIONS");
  }

  // Soft delete the assignment
  const { error } = await supabase
    .from("assignments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", assignmentId);

  if (error) {
    throw new AssignmentManagementError(error.message, "ASSIGNMENT_NOT_FOUND");
  }

  // Revalidate the course assignments page
  revalidatePath(`/courses/${assignment.course_id}/assignments`);
}

/**
 * Updates assignment status
 */
export async function updateAssignmentStatusService(
  userId: string,
  assignmentId: string,
  status: "draft" | "published" | "closed"
): Promise<Assignment> {
  const supabase = await createClient();

  // Get the assignment to check ownership and current status
  const { data: assignment, error: fetchError } = await supabase
    .from("assignments")
    .select("*, courses(instructor_id, title)")
    .eq("id", assignmentId)
    .single();

  if (fetchError || !assignment) {
    throw new AssignmentManagementError("Assignment not found", "ASSIGNMENT_NOT_FOUND");
  }

  if (assignment.courses.instructor_id !== userId) {
    throw new AssignmentManagementError("Insufficient permissions", "INSUFFICIENT_PERMISSIONS");
  }

  // If changing to published, ensure deadline is in the future
  if (status === "published" && assignment.due_date) {
    const dueDate = new Date(assignment.due_date);
    if (dueDate <= new Date()) {
      throw new AssignmentManagementError(
        "Published assignment deadline must be in the future",
        "ASSIGNMENT_PAST_DEADLINE"
      );
    }
  }

  // Update the status and set published_at if changing to published
  const updateData: Partial<UpdateAssignment> = { status };
  if (status === "published" && !assignment.published_at) {
    updateData.published_at = new Date().toISOString();
  }
  if (status === "closed") {
    updateData.closed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("assignments")
    .update(updateData)
    .eq("id", assignmentId)
    .select()
    .single();

  if (error) {
    throw new AssignmentError(error.message, "ASSIGNMENT_NOT_FOUND");
  }

  // Revalidate the course assignments page
  revalidatePath(`/courses/${assignment.course_id}/assignments`);
  revalidatePath(`/assignments/${assignmentId}`);

  return data;
}

/**
 * Gets all assignments for a course
 */
export async function getCourseAssignmentsService(
  userId: string,
  courseId: string
): Promise<Assignment[]> {
  const supabase = await createClient();

  // Verify user has access to the course (instructor or enrolled student)
  const { data: courseData, error: courseError } = await supabase
    .from("courses")
    .select("id, instructor_id")
    .eq("id", courseId)
    .single();

  if (courseError || !courseData) {
    throw new AssignmentManagementError("Course not found", "COURSE_NOT_FOUND");
  }

  // Check if user is instructor or enrolled student
  const isStudent = await checkStudentEnrollment(userId, courseId, supabase);
  const isOwner = courseData.instructor_id === userId;

  if (!isOwner && !isStudent) {
    throw new AssignmentManagementError("Insufficient permissions", "INSUFFICIENT_PERMISSIONS");
  }

  // Query assignments
  let query = supabase
    .from("assignments")
    .select("*")
    .eq("course_id", courseId)
    .is("deleted_at", null);

  // If user is student, only show published assignments
  if (!isOwner) {
    query = query.eq("status", "published");
  }

  const { data, error } = await query
    .order("created_at", { ascending: false });

  if (error) {
    throw new AssignmentError(error.message, "ASSIGNMENT_NOT_FOUND");
  }

  return data;
}

/**
 * Gets detailed assignment information
 */
export async function getAssignmentDetailsService(
  userId: string,
  assignmentId: string
): Promise<Assignment> {
  const supabase = await createClient();

  // Get the assignment with course information
  const { data: assignment, error: fetchError } = await supabase
    .from("assignments")
    .select("*, courses(instructor_id)")
    .eq("id", assignmentId)
    .single();

  if (fetchError || !assignment) {
    throw new AssignmentManagementError("Assignment not found", "ASSIGNMENT_NOT_FOUND");
  }

  // Check if user is instructor of the course or enrolled student
  const isStudent = await checkStudentEnrollment(userId, assignment.course_id, supabase);
  const isOwner = assignment.courses.instructor_id === userId;

  if (!isOwner && !isStudent) {
    throw new AssignmentManagementError("Insufficient permissions", "INSUFFICIENT_PERMISSIONS");
  }

  // If user is student, only allow access to published assignments
  if (!isOwner && assignment.status !== "published") {
    throw new AssignmentManagementError("Insufficient permissions", "INSUFFICIENT_PERMISSIONS");
  }

  return assignment;
}

/**
 * Validates assignment weight constraints for a course
 * If newWeight is provided, it adds that to the calculation
 * If excludeAssignmentId is provided, it excludes that assignment from the calculation
 */
export async function validateAssignmentWeightsService(
  courseId: string,
  newWeight?: number,
  excludeAssignmentId?: string
): Promise<boolean> {
  const supabase = await createClient();

  // Get all assignments for the course (excluding deleted and optionally excluding a specific one)
  let query = supabase
    .from("assignments")
    .select("points_weight")
    .eq("course_id", courseId)
    .is("deleted_at", null);

  if (excludeAssignmentId) {
    query = query.neq("id", excludeAssignmentId);
  }

  const { data, error } = await query;

  if (error) {
    throw new AssignmentManagementError(error.message, "COURSE_NOT_FOUND");
  }

  // Calculate total weight
  const totalWeight = data.reduce((sum, assignment) => 
    sum + (assignment.points_weight || 0), 0
  );

  // Add new weight if provided
  const finalWeight = newWeight ? totalWeight + newWeight : totalWeight;

  // Check if total exceeds 1.0 (100%)
  if (finalWeight > 1.0) {
    throw new AssignmentManagementError(
      "Total assignment weights in course cannot exceed 100%",
      "ASSIGNMENT_WEIGHT_EXCEEDED"
    );
  }

  return true;
}

/**
 * Helper function to check if a student is enrolled in a course
 */
async function checkStudentEnrollment(
  userId: string,
  courseId: string,
  supabase: any
): Promise<boolean> {
  const { data, error } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .single();

  return !error && !!data;
}