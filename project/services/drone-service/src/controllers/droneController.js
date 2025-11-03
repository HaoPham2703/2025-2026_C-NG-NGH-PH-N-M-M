const Drone = require("../models/droneModel");
const { geocodeAddress, getOrderAddress } = require("../utils/geocoding");

// Get all drones
exports.getAllDrones = async (req, res) => {
  try {
    const drones = await Drone.find().sort({ createdAt: -1 });
    res.json({
      status: "success",
      results: drones.length,
      data: drones,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get drone by ID
exports.getDroneById = async (req, res) => {
  try {
    const drone = await Drone.findOne({ droneId: req.params.id });
    if (!drone) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy drone",
      });
    }
    res.json({
      status: "success",
      data: drone,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get drone by order ID
exports.getDroneByOrderId = async (req, res) => {
  try {
    const drone = await Drone.findOne({ orderId: req.params.orderId });
    if (!drone) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy drone cho đơn hàng này",
      });
    }
    res.json({
      status: "success",
      data: drone,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Create new drone
exports.createDrone = async (req, res) => {
  try {
    const { droneId, name, currentLocation } = req.body;

    // Check if drone with same ID exists
    const existingDrone = await Drone.findOne({ droneId });
    if (existingDrone) {
      return res.status(400).json({
        status: "error",
        message: "Drone với ID này đã tồn tại",
      });
    }

    const drone = await Drone.create({
      droneId,
      name,
      currentLocation: currentLocation || {
        latitude: 10.7769,
        longitude: 106.7009,
        altitude: 50,
      },
    });

    res.status(201).json({
      status: "success",
      data: drone,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Assign drone to order
exports.assignDroneToOrder = async (req, res) => {
  try {
    const { droneId, orderId, destination } = req.body;

    if (!droneId || !orderId) {
      return res.status(400).json({
        status: "error",
        message: "Cần có droneId và orderId",
      });
    }

    const drone = await Drone.findOne({ droneId });
    if (!drone) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy drone",
      });
    }

    if (drone.status !== "available") {
      return res.status(400).json({
        status: "error",
        message: `Drone đang ở trạng thái: ${drone.status}`,
      });
    }

    // If destination is not provided, fetch from order and geocode
    let finalDestination = destination;
    if (
      !finalDestination ||
      !finalDestination.latitude ||
      !finalDestination.longitude
    ) {
      try {
        // Get auth token from request if available
        const authToken =
          req.headers.authorization?.replace("Bearer ", "") || null;

        // Fetch order address from order service
        const orderAddress = await getOrderAddress(orderId, authToken);

        if (!orderAddress) {
          return res.status(400).json({
            status: "error",
            message:
              "Đơn hàng không có địa chỉ. Vui lòng cung cấp destination với latitude và longitude.",
          });
        }

        // Geocode the address to get coordinates
        finalDestination = await geocodeAddress(orderAddress);
      } catch (error) {
        return res.status(400).json({
          status: "error",
          message: `Không thể lấy địa chỉ đơn hàng: ${error.message}. Vui lòng cung cấp destination với latitude và longitude trong body request.`,
        });
      }
    }

    // Validate destination has coordinates
    if (!finalDestination.latitude || !finalDestination.longitude) {
      return res.status(400).json({
        status: "error",
        message: "Destination phải có latitude và longitude",
      });
    }

    // Calculate estimated arrival time
    const distance = calculateDistance(
      drone.currentLocation.latitude,
      drone.currentLocation.longitude,
      finalDestination.latitude,
      finalDestination.longitude
    );
    const estimatedMinutes = (distance / drone.speed) * 60; // Convert to minutes
    const estimatedArrival = new Date(
      Date.now() + estimatedMinutes * 60 * 1000
    );

    // Update drone
    drone.orderId = orderId;
    drone.status = "flying";
    drone.destination = {
      latitude: finalDestination.latitude,
      longitude: finalDestination.longitude,
      address: finalDestination.address || "Địa chỉ giao hàng",
    };
    drone.assignedAt = new Date();
    drone.estimatedArrival = estimatedArrival;

    await drone.save();

    // Trigger simulation start (this will be handled by the simulation service)
    // The simulation service will detect the status change and start tracking

    res.json({
      status: "success",
      message: "Đã gán drone cho đơn hàng",
      data: drone,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get available drones
exports.getAvailableDrones = async (req, res) => {
  try {
    const drones = await Drone.find({ status: "available" }).sort({
      createdAt: -1,
    });
    res.json({
      status: "success",
      results: drones.length,
      data: drones,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Update drone status
exports.updateDroneStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const drone = await Drone.findOne({ droneId: req.params.id });

    if (!drone) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy drone",
      });
    }

    drone.status = status;
    await drone.save();

    res.json({
      status: "success",
      data: drone,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Update drone location manually
exports.updateDroneLocation = async (req, res) => {
  try {
    const { latitude, longitude, altitude } = req.body;
    const drone = await Drone.findOne({ droneId: req.params.id });

    if (!drone) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy drone",
      });
    }

    drone.currentLocation.latitude = latitude;
    drone.currentLocation.longitude = longitude;
    if (altitude !== undefined) {
      drone.currentLocation.altitude = altitude;
    }
    drone.currentLocation.updatedAt = new Date();

    await drone.save();

    res.json({
      status: "success",
      data: drone,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Helper function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}
