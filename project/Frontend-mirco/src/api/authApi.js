import { userClient } from "./axiosClients";

export const authApi = {
  // Authentication - Direct User Service endpoints
  signup: (data) => userClient.post("/signup", data),
  login: (data) => userClient.post("/login", data),
  logout: () => userClient.get("/logout"),
  verify: () => userClient.get("/verify"),
  forgotPassword: (data) => userClient.post("/forgotPassword", data),
  resetPassword: (token, data) =>
    userClient.patch(`/resetPassword/${token}`, data),

  // User profile - Direct User Service endpoints
  getProfile: () => userClient.get("/me"),
  updateProfile: (data) => userClient.patch("/updateMe", data),
  changePassword: (data) => userClient.patch("/updateMyPassword", data),

  // Address management - Direct User Service endpoints
  getAddresses: () => userClient.get("/me/address"),
  createAddress: (data) => userClient.patch("/createAddress", data),
  updateAddress: (data) => userClient.patch("/updateAddress", data),
  deleteAddress: (data) => userClient.patch("/deleteAddress", data),
  setDefaultAddress: (data) => userClient.patch("/setDefaultAddress", data),
};
