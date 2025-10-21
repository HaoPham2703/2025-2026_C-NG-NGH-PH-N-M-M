import { userClient } from "./axiosClients";

export const userApi = {
  // Admin user management
  getAllUsers: () => userClient.get("/api/v1/users"),
  getTableUser: () => userClient.get("/api/v1/users/getTableUser"),
  getUser: (id) => userClient.get(`/api/v1/users/${id}`),
  updateUser: (id, data) => userClient.patch(`/api/v1/users/${id}`, data),
  deleteUser: (id) => userClient.delete(`/api/v1/users/${id}`),
};

