export default function SearchLoading() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-8 text-center animate-pulse">
          <div className="h-10 w-64 bg-gray-200 rounded mx-auto mb-4"></div>
          <div className="h-6 w-96 bg-gray-200 rounded mx-auto"></div>
        </div>

        {/* Search Box Skeleton */}
        <div className="max-w-2xl mx-auto mb-12 animate-pulse">
          <div className="h-14 bg-gray-200 rounded-lg"></div>
        </div>

        {/* Results Skeleton */}
        <div className="space-y-8">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="border border-[var(--border-main)] rounded-lg overflow-hidden animate-pulse"
              >
                {/* Logo preview */}
                <div className="h-40 bg-gray-200"></div>

                {/* Logo info */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-20 bg-gray-200 rounded"></div>
                    <div className="h-5 w-12 bg-gray-200 rounded-full"></div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-3 w-16 bg-gray-200 rounded"></div>
                    <div className="h-3 w-16 bg-gray-200 rounded"></div>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1 h-9 bg-gray-200 rounded"></div>
                    <div className="w-9 h-9 bg-gray-200 rounded"></div>
                    <div className="w-9 h-9 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
