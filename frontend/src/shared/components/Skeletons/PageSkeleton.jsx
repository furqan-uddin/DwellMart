const PageSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 w-full overflow-x-hidden">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200 animate-pulse">
        <div className="container mx-auto px-2 sm:px-4 py-4">
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Navbar Skeleton */}
      <div className="bg-white border-b border-gray-200 animate-pulse">
        <div className="container mx-auto px-2 sm:px-4 py-3">
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <main className="container mx-auto px-2 sm:px-4 py-8">
        {/* Title Skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-10 bg-gray-300 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>

        {/* Content Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="glass-card rounded-2xl p-6">
              <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer Skeleton */}
      <div className="mt-20 bg-gray-800 animate-pulse">
        <div className="container mx-auto px-2 sm:px-4 py-16">
          <div className="h-6 bg-gray-700 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-700 rounded w-64"></div>
        </div>
      </div>
    </div>
  );
};

export default PageSkeleton;

