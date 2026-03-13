const ProductCardSkeleton = () => {
  return (
    <div className="glass-card rounded-lg overflow-hidden h-full flex flex-col">
      {/* Image Skeleton */}
      <div className="w-full h-32 bg-gradient-to-br from-gray-200 to-gray-300 relative overflow-hidden">
        <div className="absolute inset-0 shimmer"></div>
      </div>

      {/* Content Skeleton */}
      <div className="p-2 flex-1 flex flex-col">
        {/* Title Skeleton */}
        <div className="h-3 bg-gray-300 rounded mb-0.5 relative overflow-hidden">
          <div className="absolute inset-0 shimmer"></div>
        </div>
        <div className="h-3 bg-gray-300 rounded w-3/4 mb-0.5 relative overflow-hidden">
          <div className="absolute inset-0 shimmer"></div>
        </div>
        
        {/* Unit Skeleton */}
        <div className="h-2.5 bg-gray-200 rounded w-1/2 mb-0.5 relative overflow-hidden">
          <div className="absolute inset-0 shimmer"></div>
        </div>

        {/* Rating Skeleton */}
        <div className="flex items-center gap-0.5 mb-0.5">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-2 h-2 bg-gray-200 rounded relative overflow-hidden">
                <div className="absolute inset-0 shimmer"></div>
              </div>
            ))}
          </div>
          <div className="h-2 bg-gray-200 rounded w-8 relative overflow-hidden">
            <div className="absolute inset-0 shimmer"></div>
          </div>
        </div>

        {/* Price Skeleton */}
        <div className="flex items-center gap-1.5 mb-1">
          <div className="h-3 bg-gray-300 rounded w-16 relative overflow-hidden">
            <div className="absolute inset-0 shimmer"></div>
          </div>
          <div className="h-2.5 bg-gray-200 rounded w-12 relative overflow-hidden">
            <div className="absolute inset-0 shimmer"></div>
          </div>
        </div>

        {/* Button Skeleton */}
        <div className="h-6 bg-gray-300 rounded-md mt-auto relative overflow-hidden">
          <div className="absolute inset-0 shimmer"></div>
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;

