/**
 * Accessibility Analyzer
 * WCAG contrast analysis and accessibility scoring
 */

import { calculateContrastRatio, getWCAGLevel } from './utils';
import type { ColorPalette, AccessibilityScore } from '../supabase';

/**
 * Analyze accessibility of a mockup based on its color palette
 */
export function analyzeAccessibility(
  colorPalette: ColorPalette,
  hasText: boolean
): AccessibilityScore {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Get dominant colors
  const dominantColors = colorPalette.dominant || [];

  if (dominantColors.length < 2) {
    return {
      wcag_level: null,
      contrast_ratio: null,
      readability: null,
      issues: ['Insufficient color data for accessibility analysis'],
      suggestions: ['Ensure the mockup has clear foreground and background colors'],
    };
  }

  // Assume the first color is background, second is foreground/text
  const backgroundColor = dominantColors[0].hex;
  const foregroundColor = dominantColors[1].hex;

  // Calculate contrast ratio
  const contrastRatio = calculateContrastRatio(backgroundColor, foregroundColor);

  // Determine WCAG level
  const wcagLevel = getWCAGLevel(contrastRatio, false); // Assume normal text size

  // Generate issues and suggestions
  if (!hasText) {
    suggestions.push('No text detected in mockup - accessibility analysis limited to color contrast');
  }

  if (contrastRatio < 3) {
    issues.push('Very low contrast ratio - content may be difficult to read');
    suggestions.push('Increase contrast between foreground and background colors');
    suggestions.push('Consider using darker text on light background or vice versa');
  } else if (contrastRatio < 4.5) {
    issues.push('Contrast ratio does not meet WCAG AA standards for normal text');
    suggestions.push('For WCAG AA compliance, aim for a contrast ratio of at least 4.5:1');
    suggestions.push('Consider adjusting text or background colors to improve readability');
  } else if (contrastRatio < 7) {
    if (wcagLevel === 'AA') {
      suggestions.push('Meets WCAG AA - for AAA compliance, aim for 7:1 contrast ratio');
    }
  }

  // Check for color palette diversity
  if (dominantColors.length === 2 && dominantColors.every(c => isSimilarColor(c.hex, dominantColors[0].hex))) {
    issues.push('Limited color diversity detected');
    suggestions.push('Consider using more diverse colors to improve visual hierarchy');
  }

  // Check if colors are too bright or too dark
  const avgBrightness = calculateAverageBrightness(dominantColors.map(c => c.hex));
  if (avgBrightness > 0.9) {
    issues.push('Overall palette is very bright - may cause eye strain');
    suggestions.push('Consider adding darker elements for better visual balance');
  } else if (avgBrightness < 0.1) {
    issues.push('Overall palette is very dark - may reduce visibility');
    suggestions.push('Consider adding lighter elements for better contrast');
  }

  // Calculate overall readability score (0-100)
  const readability = calculateReadabilityScore(contrastRatio, avgBrightness, dominantColors.length);

  return {
    wcag_level: wcagLevel,
    contrast_ratio: Math.round(contrastRatio * 100) / 100,
    readability: Math.round(readability),
    issues: issues.length > 0 ? issues : [],
    suggestions: suggestions.length > 0 ? suggestions : ['Accessibility looks good!'],
  };
}

/**
 * Check if two colors are similar
 */
function isSimilarColor(hex1: string, hex2: string, threshold: number = 0.1): boolean {
  const contrast = calculateContrastRatio(hex1, hex2);
  return contrast < (1 + threshold);
}

/**
 * Calculate average brightness of a color palette
 */
function calculateAverageBrightness(hexColors: string[]): number {
  if (hexColors.length === 0) return 0.5;

  const brightness = hexColors.map(hex => {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0.5;

    // Relative luminance formula
    return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  });

  return brightness.reduce((sum, b) => sum + b, 0) / brightness.length;
}

/**
 * Convert hex to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
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
 * Calculate overall readability score (0-100)
 * Based on contrast ratio, brightness balance, and color diversity
 */
function calculateReadabilityScore(
  contrastRatio: number,
  avgBrightness: number,
  colorCount: number
): number {
  // Contrast score (0-50 points)
  let contrastScore = 0;
  if (contrastRatio >= 7) {
    contrastScore = 50; // AAA level
  } else if (contrastRatio >= 4.5) {
    contrastScore = 40; // AA level
  } else if (contrastRatio >= 3) {
    contrastScore = 25; // A level
  } else {
    contrastScore = Math.min(25, (contrastRatio / 3) * 25); // Below standards
  }

  // Brightness balance score (0-30 points)
  // Ideal brightness is around 0.4-0.6 (not too bright, not too dark)
  let brightnessScore = 0;
  if (avgBrightness >= 0.4 && avgBrightness <= 0.6) {
    brightnessScore = 30; // Ideal range
  } else if (avgBrightness >= 0.3 && avgBrightness <= 0.7) {
    brightnessScore = 20; // Good range
  } else if (avgBrightness >= 0.2 && avgBrightness <= 0.8) {
    brightnessScore = 10; // Acceptable range
  } else {
    brightnessScore = 5; // Too extreme
  }

  // Color diversity score (0-20 points)
  let diversityScore = Math.min(20, colorCount * 4);

  return Math.round(contrastScore + brightnessScore + diversityScore);
}

/**
 * Get accessibility badge color based on WCAG level
 */
export function getAccessibilityBadgeColor(wcagLevel: 'AAA' | 'AA' | 'A' | null): {
  bg: string;
  text: string;
  border: string;
} {
  switch (wcagLevel) {
    case 'AAA':
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-300',
      };
    case 'AA':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-300',
      };
    case 'A':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-300',
      };
    default:
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-300',
      };
  }
}

/**
 * Get readability badge color based on score
 */
export function getReadabilityBadgeColor(score: number): {
  bg: string;
  text: string;
  border: string;
} {
  if (score >= 80) {
    return {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-300',
    };
  } else if (score >= 60) {
    return {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-300',
    };
  } else if (score >= 40) {
    return {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-300',
    };
  } else {
    return {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-300',
    };
  }
}

/**
 * Generate accessibility report text
 */
export function generateAccessibilityReport(score: AccessibilityScore): string {
  const lines: string[] = [];

  if (score.wcag_level) {
    lines.push(`WCAG Compliance: Level ${score.wcag_level}`);
  }

  if (score.contrast_ratio) {
    lines.push(`Contrast Ratio: ${score.contrast_ratio}:1`);
  }

  if (score.readability) {
    lines.push(`Readability Score: ${score.readability}/100`);
  }

  if (score.issues.length > 0) {
    lines.push('');
    lines.push('Issues:');
    score.issues.forEach(issue => lines.push(`• ${issue}`));
  }

  if (score.suggestions.length > 0) {
    lines.push('');
    lines.push('Suggestions:');
    score.suggestions.forEach(suggestion => lines.push(`• ${suggestion}`));
  }

  return lines.join('\n');
}
