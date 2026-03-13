const OrderCardSkeleton = () => {
  return (
    <div className="glass-card rounded-2xl p-6 overflow-hidden animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
          <div>
            <div className="h-5 bg-gray-300 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-48"></div>
          </div>
        </div>
        <div className="flex flex-col sm:items-end gap-2">
          <div className="h-6 bg-gray-300 rounded-full w-24"></div>
          <div className="h-6 bg-gray-300 rounded w-20"></div>
        </div>
      </div>

      {/* Items Skeleton */}
      <div className="mb-6">
        <div className="h-5 bg-gray-300 rounded w-24 mb-3"></div>
        <div className="space-y-3">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
              <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-48 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="h-5 bg-gray-300 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions Skeleton */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="h-11 bg-gray-300 rounded-xl flex-1 sm:flex-initial sm:w-32"></div>
        <div className="h-11 bg-gray-300 rounded-xl flex-1 sm:flex-initial sm:w-32"></div>
      </div>
    </div>
  );
};

export default OrderCardSkeleton;

