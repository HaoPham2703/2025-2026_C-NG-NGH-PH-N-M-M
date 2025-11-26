import { orderClient } from "./axiosClients";

export const orderApi = {
  // Orders
  getOrders: (params) => orderClient.get("/orders", { params }),
  getOrder: (id) => orderClient.get(`/orders/${id}`),
  createOrder: (data) => orderClient.post("/orders", data),
  updateOrder: (id, data) => orderClient.patch(`/orders/${id}`, data),
  deleteOrder: (id) => orderClient.delete(`/orders/${id}`),

  // Get orders by restaurant ID (for restaurant dashboard)
  // Note: This endpoint requires user token, but restaurant should call Order Service directly
  // For now, we'll use orderClient which requires user token
  // TODO: Create a restaurant-specific order client if needed
  getOrdersByRestaurant: (restaurantId) =>
    orderClient.get(`/orders/restaurant/${restaurantId}`),

  // Get active orders count by restaurant ID (optimized for status checking)
  getActiveOrdersCountByRestaurant: (restaurantId) =>
    orderClient.get(`/orders/restaurant/${restaurantId}/active-count`),

  // Calculate shipping fee
  calculateShippingFee: (data) =>
    orderClient.post("/orders/shipping-fee", data),

  // Analytics
  getOrderStats: () => orderClient.get("/orders/count"),
  getRevenueStats: () => orderClient.get("/orders/sum"),
  getTopProducts: (data) => orderClient.post("/orders/topProduct", data),
};
