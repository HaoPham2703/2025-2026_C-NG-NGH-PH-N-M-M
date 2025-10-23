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
  });

  // Handle different error statuses
  if (response?.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.error("Session expired. Please login again.");
    window.location.href = "/login";
  } else if (response?.status === 403) {
    toast.error("Access denied. You do not have permission.");
  } else if (response?.status === 404) {
    toast.error("Resource not found.");
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

restaurantClient.interceptors.request.use(createRequestInterceptor("Restaurant"));
restaurantClient.interceptors.response.use(
  createResponseInterceptor("Restaurant"),
  createErrorInterceptor("Restaurant")
);

// Default client (for backward compatibility)
export default userClient;
