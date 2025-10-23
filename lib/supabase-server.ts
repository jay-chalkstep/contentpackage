import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client using service role key
 * This bypasses Row Level Security (RLS) policies and should only be used in API routes
 * where you manually verify user permissions.
 *
 * IMPORTANT: Never expose this client to the browser!
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceRoleKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is not set. Server-side operations may fail.');
}

export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
