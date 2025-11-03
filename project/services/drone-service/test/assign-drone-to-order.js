const axios = require("axios");
require("dotenv").config();

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:5001";
const DRONE_ID = process.env.DRONE_ID || "DRONE_001";

// Get orderId from command line argument
const orderId = process.argv[2];

if (!orderId) {
  console.error("❌ Usage: node assign-drone-to-order.js <orderId>");
  console.error(
    "   Example: node assign-drone-to-order.js 507f1f77bcf86cd799439011"
  );
  process.exit(1);
}

// You can provide token as environment variable or it will try without auth
const token = process.env.TOKEN || null;

const assignDrone = async () => {
  try {
    console.log(`🚁 Assigning drone ${DRONE_ID} to order ${orderId}...`);

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.post(
      `${API_GATEWAY_URL}/api/v1/drones/assign`,
      {
        droneId: DRONE_ID,
        orderId: orderId,
      },
      { headers }
    );

    if (response.data.status === "success") {
      console.log("✅ Drone assigned successfully!");
      console.log("\n📋 Drone Info:");
      console.log(`   Name: ${response.data.data.drone.name}`);
      console.log(`   Status: ${response.data.data.drone.status}`);
      console.log(
        `   Current Location: ${response.data.data.drone.currentLocation.latitude}, ${response.data.data.drone.currentLocation.longitude}`
      );
      if (response.data.data.drone.destination) {
        console.log(
          `   Destination: ${response.data.data.drone.destination.latitude}, ${response.data.data.drone.destination.longitude}`
        );
        console.log(
          `   Address: ${response.data.data.drone.destination.address || "N/A"}`
        );
      }
      console.log(
        `   Estimated Arrival: ${new Date(
          response.data.data.drone.estimatedArrival
        ).toLocaleString("vi-VN")}`
      );
      console.log("\n🌐 View tracking at:");
      console.log(`   http://localhost:5173/drone-tracking/${orderId}`);
    } else {
      console.error("❌ Failed to assign drone:", response.data.message);
    }
  } catch (error) {
    if (error.response) {
      console.error(
        "❌ Error:",
        error.response.data.message || error.response.data.error
      );
      console.error("   Status:", error.response.status);
    } else {
      console.error("❌ Error:", error.message);
    }
    process.exit(1);
  }
};

assignDrone();
