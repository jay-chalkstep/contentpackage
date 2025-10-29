'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function BrandsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Brands error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center h-screen bg-[var(--bg-primary)]">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>

          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            Something went wrong
          </h2>

          <p className="text-[var(--text-secondary)] mb-6">
            We encountered an error while loading your brand library. This has been logged and we'll look into it.
          </p>

          {error.message && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 font-mono break-words">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--accent-blue)] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>

            <a
              href="/brands"
              className="text-sm text-[var(--accent-blue)] hover:underline"
            >
              Return to Brands
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
