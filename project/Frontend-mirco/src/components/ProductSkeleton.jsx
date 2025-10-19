const ProductSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-3xl p-6 shadow-lg animate-pulse"
        >
          {/* Image skeleton */}
          <div className="w-full h-48 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-2xl mb-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
          </div>

          {/* Content skeleton */}
          <div className="space-y-4">
            {/* Title skeleton */}
            <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-3/4 animate-shimmer"></div>

            {/* Rating skeleton */}
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, j) => (
                  <div
                    key={j}
                    className="w-4 h-4 bg-gray-200 rounded animate-pulse"
                  ></div>
                ))}
              </div>
              <div className="h-4 bg-gray-200 rounded w-16 animate-shimmer"></div>
            </div>

            {/* Price and button skeleton */}
            <div className="flex items-center justify-between">
              <div className="h-8 bg-gray-200 rounded w-24 animate-shimmer"></div>
              <div className="h-10 bg-gray-200 rounded-full w-24 animate-shimmer"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductSkeleton;

