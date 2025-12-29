import React, { useState } from "react";
import { useQuery } from "react-query";
import { reviewApi } from "../../api/reviewApi";
import { Star, User, MessageSquare } from "lucide-react";

const ProductReviewsSection = ({ productId }) => {
  const [page, setPage] = useState(1);
  const limit = 10;

  const {
    data: reviewsData,
    isLoading,
    error,
  } = useQuery(
    ["productReviews", productId, page],
    () => reviewApi.getProductReviews(productId, { page, limit }),
    {
      enabled: !!productId,
      refetchOnWindowFocus: false,
    }
  );

  const reviews = reviewsData?.data?.reviews || [];
  const pagination = reviewsData?.data?.pagination || {};
  const totalPages = pagination.totalPages || 1;

  const renderStarRating = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-lg">
        <p className="text-red-600">
          Không thể tải đánh giá. Vui lòng thử lại sau.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-orange-500" />
          Đánh giá sản phẩm
        </h3>
        <div className="text-sm text-gray-600">
          {pagination.total || 0} đánh giá
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">
            Chưa có đánh giá nào cho sản phẩm này
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Hãy là người đầu tiên đánh giá sản phẩm này!
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {reviews.map((review) => {
              // User field là userId string, hiển thị tên mặc định
              const userName = "Khách hàng";
              const userInitials = userName.charAt(0).toUpperCase();

              return (
                <div
                  key={review._id}
                  className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center flex-shrink-0 text-white font-semibold">
                      {userInitials}
                    </div>

                    {/* Review Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {userName}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {formatDate(review.createdAt)}
                          </p>
                        </div>
                        <div>{renderStarRating(review.rating)}</div>
                      </div>

                      {review.review && (
                        <p className="text-gray-700 leading-relaxed mt-2">
                          {review.review}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Trước
              </button>
              <span className="px-4 py-2 text-gray-700">
                Trang {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductReviewsSection;
