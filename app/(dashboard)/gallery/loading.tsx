export default function GalleryLoading() {
  return (
    <div className="flex h-screen">
      {/* Context Panel Skeleton */}
      <div className="w-64 border-r border-[var(--border-main)] bg-[var(--bg-primary)]">
        <div className="p-4 space-y-4 animate-pulse">
          {/* Search skeleton */}
          <div className="h-10 bg-gray-200 rounded-lg"></div>

          {/* Buttons skeleton */}
          <div className="h-10 bg-gray-200 rounded-lg"></div>
          <div className="h-10 bg-gray-200 rounded-lg"></div>
          <div className="h-10 bg-gray-200 rounded-lg"></div>

          {/* Folder tree skeleton */}
          <div className="border-t border-[var(--border-main)] pt-4 space-y-2">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded ml-4"></div>
            <div className="h-8 bg-gray-200 rounded ml-4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>

      {/* List View Skeleton */}
      <div className="flex-1 flex flex-col bg-[var(--bg-primary)]">
        {/* Toolbar skeleton */}
        <div className="h-14 border-b border-[var(--border-main)] flex items-center px-4 gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex-1"></div>
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* List items skeleton */}
        <div className="flex-1 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-[72px] border-b border-[var(--border-main)] flex items-center px-4 gap-3 animate-pulse"
            >
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
              <div className="h-12 w-12 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
              </div>
              <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview Area Skeleton */}
      <div className="w-96 border-l border-[var(--border-main)] bg-[var(--bg-primary)] p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-3/4 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-200 rounded"></div>
            <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
