'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, ExternalLink, Eye, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import ConfidenceBar from '@/components/ui/ConfidenceBar';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import type { SimilarMockup } from '@/types/ai';

interface SimilarMockupsModalProps {
  mockupId: string;
  mockupName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function SimilarMockupsModal({
  mockupId,
  mockupName,
  isOpen,
  onClose,
}: SimilarMockupsModalProps) {
  const router = useRouter();
  const [similarMockups, setSimilarMockups] = useState<SimilarMockup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minSimilarity, setMinSimilarity] = useState(50);

  useEffect(() => {
    if (isOpen && mockupId) {
      fetchSimilarMockups();
    }
  }, [isOpen, mockupId]);

  const fetchSimilarMockups = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/similar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mockupId, limit: 10 }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to find similar mockups');
      }

      const data = await response.json();
      setSimilarMockups(data.similar || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleMockupClick = (id: string) => {
    router.push(`/mockups/${id}`);
    onClose();
  };

  const filteredMockups = similarMockups.filter(
    m => m.similarity * 100 >= minSimilarity
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 overflow-hidden flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-purple-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Similar Mockups</h2>
                <p className="text-sm text-gray-600">Find designs similar to "{mockupName}"</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Similarity Threshold Slider */}
          <div className="mt-4">
            <label className="text-sm text-gray-700 mb-2 block">
              Minimum Similarity: {minSimilarity}%
            </label>
            <input
              type="range"
              min="50"
              max="100"
              value={minSimilarity}
              onChange={e => setMinSimilarity(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>50% (More results)</span>
              <span>100% (Exact matches)</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="space-y-4">
              <LoadingSkeleton shape="card" count={3} showSparkle />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-800">{error}</p>
              <button
                onClick={fetchSimilarMockups}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && filteredMockups.length === 0 && (
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Similar Mockups Found</h3>
              <p className="text-gray-600">
                {minSimilarity > 50
                  ? 'Try lowering the similarity threshold'
                  : 'This mockup is unique!'}
              </p>
            </div>
          )}

          {!loading && !error && filteredMockups.length > 0 && (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Found {filteredMockups.length} similar {filteredMockups.length === 1 ? 'mockup' : 'mockups'}
              </p>

              <div className="space-y-4">
                {filteredMockups.map((mockup) => (
                  <div
                    key={mockup.id}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow group"
                  >
                    <div className="flex gap-4 p-4">
                      {/* Thumbnail */}
                      <div className="relative w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                        {mockup.mockupImageUrl ? (
                          <img
                            src={mockup.mockupImageUrl}
                            alt={mockup.mockupName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Eye className="h-8 w-8" />
                          </div>
                        )}
                        {/* Similarity Badge */}
                        <div className="absolute top-2 right-2">
                          <Badge variant="ai" size="sm">
                            {Math.round(mockup.similarity * 100)}%
                          </Badge>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate mb-2">
                          {mockup.mockupName}
                        </h3>

                        {/* Similarity Bar */}
                        <ConfidenceBar
                          value={mockup.similarity}
                          showPercentage={false}
                          height="sm"
                          className="mb-3"
                        />

                        {/* Matched Aspects */}
                        {mockup.matchedAspects && mockup.matchedAspects.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-500 mb-1">Matched aspects:</p>
                            <div className="flex flex-wrap gap-1">
                              {mockup.matchedAspects.map((aspect, i) => (
                                <Badge key={i} variant="info" size="sm">
                                  {aspect}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <button
                          onClick={() => handleMockupClick(mockup.id)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View Mockup
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
