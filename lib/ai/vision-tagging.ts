/**
 * Vision Tagging Service
 * Image analysis pipeline using Google Vision API and OpenAI embeddings
 */

import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { openai, googleVisionConfig, AI_MODELS, AI_CONFIG } from './config';
import {
  retryWithBackoff,
  parseVisionError,
  parseOpenAIError,
  sanitizeSearchText,
  extractColorInfo,
  logAIOperation,
} from './utils';
import { analyzeAccessibility } from './accessibility';
import type { AutoTags, ColorPalette, AccessibilityScore } from '../supabase';

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Google Vision API response types
 */
interface VisionLabel {
  description: string;
  score: number;
  topicality?: number;
}

interface VisionColor {
  color: {
    red: number;
    green: number;
    blue: number;
  };
  score: number;
  pixelFraction: number;
}

interface VisionResponse {
  labelAnnotations?: VisionLabel[];
  textAnnotations?: Array<{ description: string }>;
  imagePropertiesAnnotation?: {
    dominantColors: {
      colors: VisionColor[];
    };
  };
}

/**
 * Call Google Vision API to analyze an image
 */
async function analyzeImageWithVision(imageUrl: string): Promise<VisionResponse> {
  logAIOperation('Calling Google Vision API', { imageUrl });

  const requestBody = {
    requests: [
      {
        image: {
          source: {
            imageUri: imageUrl,
          },
        },
        features: [
          { type: 'LABEL_DETECTION', maxResults: AI_CONFIG.VISION_MAX_LABELS },
          { type: 'TEXT_DETECTION' },
          { type: 'IMAGE_PROPERTIES' },
        ],
      },
    ],
  };

  try {
    const response = await retryWithBackoff(async () => {
      return await axios.post(
        `${googleVisionConfig.endpoint}?key=${googleVisionConfig.apiKey}`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );
    });

    if (!response.data.responses || !response.data.responses[0]) {
      throw new Error('Invalid response from Google Vision API');
    }

    return response.data.responses[0];
  } catch (error) {
    throw new Error(parseVisionError(error));
  }
}

/**
 * Extract auto-tags from Vision API response
 */
function extractTags(visionResponse: VisionResponse): AutoTags {
  const labels = visionResponse.labelAnnotations || [];

  // Categorize labels
  const visualTags: string[] = [];
  const colorTags: string[] = [];
  const compositionTags: string[] = [];
  const brandTags: string[] = [];
  const objectTags: string[] = [];

  // Keywords for categorization
  const colorKeywords = ['color', 'white', 'black', 'red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange', 'brown', 'gray', 'grey'];
  const compositionKeywords = ['symmetry', 'pattern', 'texture', 'shape', 'design', 'layout', 'composition', 'minimal', 'geometric'];
  const brandKeywords = ['logo', 'brand', 'trademark', 'emblem', 'symbol', 'mark'];

  labels.forEach(label => {
    const desc = label.description.toLowerCase();
    const score = label.score || 0;

    // Only include labels with sufficient confidence
    if (score < AI_CONFIG.VISION_CONFIDENCE_THRESHOLD) return;

    // Categorize the label
    if (colorKeywords.some(k => desc.includes(k))) {
      colorTags.push(label.description);
    } else if (compositionKeywords.some(k => desc.includes(k))) {
      compositionTags.push(label.description);
    } else if (brandKeywords.some(k => desc.includes(k))) {
      brandTags.push(label.description);
    } else {
      // Check if it's likely an object
      if (!desc.includes(' ') || desc.split(' ').length <= 2) {
        objectTags.push(label.description);
      } else {
        visualTags.push(label.description);
      }
    }
  });

  // Calculate average confidence
  const avgConfidence = labels.length > 0
    ? labels.reduce((sum, l) => sum + (l.score || 0), 0) / labels.length
    : 0;

  return {
    visual: visualTags.slice(0, 10),
    colors: colorTags.slice(0, 5),
    composition: compositionTags.slice(0, 5),
    brands: brandTags.slice(0, 5),
    objects: objectTags.slice(0, 10),
    confidence: Math.round(avgConfidence * 100) / 100,
  };
}

/**
 * Extract color palette from Vision API response
 */
