import axios from "axios";

// Payment Service 2 Client - Using Vite proxy to avoid CORS issues
// In development, use proxy path. In production, use direct URL or API Gateway
const isDevelopment = import.meta.env.DEV;
const paymentService2Client = axios.create({
  baseURL: isDevelopment
    ? "/payment-service-2/api/v1" // Use Vite proxy in development
    : "http://localhost:3005/api/v1", // Direct connection in production
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor
paymentService2Client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`🚀 Payment Service 2 API Request:`, {
      method: config.method?.toUpperCase(),
      url: config.url,
    });
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
paymentService2Client.interceptors.response.use(
  (response) => {
    console.log(`✅ Payment Service 2 API Response:`, {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response.data;
  },
  (error) => {
    console.error(`❌ Payment Service 2 API Error:`, {
      code: error.code,
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      responseData: error.response?.data,
      fullError: error,
    });
    return Promise.reject(error);
  }
);

export const paymentApi2 = {
  // VNPay
  createVNPayUrl: (data) =>
    paymentService2Client.post("/payments/create_payment_url", data),
  returnVNPayStatus: (data) =>
    paymentService2Client.post("/payments/return_payment_status", data),
};
