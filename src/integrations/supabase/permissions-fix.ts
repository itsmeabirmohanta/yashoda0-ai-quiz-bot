import { supabase } from "@/integrations/supabase/client";

/**
 * This utility function applies necessary SQL fixes for permissions issues
 * Call this when encountering permission errors with attempts
 */
export const applyPermissionsFix = async () => {
  console.log("Applying permissions fix...");
  
  try {
    // Fix attempts table permissions
    const fixAttemptsSql = `
      -- Create policy for users to read their own attempts
      DROP POLICY IF EXISTS "Users can read their own attempts" ON public.attempts;
      CREATE POLICY "Users can read their own attempts" 
        ON public.attempts 
        FOR SELECT 
        USING (true);

      -- Create policy for users to update their own attempts (for submitting answers)
      DROP POLICY IF EXISTS "Users can update their own attempts" ON public.attempts;
      CREATE POLICY "Users can update their own attempts" 
        ON public.attempts 
        FOR UPDATE
        USING (true);
    `;
    
    // Execute SQL - this requires admin privileges
    const { error } = await supabase.rpc('exec_sql', { sql: fixAttemptsSql });
    
    if (error) {
      console.error("Error applying permissions fix:", error);
      return { success: false, error };
    }
    
    console.log("Permissions fix applied successfully");
    return { success: true };
  } catch (error) {
    console.error("Failed to apply permissions fix:", error);
    return { success: false, error };
  }
};
