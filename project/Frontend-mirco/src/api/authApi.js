import { userClient } from "./axiosClients";

export const authApi = {
  // Authentication - via API Gateway
  signup: (data) => userClient.post("/api/v1/auth/signup", data),
  login: (data) => userClient.post("/api/v1/auth/login", data),
  logout: () => userClient.get("/api/v1/auth/logout"),
  verify: () => userClient.get("/api/v1/auth/verify"),
  forgotPassword: (data) => userClient.post("/api/v1/auth/forgotPassword", data),
  resetPassword: (token, data) =>
    userClient.patch(`/api/v1/auth/resetPassword/${token}`, data),

  // User profile - via API Gateway
  getProfile: () => userClient.get("/api/v1/users/me"),
  updateProfile: (data) => userClient.patch("/api/v1/users/updateMe", data),
  changePassword: (data) => userClient.patch("/api/v1/users/updateMyPassword", data),

  // Address management - via API Gateway
  getAddresses: () => userClient.get("/api/v1/users/me/address"),
  createAddress: (data) => userClient.patch("/api/v1/users/createAddress", data),
  updateAddress: (data) => userClient.patch("/api/v1/users/updateAddress", data),
  deleteAddress: (data) => userClient.patch("/api/v1/users/deleteAddress", data),
  setDefaultAddress: (data) => userClient.patch("/api/v1/users/setDefaultAddress", data),
};
