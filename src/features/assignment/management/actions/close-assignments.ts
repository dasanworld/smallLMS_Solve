"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * Server action to automatically close past-deadline assignments
 * This function can be called by a scheduled job (e.g., cron job)
 */
export async function closePastDeadlineAssignments() {
  const supabase = await createClient();

  try {
    console.log("Starting auto-close process for past deadline assignments");
    
    // Call the database function that closes past-deadline assignments
    const { data, error } = await supabase
      .rpc('close_past_deadline_assignments');

    if (error) {
      console.error("Error closing past deadline assignments:", error);
      return { 
        success: false, 
        message: `Failed to close past deadline assignments: ${error.message}`,
        count: 0
      };
    }

    const closedCount = Array.isArray(data) ? data.length : 0;
    console.log(`Successfully closed ${closedCount} past deadline assignments`);
    
    return { 
      success: true, 
      message: `Successfully closed ${closedCount} past deadline assignments`, 
      count: closedCount 
    };
  } catch (error) {
    console.error("Error in closePastDeadlineAssignments:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Unknown error",
      count: 0
    };
  }
}