/**
 * AI Utility Functions
 * Error handling, retry logic, and helper functions for AI services
 */

import { AI_CONFIG } from './config';

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = AI_CONFIG.MAX_RETRIES,
  baseDelay: number = AI_CONFIG.RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on certain errors
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (
          message.includes('invalid api key') ||
          message.includes('unauthorized') ||
          message.includes('forbidden')
        ) {
          throw error; // Don't retry auth errors
        }
      }

      // Wait before retrying (exponential backoff)
      const delay = baseDelay * Math.pow(2, i);
      console.warn(`[AI Utils] Retry ${i + 1}/${maxRetries} after ${delay}ms:`, error);
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parse Google Vision API error response
 */
export function parseVisionError(error: any): string {
  if (error.response?.data?.error) {
    const visionError = error.response.data.error;
    return `Google Vision API Error: ${visionError.message || visionError.code || 'Unknown error'}`;
  }

  if (error.message) {
    return `Vision API Error: ${error.message}`;
  }

  return 'Unknown Vision API error occurred';
}

/**
 * Parse OpenAI API error response
 */
export function parseOpenAIError(error: any): string {
  if (error.error) {
    return `OpenAI API Error: ${error.error.message || error.error.code || 'Unknown error'}`;
  }

  if (error.message) {
    return `OpenAI Error: ${error.message}`;
  }

  return 'Unknown OpenAI API error occurred';
}

/**
 * Validate image URL format
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    return (
      pathname.endsWith('.png') ||
      pathname.endsWith('.jpg') ||
      pathname.endsWith('.jpeg') ||
      pathname.endsWith('.webp')
    );
  } catch {
    return false;
  }
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance for contrast ratio
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
export function getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
    const sRGB = val / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 1;

  const l1 = getRelativeLuminance(rgb1);
  const l2 = getRelativeLuminance(rgb2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get WCAG compliance level based on contrast ratio
 * https://www.w3.org/TR/WCAG20/#visual-audio-contrast-contrast
 */
export function getWCAGLevel(
  contrastRatio: number,
  isLargeText: boolean = false
): 'AAA' | 'AA' | 'A' | null {
  if (isLargeText) {
    // Large text (18pt+ or 14pt+ bold)
    if (contrastRatio >= 4.5) return 'AAA';
    if (contrastRatio >= 3) return 'AA';
    return null;
  } else {
    // Normal text
    if (contrastRatio >= 7) return 'AAA';
    if (contrastRatio >= 4.5) return 'AA';
    if (contrastRatio >= 3) return 'A';
    return null;
  }
}

/**
 * Sanitize text for search indexing
 */
export function sanitizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
    .slice(0, 10000); // Limit length
}

/**
 * Extract color from Google Vision color info
 */
export function extractColorInfo(colorInfo: any): { hex: string; percentage: number } | null {
  if (!colorInfo.color) return null;

  const { red = 0, green = 0, blue = 0 } = colorInfo.color;
  const hex = `#${((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1)}`;
  const percentage = colorInfo.pixelFraction || 0;

  return { hex, percentage };
}

/**
 * Chunk an array into smaller arrays
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Create a delay with a timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
  );

  return Promise.race([promise, timeout]);
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Format similarity score as percentage
 */
export function formatSimilarity(score: number): string {
  return `${Math.round(score * 100)}%`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Check if running in server environment
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Log AI operation (development only)
 */
export function logAIOperation(operation: string, data?: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[AI] ${operation}`, data || '');
  }
}
