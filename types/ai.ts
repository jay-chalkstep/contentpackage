/**
 * AI Features Type Definitions
 * Shared types for AI-powered features across the application
 */

// Auto-tagging types
export interface AutoTags {
  visual: string[];
  colors: string[];
  composition: string[];
  brands: string[];
  objects: string[];
  confidence: number;
}

// Color palette types
export interface ColorInfo {
  hex: string;
  percentage: number;
}

export interface ColorPalette {
  dominant: ColorInfo[];
  accent: ColorInfo[];
  neutral: ColorInfo[];
}

// Accessibility types
export type WCAGLevel = 'A' | 'AA' | 'AAA' | null;

export interface AccessibilityIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  element?: string;
  fix?: string;
}

export interface AccessibilityScore {
  wcagLevel: WCAGLevel;
  contrastRatio: number | null;
  readability: number | null;
  issues: AccessibilityIssue[];
  suggestions: string[];
}

// AI Metadata types
export interface AIMetadata {
  id: string;
  mockupId: string;
  autoTags: AutoTags;
  colorPalette: ColorPalette;
  extractedText: string | null;
  accessibilityScore: AccessibilityScore;
  embedding?: number[];
  searchText: string;
  lastAnalyzed: Date | string;
  apiCallsCount?: number;
  analysisVersion?: string;
}

// Search types
export type SearchMode = 'ai' | 'exact' | 'visual';

export interface SearchQuery {
  id: string;
  query: string;
  queryEmbedding?: number[];
  naturalLanguage: boolean;
  resultsCount: number | null;
  clickedResults?: string[];
  userId: string | null;
  orgId: string | null;
  createdAt: Date | string;
}

export interface SearchResult {
  id: string;
  mockupName: string;
  mockupImageUrl: string;
  relevanceScore: number;
  matchedTerms?: string[];
  matchExplanation?: string;
  autoTags?: AutoTags;
  extractedText?: string | null;
  folderId?: string | null;
  projectId?: string | null;
  createdAt: Date | string;
}

// Similar mockups types
export interface SimilarMockup {
  id: string;
  mockupName: string;
  mockupImageUrl: string;
  similarity: number;
  matchedAspects: string[];
  autoTags?: AutoTags;
}

// Folder suggestion types
export interface FolderSuggestion {
  id: string;
  mockupId: string;
  folderId: string;
  folderName: string;
  folderPath: string;
  confidence: number;
  reason: string;
  accepted?: boolean | null;
  userId: string;
  createdAt: Date | string;
}

// AI processing types
export interface AIProcessingJob {
  mockupId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  startedAt?: Date | string;
  completedAt?: Date | string;
  error?: string;
}

// AI activity feed types
export interface AIActivityItem {
  id: string;
  type: 'analysis' | 'search' | 'suggestion';
  action: string;
  mockupId?: string;
  mockupName?: string;
  status: 'success' | 'error' | 'processing';
  duration?: number;
  userId: string;
  createdAt: Date | string;
}

// AI context types
export interface AIContextValue {
  isProcessing: boolean;
  searchMode: SearchMode;
  aiEnabled: boolean;
  recentSearches: string[];
  suggestions: FolderSuggestion[];
  processQueue: string[];
  onboardingCompleted: boolean;
  setSearchMode: (mode: SearchMode) => void;
  addRecentSearch: (query: string) => void;
  markOnboardingComplete: () => void;
}

// API Response types
export interface AIAnalyzeResponse {
  success: boolean;
  metadata?: {
    auto_tags: AutoTags;
    color_palette: ColorPalette;
    extracted_text: string;
    accessibility_score: AccessibilityScore;
    embedding: number[];
  };
  error?: string;
}

export interface AISearchResponse {
  success: boolean;
  results: SearchResult[];
  query: string;
  searchType: SearchMode;
  resultsCount: number;
}

export interface AISimilarResponse {
  success: boolean;
  mockupId: string;
  similar: SimilarMockup[];
  count: number;
}

export interface AIFolderSuggestionResponse {
  success: boolean;
  mockupId: string;
  suggestions: FolderSuggestion[];
  count: number;
}

// Onboarding types
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetElement?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: string;
}

export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  completed: boolean;
  dismissed: boolean;
}
