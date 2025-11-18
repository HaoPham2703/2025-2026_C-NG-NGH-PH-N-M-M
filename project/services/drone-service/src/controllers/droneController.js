const Drone = require("../models/droneModel");
const {
  geocodeAddress,
  getOrderAddress,
  getOrderDetails,
  reverseGeocode,
  tryGetRestaurantInfo,
} = require("../utils/geocoding");

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

    const defaultLocation = {
      latitude: 10.7769,
      longitude: 106.7009,
      altitude: 50,
    };
    
    const finalLocation = currentLocation || defaultLocation;

    const drone = await Drone.create({
      droneId,
      name,
      currentLocation: finalLocation,
      // Save starting location as home location for return trips
      homeLocation: {
        latitude: finalLocation.latitude,
        longitude: finalLocation.longitude,
        address: "Depot Location",
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

    // Resolve final destination
    let finalDestination = null;

    // Case 1: Destination provided (coordinates and optional address)
    if (
      destination &&
      typeof destination.latitude === "number" &&
      typeof destination.longitude === "number"
    ) {
      // If no human-readable address is provided, reverse geocode
      if (!destination.address) {
        const rev = await reverseGeocode(
          destination.latitude,
          destination.longitude
        );
        finalDestination = rev;
      } else {
        finalDestination = {
          latitude: destination.latitude,
          longitude: destination.longitude,
          address: destination.address,
        };
      }
    }

    // Case 2: Destination not provided -> fetch order address and geocode
    if (!finalDestination) {
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

        // Geocode the address to get coordinates (address is preserved)
        finalDestination = await geocodeAddress(orderAddress);

        // Try to resolve restaurant start location from order first
        try {
          const order = await getOrderDetails(orderId, authToken);
          let startLocation = null;
          
          // Priority 1: Use restaurantAddress directly from order if available
          if (order?.restaurantAddress) {
            const geo = await geocodeAddress(order.restaurantAddress);
            startLocation = {
              latitude: geo.latitude,
              longitude: geo.longitude,
              address: order.restaurantAddress,
              restaurantId: String(order.restaurant || ''),
              restaurantName: order.restaurantName || "Nhà hàng",
            };
          }
          // Priority 2: Try to fetch from restaurant service (may fail if protected)
          else if (order?.restaurant) {
            const restaurantInfo = await tryGetRestaurantInfo(
              order.restaurant,
              authToken
            );

            if (restaurantInfo?.address) {
              // Build full address string if structured
              const addr =
                typeof restaurantInfo.address === "string"
                  ? restaurantInfo.address
                  : [
                      restaurantInfo.address?.detail,
                      restaurantInfo.address?.ward,
                      restaurantInfo.address?.district,
                      restaurantInfo.address?.city,
                    ]
                      .filter(Boolean)
                      .join(", ");
              const geo = await geocodeAddress(addr);
              startLocation = {
                latitude: geo.latitude,
                longitude: geo.longitude,
                address: addr || "Địa chỉ nhà hàng",
                restaurantId: String(order.restaurant),
                restaurantName:
                  restaurantInfo.restaurantName || restaurantInfo.name || "Nhà hàng",
              };
            }
          }

          req._startLocation = startLocation || null;
        } catch (e) {
          // Non-fatal: continue without startLocation
          req._startLocation = null;
        }
      } catch (error) {
        return res.status(400).json({
          status: "error",
          message: `Không thể lấy địa chỉ đơn hàng: ${error.message}. Vui lòng cung cấp destination với latitude và longitude trong body request.`,
        });
      }
    }

    // Validate destination has coordinates
    if (
      !finalDestination ||
      typeof finalDestination.latitude !== "number" ||
      typeof finalDestination.longitude !== "number"
    ) {
      return res.status(400).json({
        status: "error",
        message: "Destination phải có latitude và longitude",
      });
    }

    // Determine startLocation (restaurant) if not already set
    let startLocation = req._startLocation || null;
    if (!startLocation) {
      try {
        const authToken = req.headers.authorization?.replace("Bearer ", "") || null;
        const order = await getOrderDetails(orderId, authToken);
        
        // Try restaurantAddress from order first
        if (order?.restaurantAddress) {
          const geo = await geocodeAddress(order.restaurantAddress);
          startLocation = {
            latitude: geo.latitude,
            longitude: geo.longitude,
            address: order.restaurantAddress,
            restaurantId: String(order.restaurant || ''),
            restaurantName: order.restaurantName || "Nhà hàng",
          };
        }
        // Last resort: generate pseudo address from restaurantId
        else if (order?.restaurant) {
          const pseudoAddr = `Restaurant ${String(order.restaurant).slice(-6)}`;
          const geo = await geocodeAddress(pseudoAddr);
          startLocation = {
            latitude: geo.latitude,
            longitude: geo.longitude,
            address: pseudoAddr,
            restaurantId: String(order.restaurant),
            restaurantName: order.restaurantName || "Nhà hàng",
          };
        }
      } catch (_) {
        // ignore fallback failure
      }
    }

    // Calculate estimated arrival time from current position to destination
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

    // If drone doesn't have a home location, set it to current location
    if (!drone.homeLocation || !drone.homeLocation.latitude) {
      drone.homeLocation = {
        latitude: drone.currentLocation.latitude,
        longitude: drone.currentLocation.longitude,
        address: "Depot Location",
      };
    }

    // Update drone
    drone.orderId = orderId;
    drone.status = "flying";
    if (startLocation) {
      drone.startLocation = startLocation;
    } else {
      drone.startLocation = undefined;
    }

    // Save final delivery destination
    drone.deliveryDestination = {
      latitude: finalDestination.latitude,
      longitude: finalDestination.longitude,
      address: finalDestination.address || "Địa chỉ giao hàng",
    };

    // First leg: go to restaurant if present; else go directly to delivery
    if (startLocation) {
      drone.destination = {
        latitude: startLocation.latitude,
        longitude: startLocation.longitude,
        address: startLocation.address || "Nhà hàng",
      };
    } else {
      drone.destination = { ...drone.deliveryDestination };
    }

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
