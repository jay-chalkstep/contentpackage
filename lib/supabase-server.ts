import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client using service role key
 * This bypasses Row Level Security (RLS) policies and should only be used in API routes
 * where you manually verify user permissions.
 *
 * IMPORTANT: Never expose this client to the browser!
 */

let supabaseServerInstance: SupabaseClient | null = null;

/**
 * Get or create the server-side Supabase client
 * Uses lazy initialization to avoid issues during build time
 */
function getSupabaseServer(): SupabaseClient {
  if (!supabaseServerInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set. Please check your environment variables.');
    }

    if (!supabaseServiceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Server-side operations require this.');
    }

    supabaseServerInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return supabaseServerInstance;
}

/**
 * Export a proxy that lazily initializes the Supabase client
 * This maintains backward compatibility with existing code that uses `supabaseServer`
 */
export const supabaseServer = new Proxy({} as SupabaseClient, {
  get(target, prop, receiver) {
    const client = getSupabaseServer();
    const value = client[prop as keyof SupabaseClient];

    // If the property is a function, bind it to the client instance
    if (typeof value === 'function') {
      return value.bind(client);
    }

    return value;
  }
});