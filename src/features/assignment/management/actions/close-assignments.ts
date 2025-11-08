"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * Server action to automatically close past-deadline assignments
 * This function can be called by a scheduled job (e.g., cron job)
 */
export async function closePastDeadlineAssignments() {
  const supabase = await createClient();

  try {
    // Call the database function that closes past-deadline assignments
    const { data, error } = await supabase
      .rpc('close_past_deadline_assignments');

    if (error) {
      console.error("Error closing past deadline assignments:", error);
      throw new Error(`Failed to close past deadline assignments: ${error.message}`);
    }

    console.log("Successfully closed past deadline assignments");
    return { success: true, message: "Successfully closed past deadline assignments" };
  } catch (error) {
    console.error("Error in closePastDeadlineAssignments:", error);
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
  }
}