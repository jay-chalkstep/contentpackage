'use client';

import { Shield, AlertCircle, CheckCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import Badge from '@/components/ui/Badge';
import type { AccessibilityScore as AccessibilityScoreType, WCAGLevel } from '@/types/ai';

interface AccessibilityScoreProps {
  score: AccessibilityScoreType;
  compact?: boolean;
  className?: string;
}

export default function AccessibilityScore({
  score,
  compact = false,
  className = '',
}: AccessibilityScoreProps) {
  const [expanded, setExpanded] = useState(!compact);

  const getWCAGBadgeColor = (level: WCAGLevel) => {
    switch (level) {
      case 'AAA':
        return { variant: 'success' as const, text: 'WCAG AAA', icon: Shield };
      case 'AA':
        return { variant: 'info' as const, text: 'WCAG AA', icon: Shield };
      case 'A':
        return { variant: 'warning' as const, text: 'WCAG A', icon: AlertCircle };
      default:
        return { variant: 'error' as const, text: 'Does not meet WCAG', icon: AlertCircle };
    }
  };

  const getReadabilityColor = (readability: number | null) => {
    if (!readability) return 'text-gray-500';
    if (readability >= 80) return 'text-green-600';
    if (readability >= 60) return 'text-blue-600';
    if (readability >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const wcagInfo = getWCAGBadgeColor(score.wcagLevel);
  const WCAGIcon = wcagInfo.icon;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <Badge variant={wcagInfo.variant} size="sm">
          <WCAGIcon className="h-3 w-3 mr-1" />
          {wcagInfo.text}
        </Badge>
        {score.readability !== null && (
          <span className={`text-xs font-semibold ${getReadabilityColor(score.readability)}`}>
            {score.readability}/100
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Accessibility</h3>
              <p className="text-sm text-gray-600">WCAG compliance analysis</p>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {/* Score Overview */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-3 gap-4">
          {/* WCAG Level */}
          <div>
            <p className="text-xs text-gray-500 mb-1">WCAG Level</p>
            <Badge variant={wcagInfo.variant} size="md">
              <WCAGIcon className="h-3 w-3 mr-1" />
              {score.wcagLevel || 'Fail'}
            </Badge>
          </div>

          {/* Contrast Ratio */}
          {score.contrastRatio !== null && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Contrast Ratio</p>
              <p className="text-lg font-semibold text-gray-900">
                {score.contrastRatio.toFixed(2)}:1
              </p>
            </div>
          )}

          {/* Readability Score */}
          {score.readability !== null && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Readability</p>
              <p className={`text-lg font-semibold ${getReadabilityColor(score.readability)}`}>
                {score.readability}/100
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      {expanded && (
        <div className="p-6 space-y-4">
          {/* Issues */}
          {score.issues.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <h4 className="text-sm font-semibold text-gray-900">
                  Issues ({score.issues.length})
                </h4>
              </div>
              <div className="space-y-2">
                {score.issues.map((issue, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      issue.severity === 'error'
                        ? 'bg-red-50 border-red-200'
                        : issue.severity === 'warning'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {issue.severity === 'error' ? (
                        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      ) : issue.severity === 'warning' ? (
                        <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{issue.message}</p>
                        {issue.fix && (
                          <p className="text-xs text-gray-600 mt-1">
                            <strong>Fix:</strong> {issue.fix}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {score.suggestions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <h4 className="text-sm font-semibold text-gray-900">Suggestions</h4>
              </div>
              <ul className="space-y-2">
                {score.suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* No issues */}
          {score.issues.length === 0 && score.wcagLevel && (
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-gray-900 font-semibold">Great accessibility!</p>
              <p className="text-sm text-gray-600">This mockup meets WCAG {score.wcagLevel} standards</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
