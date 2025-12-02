import axios from "axios";
import toast from "react-hot-toast";

// Base configuration
const baseConfig = {
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
};

// Request interceptor factory
const createRequestInterceptor = (serviceName) => (config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log(`🚀 ${serviceName} API Request:`, {
    method: config.method?.toUpperCase(),
    url: config.url,
    headers: config.headers,
  });

  return config;
};

// Response interceptor factory
const createResponseInterceptor = (serviceName) => (response) => {
  console.log(`✅ ${serviceName} API Response:`, {
    status: response.status,
    url: response.config.url,
    data: response.data,
  });

  return response.data;
};

// Error interceptor factory
const createErrorInterceptor = (serviceName) => (error) => {
  const { config, response } = error;

  console.error(`❌ ${serviceName} API Error:`, {
    status: response?.status,
    url: config?.url,
    message: response?.data?.message || error.message,
    code: error.code,
  });

  // Handle request aborted (không phải lỗi service, có thể do timeout hoặc component unmount)
  if (
    error.code === "ECONNABORTED" ||
    error.message?.includes("aborted") ||
    error.message?.includes("request aborted")
  ) {
    // Không hiện toast cho request aborted - có thể là do component unmount hoặc timeout
    // Chỉ log để debug
    console.warn(`[${serviceName}] Request aborted:`, config?.url);
    return Promise.reject(error);
  }

  // Handle network errors (service not available)
  if (
    error.code === "ECONNREFUSED" ||
    error.code === "ETIMEDOUT" ||
    error.message?.includes("Network Error") ||
    error.message?.includes("timeout")
  ) {
    toast.error(
      `${serviceName} service is not available. Please check if the service is running.`,
      { duration: 5000 }
    );
    return Promise.reject(error);
  }

  // Handle different error statuses
  if (response?.status === 401) {
    // Only redirect to user login if this is NOT a restaurant client
    if (serviceName !== "Restaurant") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      toast.error("Session expired. Please login again.");
      window.location.href = "/login";
    } else {
      // For restaurant: redirect to restaurant login
      localStorage.removeItem("restaurant_token");
      localStorage.removeItem("restaurant_data");
      toast.error("Session expired. Please login again.");
      window.location.href = "/restaurant/login";
    }
  } else if (response?.status === 403) {
    toast.error("Access denied. You do not have permission.");
  } else if (response?.status === 404) {
    toast.error("Resource not found.");
  } else if (response?.status === 503) {
    toast.error(
      `${serviceName} service is temporarily unavailable. Please try again later.`,
      { duration: 5000 }
    );
  } else if (response?.status === 500) {
    toast.error("Server error. Please try again later.");
  } else if (response?.data?.message) {
    toast.error(response.data.message);
  } else {
    toast.error("An unexpected error occurred.");
  }

  return Promise.reject(error);
};

// API Gateway URL - All requests go through the gateway
const API_GATEWAY_URL = "http://localhost:5001";

// User Service Client - via API Gateway (port 5001)
export const userClient = axios.create({
  ...baseConfig,
  baseURL: API_GATEWAY_URL,
});

userClient.interceptors.request.use(createRequestInterceptor("User"));
userClient.interceptors.response.use(
  createResponseInterceptor("User"),
  createErrorInterceptor("User")
);

// Product Service Client - via API Gateway (port 5001)
export const productClient = axios.create({
  ...baseConfig,
  baseURL: `${API_GATEWAY_URL}/api/v1`,
});

productClient.interceptors.request.use(createRequestInterceptor("Product"));
productClient.interceptors.response.use(
  createResponseInterceptor("Product"),
  createErrorInterceptor("Product")
);

// Order Service Client - via API Gateway (port 5001)
export const orderClient = axios.create({
  ...baseConfig,
  baseURL: `${API_GATEWAY_URL}/api/v1`,
  timeout: 30000, // 30 seconds timeout cho order requests (có thể load nhiều data)
});

orderClient.interceptors.request.use(createRequestInterceptor("Order"));
orderClient.interceptors.response.use(
  createResponseInterceptor("Order"),
  createErrorInterceptor("Order")
);

// Payment Service Client - via API Gateway (port 5001)
export const paymentClient = axios.create({
  ...baseConfig,
  baseURL: `${API_GATEWAY_URL}/api/v1`,
});

paymentClient.interceptors.request.use(createRequestInterceptor("Payment"));
paymentClient.interceptors.response.use(
  createResponseInterceptor("Payment"),
  createErrorInterceptor("Payment")
);

// Restaurant Service Client - via API Gateway (port 5001)
export const restaurantClient = axios.create({
  ...baseConfig,
  baseURL: `${API_GATEWAY_URL}/api`,
});

// Restaurant client uses a different token stored at 'restaurant_token'
restaurantClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("restaurant_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`🚀 Restaurant API Request:`, {
    method: config.method?.toUpperCase(),
    url: config.url,
    headers: config.headers,
  });
  return config;
});
restaurantClient.interceptors.response.use(
  createResponseInterceptor("Restaurant"),
  createErrorInterceptor("Restaurant")
);

// Default client (for backward compatibility)
export default userClient;
