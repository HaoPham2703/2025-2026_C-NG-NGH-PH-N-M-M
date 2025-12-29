import { productClient } from "./axiosClients";

export const reviewApi = {
  // Tạo review cho sản phẩm trong order
  createReview: (data) => productClient.post("/reviews", data),

  // Lấy reviews của sản phẩm (public)
  getProductReviews: (productId, params = {}) =>
    productClient.get(`/reviews/product/${productId}`, { params }),

  // Lấy danh sách sản phẩm trong order cần review (cần auth)
  getProductsToReviewInOrder: (orderId) =>
    productClient.get(`/reviews/order/${orderId}/products`),

  // Lấy review của user cho sản phẩm trong order (cần auth)
  getUserReviewForProductInOrder: (orderId, productId) =>
    productClient.get(`/reviews/order/${orderId}/product/${productId}`),

  // Cập nhật review
  updateReview: (reviewId, data) =>
    productClient.patch(`/reviews/${reviewId}`, data),

  // Xóa review
  deleteReview: (reviewId) => productClient.delete(`/reviews/${reviewId}`),
};
