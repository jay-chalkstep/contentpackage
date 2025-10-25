'use client';

import { ExternalLink, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import ConfidenceBar from '@/components/ui/ConfidenceBar';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import type { SearchResult } from '@/types/ai';

interface AISearchResultsProps {
  results: SearchResult[];
  loading?: boolean;
  query?: string;
  onResultClick?: (id: string) => void;
  className?: string;
}

export default function AISearchResults({
  results,
  loading = false,
  query,
  onResultClick,
  className = '',
}: AISearchResultsProps) {
  const router = useRouter();

  const handleClick = (id: string) => {
    if (onResultClick) {
      onResultClick(id);
    } else {
      router.push(`/mockups/${id}`);
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <LoadingSkeleton shape="card" count={3} showSparkle />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Found</h3>
        <p className="text-gray-600">
          {query ? `No mockups match "${query}"` : 'Try a different search query'}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <p className="text-sm text-gray-600">
        Found {results.length} {results.length === 1 ? 'result' : 'results'}
        {query && ` for "${query}"`}
      </p>

      {results.map((result) => (
        <div
          key={result.id}
          className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
          onClick={() => handleClick(result.id)}
        >
          <div className="flex gap-4 p-4">
            {/* Thumbnail */}
            <div className="relative w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
              {result.mockupImageUrl && (
                <img
                  src={result.mockupImageUrl}
                  alt={result.mockupName}
                  className="w-full h-full object-cover"
                />
              )}
              {/* Relevance Badge */}
              <div className="absolute top-2 right-2">
                <Badge variant="ai" size="sm">
                  {Math.round(result.relevanceScore * 100)}%
                </Badge>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                {result.mockupName}
              </h3>

              {/* Relevance Bar */}
              <ConfidenceBar
                value={result.relevanceScore}
                showPercentage={false}
                height="sm"
                className="mb-2"
              />

              {/* Match Explanation */}
              {result.matchExplanation && (
                <p className="text-sm text-gray-600 mb-2">
                  {result.matchExplanation}
                </p>
              )}

              {/* Tags */}
              {result.autoTags && (result.autoTags.visual.length > 0 || result.autoTags.colors.length > 0) && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {result.autoTags.visual.slice(0, 3).map((tag, i) => (
                    <Badge key={i} variant="purple" size="sm">{tag}</Badge>
                  ))}
                  {result.autoTags.colors.slice(0, 2).map((tag, i) => (
                    <Badge key={i} variant="info" size="sm">{tag}</Badge>
                  ))}
                </div>
              )}

              {/* Extracted Text Preview */}
              {result.extractedText && (
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                  {result.extractedText}
                </p>
              )}

              {/* Action */}
              <div className="flex items-center gap-2 text-sm text-purple-600 group-hover:text-purple-700">
                <ExternalLink className="h-4 w-4" />
                <span>View Mockup</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
