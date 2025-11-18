import axiosClient from "./axiosClient";

const reviewApi = {
  // Create a new review for an order
  createReview: (reviewData) => {
    const url = "/reviews";
    return axiosClient.post(url, reviewData);
  },

  // Get review by ID
  getReview: (reviewId) => {
    const url = `/reviews/${reviewId}`;
    return axiosClient.get(url);
  },

  // Get review by order ID
  getReviewByOrder: (orderId) => {
    const url = `/reviews/order/${orderId}`;
    return axiosClient.get(url);
  },

  // Get reviews by restaurant ID with pagination and filters
  getRestaurantReviews: (restaurantId, params = {}) => {
    const url = `/reviews/restaurant/${restaurantId}`;
    return axiosClient.get(url, { params });
  },

  // Get reviews by user ID
  getUserReviews: (userId, params = {}) => {
    const url = `/reviews/user/${userId}`;
    return axiosClient.get(url, { params });
  },

  // Update a review
  updateReview: (reviewId, reviewData) => {
    const url = `/reviews/${reviewId}`;
    return axiosClient.patch(url, reviewData);
  },

  // Delete a review
  deleteReview: (reviewId) => {
    const url = `/reviews/${reviewId}`;
    return axiosClient.delete(url);
  },

  // Get restaurant rating statistics
  getRestaurantStats: (restaurantId) => {
    const url = `/reviews/stats/restaurant/${restaurantId}`;
    return axiosClient.get(url);
  },

  // Check if an order can be reviewed
  canReviewOrder: (orderId) => {
    const url = `/orders/${orderId}/can-review`;
    return axiosClient.get(url);
  },
};

export { reviewApi };
