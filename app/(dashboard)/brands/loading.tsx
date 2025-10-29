export default function BrandsLoading() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-10 w-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-6 w-96 bg-gray-200 rounded"></div>
        </div>

        {/* Search and Filter Skeleton */}
        <div className="mb-6 flex gap-4 animate-pulse">
          <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
          <div className="w-32 h-10 bg-gray-200 rounded-lg"></div>
          <div className="w-32 h-10 bg-gray-200 rounded-lg"></div>
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="border border-[var(--border-main)] rounded-lg overflow-hidden animate-pulse"
            >
              {/* Logo preview */}
              <div className="h-40 bg-gray-200"></div>

              {/* Brand info */}
              <div className="p-4 space-y-3">
                {/* Brand name */}
                <div className="h-5 w-3/4 bg-gray-200 rounded"></div>

                {/* Domain */}
                <div className="h-4 w-1/2 bg-gray-200 rounded"></div>

                {/* Color swatches */}
                <div className="flex gap-2">
                  <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                  <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                  <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  <div className="flex-1 h-8 bg-gray-200 rounded"></div>
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
