import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Logo {
  id: string;
  company_name: string;
  domain?: string;
  logo_url: string;
  logo_type?: string;
  logo_format?: string;
  background_color?: string;
  accent_color?: string;
  created_at: string;
  updated_at: string;
}