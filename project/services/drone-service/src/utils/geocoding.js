const axios = require("axios");

/**
 * Geocode an address string to latitude/longitude coordinates
 * For demo purposes, this simulates geocoding for Ho Chi Minh City addresses
 * In production, you would use a real geocoding API like Google Maps, OpenStreetMap Nominatim, etc.
 */
async function geocodeAddress(address) {
  try {
    // Option 1: Use OpenStreetMap Nominatim API (free, no API key required)
    // This is a demo implementation - rate limits apply
    const encodedAddress = encodeURIComponent(
      address + ", Ho Chi Minh City, Vietnam"
    );
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
      {
        headers: {
          "User-Agent": "FastFood-Drone-Service/1.0", // Required by Nominatim
        },
        timeout: 5000,
      }
    );

    if (response.data && response.data.length > 0) {
      return {
        latitude: parseFloat(response.data[0].lat),
        longitude: parseFloat(response.data[0].lon),
        address: address,
      };
    }

    // Fallback: Return simulated coordinates for Ho Chi Minh City
    // This generates coordinates within HCM City bounds as a fallback
    return generateSimulatedCoordinates(address);
  } catch (error) {
    console.error(
      "Geocoding error, using simulated coordinates:",
      error.message
    );
    // Fallback to simulated coordinates if API fails
    return generateSimulatedCoordinates(address);
  }
}

/**
 * Generate simulated coordinates within Ho Chi Minh City bounds
 * This is used as a fallback when real geocoding fails
 */
function generateSimulatedCoordinates(address) {
  // Ho Chi Minh City approximate bounds:
  // Latitude: 10.6 to 11.0
  // Longitude: 106.4 to 106.9

  // Generate semi-random coordinates based on address hash
  const addressHash = hashString(address);

  // Use hash to generate consistent but varied coordinates within HCM
  const latBase = 10.7769; // City center
  const lonBase = 106.7009;

  // Add some variation based on address hash
  const latVariation = ((addressHash % 400) - 200) / 10000; // ±0.02 degrees
  const lonVariation = ((addressHash % 400) - 200) / 10000;

  const latitude = latBase + latVariation;
  const longitude = lonBase + lonVariation;

  return {
    latitude: parseFloat(latitude.toFixed(6)),
    longitude: parseFloat(longitude.toFixed(6)),
    address: address,
  };
}

/**
 * Simple hash function for string to number
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get order details from order service and extract address
 * Note: This requires authentication token if order service requires it
 */
async function getOrderAddress(orderId, authToken = null) {
  try {
    // Try API Gateway first, then direct to order service
    const apiGatewayUrl =
      process.env.API_GATEWAY_URL || "http://localhost:5001";
    const orderServiceUrl =
      process.env.ORDER_SERVICE_URL || "http://localhost:4003";

    const headers = {};
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    // Try API Gateway first
    try {
      const response = await axios.get(
        `${apiGatewayUrl}/api/v1/orders/${orderId}`,
        {
          headers,
          timeout: 5000,
        }
      );

      if (
        response.data &&
        response.data.status === "success" &&
        response.data.data?.order
      ) {
        return response.data.data.order.address;
      }
    } catch (gatewayError) {
      console.log("API Gateway failed, trying direct connection...");
    }

    // Fallback to direct order service (may not work if auth is required)
    const response = await axios.get(
      `${orderServiceUrl}/api/v1/orders/${orderId}`,
      {
        headers,
        timeout: 5000,
      }
    );

    if (
      response.data &&
      response.data.status === "success" &&
      response.data.data?.order
    ) {
      return response.data.data.order.address;
    }

    throw new Error("Order not found or invalid response");
  } catch (error) {
    console.error("Error fetching order:", error.message);
    if (error.response) {
      throw new Error(
        `Không thể lấy thông tin đơn hàng: ${
          error.response.data?.message || error.message
        }`
      );
    }
    throw new Error(`Không thể lấy thông tin đơn hàng: ${error.message}`);
  }
}

module.exports = {
  geocodeAddress,
  generateSimulatedCoordinates,
  getOrderAddress,
};
