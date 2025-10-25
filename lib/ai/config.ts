/**
 * AI Service Configuration
 * Configures OpenAI and Google Vision API clients
 */

import { OpenAI } from 'openai';

// OpenAI Configuration - Lazy initialization to avoid build-time errors
let _openai: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return _openai;
}

// Google Vision API Configuration
export const googleVisionConfig = {
  apiKey: process.env.GOOGLE_VISION_API_KEY || '',
  endpoint: 'https://vision.googleapis.com/v1/images:annotate',
};

// API Model Configuration
export const AI_MODELS = {
  // OpenAI Embedding Model - text-embedding-3-small (1536 dimensions)
  EMBEDDING: 'text-embedding-3-small',
  // Alternative: 'text-embedding-3-large' (3072 dimensions, more accurate but more expensive)

  // OpenAI GPT Model for advanced features (future use)
  GPT: 'gpt-3.5-turbo',
} as const;

// Feature Configuration
export const AI_CONFIG = {
  // Embedding settings
  EMBEDDING_DIMENSIONS: 1536,
  SIMILARITY_THRESHOLD: 0.5, // Minimum similarity score (0-1) for search results

  // Search settings
  DEFAULT_SEARCH_RESULTS: 20,
  DEFAULT_SIMILAR_COUNT: 10,
  DEFAULT_FOLDER_SUGGESTIONS: 3,

  // Hybrid search weighting
  HYBRID_TEXT_WEIGHT: 0.4,
  HYBRID_VECTOR_WEIGHT: 0.6,

  // Google Vision settings
  VISION_MAX_LABELS: 20, // Maximum number of labels to extract
  VISION_CONFIDENCE_THRESHOLD: 0.7, // Minimum confidence for labels (0-1)

  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
} as const;

// Feature flags (can be used to enable/disable features)
export const AI_FEATURES = {
  AUTO_TAGGING: true,
  SEMANTIC_SEARCH: true,
  SIMILARITY_SEARCH: true,
  FOLDER_SUGGESTIONS: true,
  ACCESSIBILITY_ANALYSIS: true,
  OCR_EXTRACTION: true,
} as const;

// Validate configuration on import
function validateConfig() {
  const warnings: string[] = [];

  if (!process.env.OPENAI_API_KEY) {
    warnings.push('OPENAI_API_KEY is not set');
  }

  if (!process.env.GOOGLE_VISION_API_KEY) {
    warnings.push('GOOGLE_VISION_API_KEY is not set');
  }

  if (warnings.length > 0 && process.env.NODE_ENV !== 'test') {
    console.warn('[AI Config] Missing configuration:', warnings.join(', '));
  }
}

// Run validation
validateConfig();
