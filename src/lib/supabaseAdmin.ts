import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceKey) {
  console.error("[supabaseAdmin] SUPABASE_SERVICE_ROLE_KEY is not set. Storage uploads will fail.");
}

/**
 * Server-only Supabase admin client.
 * Uses the service_role key which bypasses RLS — NEVER expose to client.
 */
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || "", {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export default supabaseAdmin;
