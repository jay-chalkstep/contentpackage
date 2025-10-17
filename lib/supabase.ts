import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Storage bucket names
export const LOGOS_BUCKET = 'logos';
export const CARD_TEMPLATES_BUCKET = 'card-templates';
export const CARD_MOCKUPS_BUCKET = 'card-mockups';

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
  is_uploaded?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CardTemplate {
  id: string;
  template_name: string;
  template_url: string;
  file_type?: string;
  file_size?: number;
  uploaded_date: string;
  created_at: string;
  updated_at: string;
}

export interface CardMockup {
  id: string;
  mockup_name: string;
  logo_id: string;
  template_id: string;
  logo_x: number; // Percentage from left
  logo_y: number; // Percentage from top
  logo_scale: number; // Logo width as percentage of card width
  mockup_image_url?: string;
  created_at: string;
  updated_at: string;
  // Joined data (optional, populated when fetching with joins)
  logo?: Logo;
  template?: CardTemplate;
}