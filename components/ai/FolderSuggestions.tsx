'use client';

import { useState, useEffect } from 'react';
import { Folder, ThumbsUp, ThumbsDown, Sparkles, Loader2 } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import ConfidenceBar from '@/components/ui/ConfidenceBar';
import type { FolderSuggestion } from '@/types/ai';

interface FolderSuggestionsProps {
  mockupId: string;
  onSelect: (folderId: string) => void;
  className?: string;
}

export default function FolderSuggestions({
  mockupId,
  onSelect,
  className = '',
}: FolderSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<FolderSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState<string | null>(null);

  useEffect(() => {
    fetchSuggestions();
  }, [mockupId]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/suggest-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mockupId }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Failed to fetch folder suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (suggestionId: string, accepted: boolean) => {
    setFeedbackSubmitting(suggestionId);
    try {
      await fetch('/api/ai/suggest-folder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId, accepted }),
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setFeedbackSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className={`bg-purple-50 border border-purple-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
          <span className="text-sm text-purple-900">Finding best folders...</span>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-purple-600" />
        <h4 className="text-sm font-semibold text-gray-900">AI Suggestions</h4>
        <Badge variant="ai" size="sm">{suggestions.length}</Badge>
      </div>

      <div className="space-y-2">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="bg-white rounded-lg p-3 border border-purple-100 hover:border-purple-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <button
                onClick={() => onSelect(suggestion.folderId)}
                className="flex-1 min-w-0 text-left group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Folder className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                    {suggestion.folderName}
                  </span>
                </div>

                <ConfidenceBar value={suggestion.confidence} showPercentage={false} height="sm" className="mb-1" />

                <p className="text-xs text-gray-600">{suggestion.reason}</p>
              </button>

              {/* Feedback Buttons */}
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => handleFeedback(suggestion.id, true)}
                  disabled={feedbackSubmitting === suggestion.id}
                  className="p-1 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                  title="Good suggestion"
                >
                  <ThumbsUp className="h-3 w-3 text-gray-400 hover:text-green-600" />
                </button>
                <button
                  onClick={() => handleFeedback(suggestion.id, false)}
                  disabled={feedbackSubmitting === suggestion.id}
                  className="p-1 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  title="Not helpful"
                >
                  <ThumbsDown className="h-3 w-3 text-gray-400 hover:text-red-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
