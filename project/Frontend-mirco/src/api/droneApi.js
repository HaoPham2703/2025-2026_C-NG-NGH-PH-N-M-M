import { orderClient } from "./axiosClients";

const API_GATEWAY_URL = "http://localhost:5001";

export const droneApi = {
  // Get all drones
  getAllDrones: async () => {
    const response = await orderClient.get(`${API_GATEWAY_URL}/api/v1/drones`);
    // Ensure response has correct structure
    if (response?.data && Array.isArray(response.data)) {
      return { data: { drones: response.data } };
    }
    return response;
  },

  // Get available drones
  getAvailableDrones: () => {
    return orderClient.get(`${API_GATEWAY_URL}/api/v1/drones/available`);
  },

  // Get drone by ID
  getDroneById: (id) => {
    return orderClient.get(`${API_GATEWAY_URL}/api/v1/drones/${id}`);
  },

  // Get drone by order ID
  getDroneByOrderId: (orderId) => {
    return orderClient.get(`${API_GATEWAY_URL}/api/v1/drones/order/${orderId}`);
  },

  // Create new drone
  createDrone: (data) => {
    return orderClient.post(`${API_GATEWAY_URL}/api/v1/drones`, data);
  },

  // Assign drone to order
  assignDroneToOrder: (data) => {
    return orderClient.post(`${API_GATEWAY_URL}/api/v1/drones/assign`, data);
  },

  // Update drone status
  updateDroneStatus: (id, status) => {
    return orderClient.patch(`${API_GATEWAY_URL}/api/v1/drones/${id}/status`, {
      status,
    });
  },

  // Update drone location
  updateDroneLocation: (id, location) => {
    return orderClient.patch(
      `${API_GATEWAY_URL}/api/v1/drones/${id}/location`,
      location
    );
  },
};
