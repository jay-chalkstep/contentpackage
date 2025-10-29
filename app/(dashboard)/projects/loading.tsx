export default function ProjectsLoading() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-10 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="h-6 w-96 bg-gray-200 rounded"></div>
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="border border-[var(--border-main)] rounded-lg p-6 animate-pulse"
            >
              {/* Color bar */}
              <div className="h-2 bg-gray-200 rounded-full mb-4"></div>

              {/* Project name */}
              <div className="h-6 w-3/4 bg-gray-200 rounded mb-2"></div>

              {/* Client name */}
              <div className="h-4 w-1/2 bg-gray-200 rounded mb-4"></div>

              {/* Description */}
              <div className="space-y-2 mb-4">
                <div className="h-3 w-full bg-gray-200 rounded"></div>
                <div className="h-3 w-5/6 bg-gray-200 rounded"></div>
              </div>

              {/* Stats */}
              <div className="flex gap-4 pt-4 border-t border-[var(--border-main)]">
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
