import { orderClient } from "./axiosClients";

export const droneApi = {
  // Get all drones
  getAllDrones: async () => {
    const response = await orderClient.get("/drones");
    // Ensure response has correct structure
    if (response?.data && Array.isArray(response.data)) {
      return { data: { drones: response.data } };
    }
    return response;
  },

  // Get available drones
  getAvailableDrones: () => {
    return orderClient.get("/drones/available");
  },

  // Get drone by ID
  getDroneById: (id) => {
    return orderClient.get(`/drones/${id}`);
  },

  // Get drone by order ID
  getDroneByOrderId: async (orderId) => {
    try {
      // Use orderClient which goes through API Gateway
      // Full URL will be: http://localhost:5001/api/v1/drones/order/{orderId}
      const response = await orderClient.get(`/drones/order/${orderId}`);
      
      // orderClient's response interceptor already extracts response.data
      // So response here is the actual data object
      // Expected structure from API: { status: "success", data: { drone } }
      // But orderClient might return just the data property
      
      console.log("[droneApi.getDroneByOrderId] Raw response:", response);
      
      // Handle different response structures
      if (response?.status === "success") {
        return response;
      } else if (response?.data) {
        // If response.data exists, wrap it properly
        return {
          status: "success",
          data: response.data,
        };
      }
      
      // Default: return as is
      return response;
    } catch (error) {
      console.error("[droneApi.getDroneByOrderId] Error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      });

      // If drone not found (404), return structure compatible with component
      if (error?.response?.status === 404) {
        return {
          status: "error",
          message: "Không tìm thấy drone cho đơn hàng này",
          data: null,
        };
      }

      // Re-throw other errors
      throw error;
    }
  },

  // Create new drone
  createDrone: (data) => {
    return orderClient.post("/drones", data);
  },

  // Assign drone to order
  assignDroneToOrder: (data) => {
    return orderClient.post("/drones/assign", data);
  },

  // Update drone status
  updateDroneStatus: (id, status) => {
    return orderClient.patch(`/drones/${id}/status`, {
      status,
    });
  },

  // Update drone location
  updateDroneLocation: (id, location) => {
    return orderClient.patch(`/drones/${id}/location`, location);
  },
};
