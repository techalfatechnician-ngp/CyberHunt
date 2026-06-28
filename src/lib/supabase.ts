import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// We use the service role key to bypass RLS since all our operations are server-side.
// WARNING: Never expose the service role key on the client!
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn("Missing Supabase environment variables. Database operations will fail.");
}

export const supabase = createClient(supabaseUrl || "", supabaseServiceRoleKey || "", {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
