'use client';

import { useState, useEffect } from 'react';
import { Sparkles, ChevronLeft, ChevronRight, Lightbulb, AlertCircle, Wand2, CheckCircle } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import ConfidenceBar from '@/components/ui/ConfidenceBar';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import type { AccessibilityScore } from '@/types/ai';

interface CanvasAIAssistantProps {
  mockupId: string;
  canvasData?: any; // Current canvas state from Konva
  onApplySuggestion?: (suggestion: LayoutSuggestion) => void;
  className?: string;
}

interface LayoutSuggestion {
  id: string;
  type: 'spacing' | 'alignment' | 'contrast' | 'readability' | 'composition';
  title: string;
  description: string;
  confidence: number;
  fix?: {
    action: string;
    params: Record<string, any>;
  };
}

export default function CanvasAIAssistant({
  mockupId,
  canvasData,
  onApplySuggestion,
  className = '',
}: CanvasAIAssistantProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<LayoutSuggestion[]>([]);
  const [accessibilityScore, setAccessibilityScore] = useState<AccessibilityScore | null>(null);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'accessibility'>('suggestions');

  useEffect(() => {
    // Re-analyze when canvas data changes (debounced)
    const timer = setTimeout(() => {
      if (canvasData) {
        analyzeCanvas();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [canvasData]);

  const analyzeCanvas = async () => {
    setAnalyzing(true);
    try {
      // In a real implementation, this would send canvas snapshot to AI API
      const response = await fetch('/api/ai/analyze-canvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mockupId, canvasData }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setAccessibilityScore(data.accessibilityScore || null);
      }
    } catch (error) {
      console.error('Failed to analyze canvas:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApplySuggestion = (suggestion: LayoutSuggestion) => {
    if (onApplySuggestion) {
      onApplySuggestion(suggestion);
    }
  };

  const getSuggestionIcon = (type: LayoutSuggestion['type']) => {
    switch (type) {
      case 'spacing':
        return Lightbulb;
      case 'alignment':
        return Lightbulb;
      case 'contrast':
        return AlertCircle;
      case 'readability':
        return AlertCircle;
      case 'composition':
        return Wand2;
      default:
        return Lightbulb;
    }
  };

  const getSuggestionVariant = (type: LayoutSuggestion['type']) => {
    switch (type) {
      case 'contrast':
      case 'readability':
        return 'warning';
      default:
        return 'purple';
    }
  };

  if (collapsed) {
    return (
      <div className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 ${className}`}>
        <button
          onClick={() => setCollapsed(false)}
          className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-l-lg shadow-lg transition-colors group"
          title="Open AI Assistant"
        >
          <div className="flex flex-col items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <span className="text-xs font-medium writing-mode-vertical">AI Assistant</span>
            <ChevronLeft className="h-4 w-4 group-hover:animate-pulse" />
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-xl z-40 overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <h3 className="font-semibold">AI Assistant</h3>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1 hover:bg-white/20 rounded transition-colors"
          title="Collapse"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'suggestions'
              ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Lightbulb className="h-4 w-4 inline mr-1" />
          Suggestions
          {suggestions.length > 0 && (
            <Badge variant="purple" size="sm" className="ml-2">
              {suggestions.length}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab('accessibility')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'accessibility'
              ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <AlertCircle className="h-4 w-4 inline mr-1" />
          Accessibility
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {analyzing ? (
          <LoadingSkeleton shape="card" count={3} showSparkle />
        ) : activeTab === 'suggestions' ? (
          <div className="space-y-3">
            {suggestions.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-900 mb-1">Looking great!</p>
                <p className="text-xs text-gray-600">No suggestions at this time</p>
              </div>
            ) : (
              suggestions.map((suggestion) => {
                const Icon = getSuggestionIcon(suggestion.type);
                return (
                  <div
                    key={suggestion.id}
                    className="bg-white border border-gray-200 rounded-lg p-3 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <Icon className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">
                          {suggestion.title}
                        </h4>
                        <p className="text-xs text-gray-600">{suggestion.description}</p>
                      </div>
                      <Badge variant={getSuggestionVariant(suggestion.type)} size="sm">
                        {suggestion.type}
                      </Badge>
                    </div>

                    <ConfidenceBar
                      value={suggestion.confidence}
                      showPercentage={false}
                      height="sm"
                      className="mb-2"
                    />

                    {suggestion.fix && (
                      <button
                        onClick={() => handleApplySuggestion(suggestion)}
                        className="w-full mt-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded transition-colors"
                      >
                        <Wand2 className="h-3 w-3 inline mr-1" />
                        Apply Fix
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {!accessibilityScore ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600">Start editing to check accessibility</p>
              </div>
            ) : (
              <>
                {/* WCAG Level */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-2">WCAG Compliance</p>
                  <Badge
                    variant={
                      accessibilityScore.wcagLevel === 'AAA'
                        ? 'success'
                        : accessibilityScore.wcagLevel === 'AA'
                        ? 'info'
                        : 'warning'
                    }
                    size="md"
                  >
                    {accessibilityScore.wcagLevel || 'Fail'}
                  </Badge>
                  {accessibilityScore.contrastRatio !== null && (
                    <p className="text-sm text-gray-900 mt-2">
                      Contrast: {accessibilityScore.contrastRatio.toFixed(2)}:1
                    </p>
                  )}
                </div>

                {/* Issues */}
                {accessibilityScore.issues.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-600 mb-2">
                      Issues ({accessibilityScore.issues.length})
                    </h4>
                    <div className="space-y-2">
                      {accessibilityScore.issues.map((issue, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border text-xs ${
                            issue.severity === 'error'
                              ? 'bg-red-50 border-red-200'
                              : issue.severity === 'warning'
                              ? 'bg-yellow-50 border-yellow-200'
                              : 'bg-blue-50 border-blue-200'
                          }`}
                        >
                          <p className="text-gray-900 font-medium mb-1">{issue.message}</p>
                          {issue.fix && (
                            <p className="text-gray-600">
                              <strong>Fix:</strong> {issue.fix}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {accessibilityScore.suggestions.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-600 mb-2">Suggestions</h4>
                    <ul className="space-y-1">
                      {accessibilityScore.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2 text-xs text-gray-700">
                          <span className="text-green-600 mt-0.5">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3 bg-gray-50">
        <button
          onClick={analyzeCanvas}
          disabled={analyzing}
          className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {analyzing ? (
            <>
              <Sparkles className="h-4 w-4 inline mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 inline mr-2" />
              Re-analyze
            </>
          )}
        </button>
      </div>
    </div>
  );
}