function extractColorPalette(visionResponse: VisionResponse): ColorPalette {
  const colors = visionResponse.imagePropertiesAnnotation?.dominantColors?.colors || [];

  const dominantColors = colors
    .slice(0, 5)
    .map(extractColorInfo)
    .filter((c): c is { hex: string; percentage: number } => c !== null);

  // Categorize colors as dominant, accent, or neutral
  const dominant: Array<{ hex: string; percentage: number }> = [];
  const accent: Array<{ hex: string; percentage: number }> = [];
  const neutral: Array<{ hex: string; percentage: number }> = [];

  dominantColors.forEach((color, index) => {
    if (index < 2) {
      dominant.push(color);
    } else if (color.percentage > 0.1) {
      accent.push(color);
    } else {
      neutral.push(color);
    }
  });

  return { dominant, accent, neutral };
}

/**
 * Extract text from Vision API OCR response
 */
function extractText(visionResponse: VisionResponse): string {
  const textAnnotations = visionResponse.textAnnotations || [];

  if (textAnnotations.length === 0) return '';

  // The first annotation contains all detected text
  return textAnnotations[0]?.description || '';
}

/**
 * Generate embedding from text using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  logAIOperation('Generating OpenAI embedding', { textLength: text.length });

  try {
    const response = await retryWithBackoff(async () => {
      return await openai.embeddings.create({
        model: AI_MODELS.EMBEDDING,
        input: text,
      });
    });

    return response.data[0].embedding;
  } catch (error) {
    throw new Error(parseOpenAIError(error));
  }
}

/**
 * Main function: Analyze and tag a mockup
 */
export async function analyzeAndTagMockup(
  mockupId: string,
  imageUrl: string,
  mockupName: string,
  mockupDescription: string = ''
): Promise<{
  success: boolean;
  metadata?: {
    auto_tags: AutoTags;
    color_palette: ColorPalette;
    extracted_text: string;
    accessibility_score: AccessibilityScore;
    embedding: number[];
  };
  error?: string;
}> {
  try {
    logAIOperation('Starting mockup analysis', { mockupId, imageUrl });

    // Step 1: Analyze image with Google Vision
    const visionResponse = await analyzeImageWithVision(imageUrl);

    // Step 2: Extract structured data
    const autoTags = extractTags(visionResponse);
    const colorPalette = extractColorPalette(visionResponse);
    const extractedText = extractText(visionResponse);

    // Step 3: Analyze accessibility
    const accessibilityScore = analyzeAccessibility(colorPalette, extractedText.length > 0);

    // Step 4: Generate searchable text
    const allTags = [
      ...autoTags.visual,
      ...autoTags.colors,
      ...autoTags.composition,
      ...autoTags.brands,
      ...autoTags.objects,
    ].join(' ');

    const searchText = sanitizeSearchText(
      `${mockupName} ${mockupDescription} ${extractedText} ${allTags}`
    );

    // Step 5: Generate embedding
    const embedding = await generateEmbedding(searchText);

    // Step 6: Store in Supabase (single atomic operation)
    const { error: upsertError } = await supabase
      .from('mockup_ai_metadata')
      .upsert({
        mockup_id: mockupId,
        auto_tags: autoTags,
        color_palette: colorPalette,
        extracted_text: extractedText,
        accessibility_score: accessibilityScore,
        embedding: embedding,
        search_text: searchText,
        last_analyzed: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (upsertError) {
      throw new Error(`Database error: ${upsertError.message}`);
    }

    logAIOperation('Analysis completed successfully', { mockupId });

    return {
      success: true,
      metadata: {
        auto_tags: autoTags,
        color_palette: colorPalette,
        extracted_text: extractedText,
        accessibility_score: accessibilityScore,
        embedding,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Vision Tagging] Error:', errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get AI metadata for a mockup
 */
export async function getMockupAIMetadata(mockupId: string) {
  const { data, error } = await supabase
    .from('mockup_ai_metadata')
    .select('*')
    .eq('mockup_id', mockupId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No metadata found
      return null;
    }
    throw new Error(`Failed to fetch AI metadata: ${error.message}`);
  }

  return data;
}

/**
 * Check if a mockup has been analyzed
 */
export async function isMockupAnalyzed(mockupId: string): Promise<boolean> {
  const metadata = await getMockupAIMetadata(mockupId);
  return metadata !== null && metadata.embedding !== null;
}

/**
 * Batch analyze multiple mockups
 */
export async function batchAnalyzeMockups(
  mockups: Array<{ id: string; imageUrl: string; name: string; description?: string }>
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const mockup of mockups) {
    const result = await analyzeAndTagMockup(
      mockup.id,
      mockup.imageUrl,
      mockup.name,
      mockup.description || ''
    );

    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push(`${mockup.name}: ${result.error}`);
    }

    // Add a small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}
