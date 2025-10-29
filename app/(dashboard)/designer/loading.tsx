export default function DesignerLoading() {
  return (
    <div className="h-screen flex flex-col">
      {/* Toolbar Skeleton */}
      <div className="h-16 border-b border-[var(--border-main)] flex items-center justify-between px-6 bg-[var(--bg-primary)]">
        <div className="flex items-center gap-4 animate-pulse">
          <div className="h-8 w-32 bg-gray-200 rounded"></div>
          <div className="h-8 w-24 bg-gray-200 rounded"></div>
        </div>
        <div className="flex items-center gap-3 animate-pulse">
          <div className="h-9 w-24 bg-gray-200 rounded"></div>
          <div className="h-9 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar Skeleton */}
        <div className="w-80 border-r border-[var(--border-main)] bg-[var(--bg-primary)] p-4">
          <div className="space-y-4 animate-pulse">
            <div className="h-6 w-32 bg-gray-200 rounded"></div>

            {/* Form fields skeleton */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded-lg"></div>
              </div>
            ))}

            {/* Color picker skeleton */}
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="flex gap-2">
                <div className="h-10 w-10 bg-gray-200 rounded"></div>
                <div className="h-10 w-10 bg-gray-200 rounded"></div>
                <div className="h-10 w-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas Skeleton */}
        <div className="flex-1 bg-gray-100 p-8">
          <div className="h-full flex items-center justify-center">
            <div className="w-full max-w-4xl aspect-video bg-white rounded-lg shadow-lg animate-pulse">
              <div className="h-full flex items-center justify-center">
                <div className="w-32 h-32 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
