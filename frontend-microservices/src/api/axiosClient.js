import axios from "axios";
import toast from "react-hot-toast";

// Create axios instance for microservices API Gateway
const axiosClient = axios.create({
  baseURL: "/api/v1", // Sử dụng proxy thay vì absolute URL
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log("🚀 API Request:", {
      method: config.method?.toUpperCase(),
      url: config.url,
      headers: config.headers,
    });

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosClient.interceptors.response.use(
  (response) => {
    console.log("✅ API Response:", {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });

    return response.data;
  },
  (error) => {
    const { config, response } = error;

    console.error("❌ API Error:", {
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
  }
);

export default axiosClient;
