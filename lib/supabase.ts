import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Client-side Supabase client with lazy initialization
 * Uses anon key for browser-safe operations with RLS policies
 */

let supabaseInstance: SupabaseClient | null = null;

/**
 * Get or create the client-side Supabase client
 * Uses lazy initialization to avoid issues during build time
 */
function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set. Please check your environment variables.');
    }

    if (!supabaseAnonKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Please check your environment variables.');
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseInstance;
}

/**
 * Export a proxy that lazily initializes the Supabase client
 * This maintains backward compatibility with existing code that uses `supabase`
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop, receiver) {
    const client = getSupabase();
    const value = client[prop as keyof SupabaseClient];

    // If the property is a function, bind it to the client instance
    if (typeof value === 'function') {
      return value.bind(client);
    }

    return value;
  }
});

// Storage bucket names
export const LOGOS_BUCKET = 'logos';
export const BRANDS_BUCKET = 'brands'; // New name for logos bucket
export const TEMPLATES_BUCKET = 'templates'; // New name for card-templates
export const ASSETS_BUCKET = 'assets'; // New name for card-mockups

// Deprecated: Use new bucket names above
export const CARD_TEMPLATES_BUCKET = TEMPLATES_BUCKET;
export const CARD_MOCKUPS_BUCKET = ASSETS_BUCKET;

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

// Modern interfaces (v3.5.0)
export interface Template {
  id: string;
  name: string;
  description?: string;
  canvas_data?: any; // JSON canvas configuration
  preview_url?: string;
  is_template: boolean;
  category?: string;
  tags?: string[];
  metadata?: any;
  usage_count: number;
  is_featured: boolean;
  organization_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  brand_id: string;
  name: string;
  description?: string;
  canvas_data?: any; // JSON canvas configuration
  preview_url?: string;
  tags?: string[];
  metadata?: any;
  is_featured: boolean;
  view_count: number;
  share_count: number;
  organization_id: string;
  created_by: string;
  folder_id?: string; // Folder organization
  project_id?: string; // Project organization
  created_at: string;
  updated_at: string;
  // Joined data (optional, populated when fetching with joins)
  brand?: Brand;
  folder?: Folder;
  project?: Project;
}

// Deprecated interfaces - Use Template and Asset instead
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
  asset_count?: number; // Renamed from mockup_count (v3.5.0)
  mockup_count?: number; // Deprecated: use asset_count
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
  workflow_id?: string; // Optional workflow template assignment
  created_by: string; // Clerk user ID
  created_at: string;
  updated_at: string;
  // Computed fields (from JOINs or aggregates)
  asset_count?: number; // Renamed from mockup_count (v3.5.0)
  mockup_count?: number; // Deprecated: use asset_count
  asset_previews?: Array<{ // Renamed from mockup_previews (v3.5.0)
    id: string;
    name: string;
    preview_url: string;
  }>;
  mockup_previews?: Array<{ // Deprecated: use asset_previews
    id: string;
    mockup_name: string;
    mockup_image_url: string;
  }>;
  workflow?: Workflow; // Populated via JOIN
}

// Workflow types
export type WorkflowStageColor = 'yellow' | 'green' | 'blue' | 'purple' | 'red' | 'orange' | 'gray';

export interface WorkflowStage {
  order: number;
  name: string;
  color: WorkflowStageColor;
}

export interface Workflow {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  stages: WorkflowStage[];
  is_default: boolean;
  is_archived: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  stage_count?: number;
  project_count?: number;
}

export interface ProjectStageReviewer {
  id: string;
  project_id: string;
  stage_order: number;
  user_id: string;
  user_name: string;
  user_image_url?: string;
  added_by: string;
  created_at: string;
}

// Stage progress types
export type StageStatus = 'pending' | 'in_review' | 'approved' | 'changes_requested';

// Modern interface (v3.5.0)
export interface AssetStageProgress {
  id: string;
  asset_id: string;
  project_id: string;
  stage_order: number;
  status: StageStatus;
  reviewed_by?: string;
  reviewed_by_name?: string;
  reviewed_at?: string;
  notes?: string;
  notification_sent: boolean;
  notification_sent_at?: string;
  created_at: string;
  updated_at: string;
}

// Deprecated: Use AssetStageProgress
export interface MockupStageProgress {
  id: string;
  asset_id: string; // Updated to match migration 13 (was mockup_id)
  project_id: string;
  stage_order: number;
  status: StageStatus;
  reviewed_by?: string;
  reviewed_by_name?: string;
  reviewed_at?: string;
  notes?: string;
  notification_sent: boolean;
  notification_sent_at?: string;
  created_at: string;
  updated_at: string;
}

// Helper type for UI - asset with stage progress (v3.5.0)
export interface AssetWithProgress extends Asset {
  progress?: AssetStageProgress[];
  current_stage?: number; // The stage currently in_review or last approved
  overall_status?: 'not_started' | 'in_progress' | 'approved' | 'changes_requested';
}

// Deprecated: Use AssetWithProgress
export interface MockupWithProgress extends CardMockup {
  progress?: MockupStageProgress[];
  current_stage?: number; // The stage currently in_review or last approved
  overall_status?: 'not_started' | 'in_progress' | 'approved' | 'changes_requested';
}

// Stage progress with workflow stage details (for display)
export interface AssetStageProgressWithDetails extends AssetStageProgress {
  stage_name?: string;
  stage_color?: WorkflowStageColor;
}

// Deprecated: Use AssetStageProgressWithDetails
export interface MockupStageProgressWithDetails extends MockupStageProgress {
  stage_name?: string;
  stage_color?: WorkflowStageColor;
}

// AI Features Types (Migration 11)

export interface AutoTags {
  visual: string[];
  colors: string[];
  composition: string[];
  brands: string[];
  objects: string[];
  confidence: number;
}

export interface AccessibilityScore {
  wcag_level: 'A' | 'AA' | 'AAA' | null;
  contrast_ratio: number | null;
  readability: number | null;
  issues: string[];
  suggestions: string[];
}

export interface ColorPalette {
  dominant: Array<{ hex: string; percentage: number }>;
  accent: Array<{ hex: string; percentage: number }>;
  neutral: Array<{ hex: string; percentage: number }>;
}

// Modern interface (v3.5.0)
export interface AssetAIMetadata {
  id: string;
  asset_id: string;
  auto_tags: AutoTags;
  accessibility_score: AccessibilityScore;
  extracted_text: string | null;
  color_palette: ColorPalette;
  embedding: number[] | null; // pgvector embedding (1536 dimensions)
  search_text: string | null;
  last_analyzed: string | null;
  analysis_version: string;
  created_at: string;
  updated_at: string;
}

// Deprecated: Use AssetAIMetadata
export interface MockupAIMetadata {
  id: string;
  mockup_id: string;
  auto_tags: AutoTags;
  accessibility_score: AccessibilityScore;
  extracted_text: string | null;
  color_palette: ColorPalette;
  embedding: number[] | null; // pgvector embedding (1536 dimensions)
  search_text: string | null;
  last_analyzed: string | null;
  analysis_version: string;
  created_at: string;
  updated_at: string;
}

export interface FolderSuggestion {
  id: string;
  asset_id: string; // Renamed from mockup_id (v3.5.0)
  mockup_id?: string; // Deprecated: use asset_id
  suggested_folder_id: string;
  confidence: number; // 0.00 to 1.00
  reason: string;
  accepted: boolean | null;
  user_id: string;
  created_at: string;
  // Populated via JOIN
  folder?: Folder;
}

export interface SearchQuery {
  id: string;
  query: string;
  query_embedding: number[] | null;
  natural_language: boolean;
  results_count: number | null;
  clicked_results: string[] | null; // Array of asset IDs
  user_id: string | null;
  org_id: string | null;
  created_at: string;
}

// Helper type - asset with AI metadata (v3.5.0)
export interface AssetWithAI extends Asset {
  ai_metadata?: AssetAIMetadata;
}

// Deprecated: Use AssetWithAI
export interface MockupWithAI extends CardMockup {
  ai_metadata?: MockupAIMetadata;
}

// Search result types (v3.5.0)
export interface SemanticSearchResult {
  id: string;
  name: string;
  preview_url: string;
  similarity: number;
  auto_tags: AutoTags;
  extracted_text: string | null;
  folder_id: string | null;
  project_id: string | null;
  created_at: string;
  // Deprecated fields (for backward compatibility)
  mockup_name?: string;
  mockup_image_url?: string;
}

export interface SimilarAssetResult {
  id: string;
  name: string;
  preview_url: string;
  similarity: number;
  auto_tags: AutoTags;
}

// Deprecated: Use SimilarAssetResult
export interface SimilarMockupResult {
  id: string;
  mockup_name: string;
  mockup_image_url: string;
  similarity: number;
  auto_tags: AutoTags;
}

export interface HybridSearchResult {
  id: string;
  name: string;
  preview_url: string;
  text_rank: number;
  vector_similarity: number;
  combined_score: number;
  auto_tags: AutoTags;
  extracted_text: string | null;
  folder_id: string | null;
  project_id: string | null;
  // Deprecated fields (for backward compatibility)
  mockup_name?: string;
  mockup_image_url?: string;
}

export interface SimilarFolderResult {
  folder_id: string;
  folder_name: string;
  avg_similarity: number;
  asset_count: number; // Renamed from mockup_count (v3.5.0)
  mockup_count?: number; // Deprecated: use asset_count
}