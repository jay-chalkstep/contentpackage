import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Storage bucket names
export const LOGOS_BUCKET = 'logos';
export const CARD_TEMPLATES_BUCKET = 'card-templates';
export const CARD_MOCKUPS_BUCKET = 'card-mockups';

// Database types
export interface BrandColor {
  id: string;
  logo_id?: string; // deprecated - will migrate to brand_id
  brand_id?: string;
  hex: string;
  type?: string;
  brightness?: number;
  created_at: string;
  updated_at: string;
}

export interface BrandFont {
  id: string;
  logo_id?: string; // deprecated - will migrate to brand_id
  brand_id?: string;
  font_name: string;
  font_type?: string;
  origin?: string;
  created_at: string;
  updated_at: string;
}

export interface LogoVariant {
  id: string;
  brand_id: string;
  organization_id: string;
  logo_url: string;
  logo_type?: string; // icon, logo, symbol, etc.
  logo_format?: string; // png, svg, jpg, etc.
  theme?: string; // light, dark
  width?: number;
  height?: number;
  file_size?: number;
  background_color?: string;
  accent_color?: string;
  is_uploaded?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  company_name: string;
  domain: string;
  organization_id: string;
  description?: string;
  primary_logo_variant_id?: string;
  created_at: string;
  updated_at: string;
  // Optional related data
  logo_variants?: LogoVariant[];
  brand_colors?: BrandColor[];
  brand_fonts?: BrandFont[];
  primary_logo_variant?: LogoVariant;
}

// Deprecated: Use Brand + LogoVariant instead
export interface Logo {
  id: string;
  company_name: string;
  domain?: string;
  description?: string;
  logo_url: string;
  logo_type?: string;
  logo_format?: string;
  theme?: string;
  width?: number;
  height?: number;
  file_size?: number;
  background_color?: string;
  accent_color?: string;
  is_uploaded?: boolean;
  created_at: string;
  updated_at: string;
  brand_colors?: BrandColor[];
  brand_fonts?: BrandFont[];
}

export interface CardTemplate {
  id: string;
  template_name: string;
  template_url: string;
  organization_id: string;
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
  organization_id: string;
  created_by?: string; // Clerk user ID (added in 04 migration)
  folder_id?: string; // Folder organization (added in 04 migration)
  project_id?: string; // Project organization (added in 07 migration)
  logo_x: number; // Percentage from left
  logo_y: number; // Percentage from top
  logo_scale: number; // Logo width as percentage of card width
  mockup_image_url?: string;
  created_at: string;
  updated_at: string;
  // Joined data (optional, populated when fetching with joins)
  logo?: Logo;
  template?: CardTemplate;
  folder?: Folder;
  project?: Project;
}

export interface Folder {
  id: string;
  name: string;
  created_by: string; // Clerk user ID
  organization_id: string;
  parent_folder_id?: string;
  is_org_shared: boolean;
  created_at: string;
  updated_at: string;
  // Computed data (optional)
  mockup_count?: number;
  subfolders?: Folder[];
}

export type ProjectStatus = 'active' | 'completed' | 'archived';

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  client_name?: string;
  description?: string;
  status: ProjectStatus;
  color: string; // Hex color for UI customization
  created_by: string; // Clerk user ID
  created_at: string;
  updated_at: string;
  // Computed fields (from JOINs or aggregates)
  mockup_count?: number;
  mockup_previews?: Array<{
    id: string;
    mockup_name: string;
    mockup_image_url: string;
  }>;
}