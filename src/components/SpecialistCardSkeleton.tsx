export default function SpecialistCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="flex flex-col h-full">
        {/* Header skeleton */}
        <div className="flex items-start justify-between mb-3">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-5 bg-gray-200 rounded-full w-16"></div>
        </div>

        {/* Categories skeleton */}
        <div className="mb-3">
          <div className="flex gap-1">
            <div className="h-5 bg-gray-200 rounded-full w-20"></div>
            <div className="h-5 bg-gray-200 rounded-full w-16"></div>
          </div>
        </div>

        {/* Location skeleton */}
        <div className="mb-3">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>

        {/* Experience skeleton */}
        <div className="mb-3">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>

        {/* Price skeleton */}
        <div className="mb-4">
          <div className="h-4 bg-gray-200 rounded w-28"></div>
        </div>

        {/* Footer skeleton */}
        <div className="mt-auto">
          <div className="text-center">
            <div className="h-8 bg-gray-200 rounded-md w-24 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
