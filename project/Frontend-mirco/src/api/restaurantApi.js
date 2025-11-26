import { userClient } from "./axiosClients";

export const restaurantApi = {
  // Admin restaurant management
  // Get all restaurants with filters and pagination
  getRestaurants: (params) =>
    userClient.get("/api/v1/admin/restaurants", { params }),

  // Get single restaurant
  getRestaurant: (id) => userClient.get(`/api/v1/admin/restaurants/${id}`),

  // Create restaurant
  createRestaurant: (data) =>
    userClient.post("/api/v1/admin/restaurants", data),

  // Update restaurant
  updateRestaurant: (id, data) =>
    userClient.put(`/api/v1/admin/restaurants/${id}`, data),

  // Delete restaurant
  deleteRestaurant: (id) =>
    userClient.delete(`/api/v1/admin/restaurants/${id}`),

  // Update restaurant status
  updateRestaurantStatus: (id, status) =>
    userClient.patch(`/api/v1/admin/restaurants/${id}/status`, { status }),

  // Verify restaurant
  verifyRestaurant: (id) =>
    userClient.patch(`/api/v1/admin/restaurants/${id}/verify`),

  // Get restaurant statistics
  getRestaurantStats: () => userClient.get("/api/v1/admin/restaurants/stats"),

  // Check active orders for restaurant
  checkActiveOrders: (id) =>
    userClient.get(`/api/v1/admin/restaurants/${id}/check-orders`),
};
