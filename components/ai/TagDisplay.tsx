'use client';

import { useState } from 'react';
import { Tag, Palette, Layout, Building2, Box, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import ColorSwatch from '@/components/ui/ColorSwatch';
import ConfidenceBar from '@/components/ui/ConfidenceBar';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import type { AutoTags, ColorPalette, AIMetadata } from '@/types/ai';

interface TagDisplayProps {
  aiMetadata?: AIMetadata | null;
  loading?: boolean;
  onAnalyze?: () => void;
  className?: string;
}

export default function TagDisplay({
  aiMetadata,
  loading = false,
  onAnalyze,
  className = '',
}: TagDisplayProps) {
  const autoTags = aiMetadata?.autoTags;
  const colorPalette = aiMetadata?.colorPalette;
  const extractedText = aiMetadata?.extractedText;
  const lastAnalyzed = aiMetadata?.lastAnalyzed;
  const [expandedSections, setExpandedSections] = useState({
    visual: true,
    colors: true,
    composition: true,
    brands: true,
    objects: true,
    text: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
        <LoadingSkeleton shape="badge" count={3} showSparkle />
        <div className="mt-4">
          <LoadingSkeleton shape="text" count={2} />
        </div>
      </div>
    );
  }

  // Check if we have no data
  const hasNoData = !autoTags || (
    autoTags.visual.length === 0 &&
    autoTags.colors.length === 0 &&
    autoTags.composition.length === 0 &&
    autoTags.brands.length === 0 &&
    autoTags.objects.length === 0
  );

  if (hasNoData) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-8 text-center ${className}`}>
        <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No AI Analysis Yet</h3>
        <p className="text-gray-600 mb-4">
          Analyze this mockup with AI to extract tags, colors, and insights.
        </p>
        {onAnalyze && (
          <button
            onClick={onAnalyze}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Analyze with AI
          </button>
        )}
      </div>
    );
  }

  const TagSection = ({
    icon: Icon,
    title,
    tags,
    sectionKey,
    variant = 'default',
  }: {
    icon: any;
    title: string;
    tags: string[];
    sectionKey: keyof typeof expandedSections;
    variant?: 'default' | 'purple' | 'info';
  }) => {
    if (tags.length === 0) return null;

    return (
      <div className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="flex items-center justify-between w-full text-left mb-3 hover:opacity-70 transition-opacity"
        >
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-gray-600" />
            <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
            <Badge variant="default" size="sm">{tags.length}</Badge>
          </div>
          {expandedSections[sectionKey] ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>

        {expandedSections[sectionKey] && (
          <div className="flex flex-wrap gap-2 pl-6">
            {tags.map((tag, index) => (
              <Badge key={index} variant={variant} size="sm">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
          </div>
          {lastAnalyzed && (
            <span className="text-xs text-gray-500">
              Analyzed {new Date(lastAnalyzed).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Confidence Score */}
        <div className="mt-3">
          <ConfidenceBar value={autoTags.confidence} animated />
        </div>
      </div>

      {/* Tags Sections */}
      <div className="p-6 space-y-4">
        <TagSection
          icon={Tag}
          title="Visual Tags"
          tags={autoTags.visual}
          sectionKey="visual"
          variant="purple"
        />

        <TagSection
          icon={Layout}
          title="Composition"
          tags={autoTags.composition}
          sectionKey="composition"
          variant="info"
        />

        <TagSection
          icon={Building2}
          title="Brands"
          tags={autoTags.brands}
          sectionKey="brands"
        />

        <TagSection
          icon={Box}
          title="Objects"
          tags={autoTags.objects}
          sectionKey="objects"
        />

        {/* Color Palette Section */}
        {colorPalette && (colorPalette.dominant.length > 0 || colorPalette.accent.length > 0) && (
          <div className="border-b border-gray-100 pb-4">
            <button
              onClick={() => toggleSection('colors')}
              className="flex items-center justify-between w-full text-left mb-3 hover:opacity-70 transition-opacity"
            >
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-gray-600" />
                <h4 className="text-sm font-semibold text-gray-900">Color Palette</h4>
                <Badge variant="default" size="sm">
                  {colorPalette.dominant.length + colorPalette.accent.length}
                </Badge>
              </div>
              {expandedSections.colors ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>

            {expandedSections.colors && (
              <div className="pl-6">
                {colorPalette.dominant.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-2">Dominant Colors</p>
                    <div className="flex gap-2 flex-wrap">
                      {colorPalette.dominant.map((color, index) => (
                        <ColorSwatch key={index} hex={color.hex} size="md" copyable />
                      ))}
                    </div>
                  </div>
                )}

                {colorPalette.accent.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Accent Colors</p>
                    <div className="flex gap-2 flex-wrap">
                      {colorPalette.accent.map((color, index) => (
                        <ColorSwatch key={index} hex={color.hex} size="sm" copyable />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Extracted Text Section */}
        {extractedText && (
          <div>
            <button
              onClick={() => toggleSection('text')}
              className="flex items-center justify-between w-full text-left mb-3 hover:opacity-70 transition-opacity"
            >
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-gray-600" />
                <h4 className="text-sm font-semibold text-gray-900">Extracted Text</h4>
              </div>
              {expandedSections.text ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>

            {expandedSections.text && (
              <div className="pl-6 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{extractedText}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
