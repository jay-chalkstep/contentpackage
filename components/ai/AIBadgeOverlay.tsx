'use client';

import { Sparkles, AlertCircle, Tag } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import AIIndicator from '@/components/ui/AIIndicator';
import type { AIMetadata } from '@/types/ai';

interface AIBadgeOverlayProps {
  aiMetadata?: AIMetadata | null;
  compact?: boolean;
  className?: string;
}

export default function AIBadgeOverlay({
  aiMetadata,
  compact = true,
  className = '',
}: AIBadgeOverlayProps) {
  if (!aiMetadata) {
    return null;
  }

  const tagCount = (
    (aiMetadata.autoTags?.visual?.length || 0) +
    (aiMetadata.autoTags?.colors?.length || 0) +
    (aiMetadata.autoTags?.composition?.length || 0) +
    (aiMetadata.autoTags?.objects?.length || 0)
  );

  const hasAccessibilityIssues =
    aiMetadata.accessibilityScore?.issues &&
    aiMetadata.accessibilityScore.issues.some(i => i.severity === 'error' || i.severity === 'warning');

  if (compact) {
    // Compact badges for grid view
    return (
      <div className={`absolute top-2 right-2 flex flex-col gap-1 ${className}`}>
        <AIIndicator state="completed" compact />
        {tagCount > 0 && (
          <Badge variant="purple" size="sm">
            <Tag className="h-3 w-3 mr-1" />
            {tagCount}
          </Badge>
        )}
        {hasAccessibilityIssues && (
          <Badge variant="warning" size="sm">
            <AlertCircle className="h-3 w-3" />
          </Badge>
        )}
      </div>
    );
  }

  // Full overlay for hover card
  return (
    <div className={`absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-4 flex flex-col justify-end ${className}`}>
      <div className="space-y-2">
        {/* Top Tags */}
        {aiMetadata.autoTags && (
          <div className="flex flex-wrap gap-1">
            {aiMetadata.autoTags.visual.slice(0, 3).map((tag, i) => (
              <Badge key={i} variant="purple" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        <div className="flex items-center gap-2 text-xs text-white">
          <Sparkles className="h-3 w-3" />
          <span>{tagCount} AI tags</span>
          {aiMetadata.accessibilityScore?.wcagLevel && (
            <Badge variant="success" size="sm">
              WCAG {aiMetadata.accessibilityScore.wcagLevel}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
