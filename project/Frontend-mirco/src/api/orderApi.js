import { orderClient, restaurantClient } from "./axiosClients";
import axios from "axios";

const API_GATEWAY_URL = "http://localhost:5001";

// Restaurant order client - uses restaurant token to call order service through API Gateway
const createRestaurantOrderRequest = async (method, url, data = null, config = {}) => {
  const token = localStorage.getItem("restaurant_token");
  if (!token) {
    throw new Error("Restaurant token not found");
  }

  const axiosConfig = {
    ...config,
    headers: {
      ...config.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  const fullUrl = `${API_GATEWAY_URL}/api/v1${url}`;

  try {
    let response;
    switch (method.toLowerCase()) {
      case "get":
        response = await axios.get(fullUrl, axiosConfig);
        break;
      case "post":
        response = await axios.post(fullUrl, data, axiosConfig);
        break;
      case "patch":
        response = await axios.patch(fullUrl, data, axiosConfig);
        break;
      case "put":
        response = await axios.put(fullUrl, data, axiosConfig);
        break;
      case "delete":
        response = await axios.delete(fullUrl, axiosConfig);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
    // Return response.data to match the format expected by react-query (same as other clients)
    return response.data;
  } catch (error) {
    console.error(`[RestaurantOrderClient] Error in ${method.toUpperCase()} ${url}:`, error);
    // Re-throw to let react-query handle it
    throw error;
  }
};

// Restaurant order client - uses restaurant token
const restaurantOrderClient = {
  get: (url, config) => createRestaurantOrderRequest("get", url, null, config),
  post: (url, data, config) => createRestaurantOrderRequest("post", url, data, config),
  patch: (url, data, config) => createRestaurantOrderRequest("patch", url, data, config),
  put: (url, data, config) => createRestaurantOrderRequest("put", url, data, config),
  delete: (url, config) => createRestaurantOrderRequest("delete", url, null, config),
};

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
  getTopRestaurants: () => orderClient.get("/orders/topRestaurants"),

  // Restaurant-specific order operations (uses restaurant token)
  // Check if we're in restaurant context
  isRestaurantContext: () => !!localStorage.getItem("restaurant_token"),

  // Get order for restaurant (uses restaurant token if available)
  getOrderForRestaurant: async (id) => {
    const isRestaurant = !!localStorage.getItem("restaurant_token");
    console.log("[orderApi] getOrderForRestaurant:", { id, isRestaurant });
    
    try {
      const response = isRestaurant
        ? await restaurantOrderClient.get(`/orders/${id}`)
        : await orderClient.get(`/orders/${id}`);
      
      console.log("[orderApi] getOrderForRestaurant response:", response);
      return response;
    } catch (error) {
      console.error("[orderApi] getOrderForRestaurant error:", error);
      throw error;
    }
  },

  // Update order for restaurant (uses restaurant token if available)
  updateOrderForRestaurant: (id, data) => {
    const isRestaurant = !!localStorage.getItem("restaurant_token");
    if (isRestaurant) {
      return restaurantOrderClient.patch(`/orders/${id}`, data);
    }
    return orderClient.patch(`/orders/${id}`, data);
  },
};
