export default function UploadLoading() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-10 w-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-6 w-full max-w-2xl bg-gray-200 rounded"></div>
        </div>

        {/* Upload Area Skeleton */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 mb-8 animate-pulse">
          <div className="text-center space-y-4">
            <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto"></div>
            <div className="h-6 w-48 bg-gray-200 rounded mx-auto"></div>
            <div className="h-4 w-64 bg-gray-200 rounded mx-auto"></div>
            <div className="h-10 w-32 bg-gray-200 rounded mx-auto"></div>
          </div>
        </div>

        {/* Form Skeleton */}
        <div className="space-y-6 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded-lg"></div>
            </div>
          ))}

          <div className="flex justify-end gap-3 pt-4">
            <div className="h-10 w-24 bg-gray-200 rounded"></div>
            <div className="h-10 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
