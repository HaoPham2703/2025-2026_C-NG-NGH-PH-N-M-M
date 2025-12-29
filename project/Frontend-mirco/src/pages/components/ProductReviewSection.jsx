import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { reviewApi } from "../../api/reviewApi";
import toast from "react-hot-toast";
import { Star, Send, Edit2, Trash2, CheckCircle } from "lucide-react";

const ProductReviewSection = ({ orderId, products }) => {
  const queryClient = useQueryClient();
  const [editingReview, setEditingReview] = useState(null);
  const [reviewTexts, setReviewTexts] = useState({});
  const [ratings, setRatings] = useState({});

  // Lấy danh sách sản phẩm cần review
  const {
    data: reviewData,
    isLoading: isLoadingReviews,
    error: reviewError,
  } = useQuery(
    ["productsToReview", orderId],
    () => reviewApi.getProductsToReviewInOrder(orderId),
    {
      enabled: !!orderId && products?.length > 0,
      refetchOnWindowFocus: false,
    }
  );

  // Mutation để tạo review
  const createReviewMutation = useMutation(
    (data) => reviewApi.createReview(data),
    {
      onSuccess: () => {
        toast.success("Đánh giá thành công!");
        queryClient.invalidateQueries(["productsToReview", orderId]);
        setReviewTexts({});
        setRatings({});
      },
      onError: (error) => {
        toast.error(
          error?.response?.data?.message || "Có lỗi xảy ra khi đánh giá"
        );
      },
    }
  );

  // Mutation để cập nhật review
  const updateReviewMutation = useMutation(
    ({ reviewId, data }) => reviewApi.updateReview(reviewId, data),
    {
      onSuccess: () => {
        toast.success("Cập nhật đánh giá thành công!");
        queryClient.invalidateQueries(["productsToReview", orderId]);
        setEditingReview(null);
        setReviewTexts({});
        setRatings({});
      },
      onError: (error) => {
        toast.error(
          error?.response?.data?.message ||
            "Có lỗi xảy ra khi cập nhật đánh giá"
        );
      },
    }
  );

  // Mutation để xóa review
  const deleteReviewMutation = useMutation(
    (reviewId) => reviewApi.deleteReview(reviewId),
    {
      onSuccess: () => {
        toast.success("Xóa đánh giá thành công!");
        queryClient.invalidateQueries(["productsToReview", orderId]);
      },
      onError: (error) => {
        toast.error(
          error?.response?.data?.message || "Có lỗi xảy ra khi xóa đánh giá"
        );
      },
    }
  );

  const handleSubmitReview = (productId, productTitle) => {
    const rating = ratings[productId];
    const reviewText = reviewTexts[productId] || "";

    if (!rating) {
      toast.error("Vui lòng chọn số sao đánh giá");
      return;
    }

    if (!reviewText.trim()) {
      toast.error("Vui lòng nhập đánh giá");
      return;
    }

    createReviewMutation.mutate({
      productId,
      orderId,
      rating: parseInt(rating),
      review: reviewText.trim(),
    });
  };

  const handleUpdateReview = (reviewId, productId) => {
    const rating = ratings[productId];
    const reviewText = reviewTexts[productId] || "";

    if (!rating) {
      toast.error("Vui lòng chọn số sao đánh giá");
      return;
    }

    if (!reviewText.trim()) {
      toast.error("Vui lòng nhập đánh giá");
      return;
    }

    updateReviewMutation.mutate({
      reviewId,
      data: {
        rating: parseInt(rating),
        review: reviewText.trim(),
      },
    });
  };

  const handleDeleteReview = (reviewId, productTitle) => {
    if (
      window.confirm(
        `Bạn có chắc chắn muốn xóa đánh giá cho "${productTitle}"?`
      )
    ) {
      deleteReviewMutation.mutate(reviewId);
    }
  };

  const handleStartEdit = (review) => {
    setEditingReview(review._id);
    setRatings({ ...ratings, [review.product]: review.rating });
    setReviewTexts({ ...reviewTexts, [review.product]: review.review });
  };

  const handleCancelEdit = () => {
    setEditingReview(null);
    setRatings({});
    setReviewTexts({});
  };

  const renderStarRating = (productId, currentRating = 0, readOnly = false) => {
    const handleStarClick = (rating) => {
      if (!readOnly) {
        setRatings({ ...ratings, [productId]: rating });
      }
    };

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(star)}
            disabled={readOnly}
            className={`${
              readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"
            } transition-transform`}
          >
            <Star
              className={`w-6 h-6 ${
                star <= currentRating
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (isLoadingReviews) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const productsToReview = reviewData?.data?.productsToReview || [];
  const reviewedProducts = reviewData?.data?.reviewedProducts || [];

  // Tạo map để dễ lookup
  const reviewedMap = {};
  reviewedProducts.forEach((review) => {
    const productId =
      review.product?._id?.toString() || review.product?.toString();
    if (productId) {
      reviewedMap[productId] = review;
    }
  });

  // Tạo map cho tất cả products (cả đã review và chưa review)
  const allProductsMap = {};
  products.forEach((item) => {
    const productId =
      item.product?._id?.toString() || item.product?._id || item.product;
    if (productId) {
      allProductsMap[productId] = item;
    }
  });

  // Lấy tất cả products (đã review và chưa review)
  const allProducts = Object.keys(allProductsMap).map((productId) => {
    const item = allProductsMap[productId];
    const review = reviewedMap[productId];
    return { ...item, review };
  });

  if (allProducts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          Đánh giá sản phẩm
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Hãy chia sẻ trải nghiệm của bạn về các sản phẩm đã mua
        </p>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          {allProducts.map((item) => {
            const productId =
              item.product?._id?.toString() ||
              item.product?._id ||
              item.product;
            const product = item.product;
            const review = item.review;
            const isEditing = editingReview === review?._id;
            const hasReview = !!review && !isEditing;

            return (
              <div
                key={productId}
                className="p-5 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4 mb-4">
                  <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0 border border-gray-200">
                    {product?.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product?.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <Star className="w-6 h-6 text-gray-300 mx-auto" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1 truncate">
                      {product?.title || "Sản phẩm"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Số lượng: {item.quantity}
                    </p>
                  </div>
                  {hasReview && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Đã đánh giá</span>
                    </div>
                  )}
                </div>

                {hasReview ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      {renderStarRating(productId, review.rating, true)}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStartEdit(review)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteReview(review._id, product?.title)
                          }
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {review.review}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Đánh giá của bạn
                      </label>
                      {renderStarRating(
                        productId,
                        ratings[productId] || 0,
                        false
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nhận xét
                      </label>
                      <textarea
                        value={reviewTexts[productId] || ""}
                        onChange={(e) =>
                          setReviewTexts({
                            ...reviewTexts,
                            [productId]: e.target.value,
                          })
                        }
                        placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      {isEditing && (
                        <>
                          <button
                            onClick={() =>
                              handleUpdateReview(review._id, productId)
                            }
                            disabled={
                              updateReviewMutation.isLoading ||
                              !ratings[productId] ||
                              !reviewTexts[productId]?.trim()
                            }
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updateReviewMutation.isLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Đang cập nhật...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Cập nhật
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
                          >
                            Hủy
                          </button>
                        </>
                      )}
                      {!isEditing && (
                        <button
                          onClick={() =>
                            handleSubmitReview(productId, product?.title)
                          }
                          disabled={
                            createReviewMutation.isLoading ||
                            !ratings[productId] ||
                            !reviewTexts[productId]?.trim()
                          }
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {createReviewMutation.isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Đang gửi...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Gửi đánh giá
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProductReviewSection;
