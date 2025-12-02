const Drone = require("../models/droneModel");
const { updateOrderStatusToSuccess } = require("../utils/geocoding");

class DroneSimulation {
  constructor(io) {
    this.io = io;
    this._simulations = new Map(); // Map<droneId, intervalId>
    this.updateInterval = 3000; // Update every 3 seconds (slower updates = slower battery drain)
  }

  // Getter for simulations map
  get simulations() {
    return this._simulations;
  }

  // Calculate distance between two coordinates (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Simulate drone movement towards destination
  async simulateDroneMovement(droneId) {
    const drone = await Drone.findOne({ droneId });
    if (!drone) {
      this.stopSimulation(droneId);
      return;
    }

    // Handle battery charging for available drones at home
    if (drone.status === "available" && drone.batteryLevel < 100) {
      // Slow recharge: 2% per update (every 3 seconds) = 40% per minute = fast charge
      // This simulates charging at depot
      drone.batteryLevel = Math.min(100, drone.batteryLevel + 2);
      await drone.save();

      // Emit update for battery charging (only if changed significantly)
      if (drone.batteryLevel >= 100 || drone.batteryLevel % 5 === 0) {
        this.io.emit("drone:update", {
          droneId: drone.droneId,
          location: drone.currentLocation,
          status: drone.status,
          batteryLevel: drone.batteryLevel,
          orderId: drone.orderId,
        });
      }

      // Continue simulation loop for charging (don't stop)
      return;
    }

    // Only simulate movement if drone is flying, delivering, or returning
    if (
      drone.status !== "flying" &&
      drone.status !== "delivering" &&
      drone.status !== "returning"
    ) {
      this.stopSimulation(droneId);
      return;
    }

    // If no destination, stop simulation
    if (
      !drone.destination ||
      !drone.destination.latitude ||
      !drone.destination.longitude
    ) {
      this.stopSimulation(droneId);
      return;
    }

    const currentLat = drone.currentLocation.latitude;
    const currentLon = drone.currentLocation.longitude;
    const destLat = drone.destination.latitude;
    const destLon = drone.destination.longitude;

    // Calculate distance to destination
    const distance = this.calculateDistance(
      currentLat,
      currentLon,
      destLat,
      destLon
    );

    // If very close to destination (within 100m), mark as arrived
    // Increased threshold for faster simulation
    if (distance < 0.1) {
      await this.handleArrival(drone);
      return;
    }

    // Calculate movement per update (speed in km/h, updateInterval in ms)
    // Multiply speed by 10x for faster simulation (since this is just a demo)
    const speedMultiplier = 10; // Make drones move 10x faster
    const hoursElapsed = this.updateInterval / (1000 * 60 * 60);
    const distancePerUpdate = drone.speed * speedMultiplier * hoursElapsed; // km

    // Calculate bearing (direction)
    const bearing = this.calculateBearing(
      currentLat,
      currentLon,
      destLat,
      destLon
    );

    // Calculate new position
    const newPosition = this.movePosition(
      currentLat,
      currentLon,
      distancePerUpdate,
      bearing
    );

    // Update drone location
    drone.currentLocation.latitude = newPosition.latitude;
    drone.currentLocation.longitude = newPosition.longitude;
    drone.currentLocation.updatedAt = new Date();

    // Add to flight history (keep last 100 points)
    drone.flightHistory.push({
      latitude: newPosition.latitude,
      longitude: newPosition.longitude,
      altitude: drone.currentLocation.altitude,
      timestamp: new Date(),
    });

    if (drone.flightHistory.length > 100) {
      drone.flightHistory.shift();
    }

    // Decrease battery slightly (0.015% per update when flying)
    // Update interval is 3 seconds, so this equals:
    // 0.015% per 3 seconds = 0.005% per second = 0.3% per minute = 18% per hour
    // A 20-minute delivery would consume ~6% battery (realistic for drone delivery)
    drone.batteryLevel = Math.max(0, drone.batteryLevel - 0.015);

    await drone.save();

    // Emit real-time update via WebSocket
    this.io.emit("drone:update", {
      droneId: drone.droneId,
      location: drone.currentLocation,
      status: drone.status,
      batteryLevel: drone.batteryLevel,
      distanceToDestination: distance,
      orderId: drone.orderId,
    });

    // Also emit to order-specific room if orderId exists
    if (drone.orderId) {
      this.io.to(`order:${drone.orderId}`).emit("drone:update", {
        droneId: drone.droneId,
        location: drone.currentLocation,
        status: drone.status,
        batteryLevel: drone.batteryLevel,
        distanceToDestination: distance,
        orderId: drone.orderId,
      });
    }
  }

  calculateBearing(lat1, lon1, lat2, lon2) {
    const dLon = this.toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(this.toRad(lat2));
    const x =
      Math.cos(this.toRad(lat1)) * Math.sin(this.toRad(lat2)) -
      Math.sin(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.cos(dLon);
    return Math.atan2(y, x);
  }

  movePosition(lat, lon, distance, bearing) {
    const R = 6371; // Earth's radius in km
    const newLat = Math.asin(
      Math.sin(this.toRad(lat)) * Math.cos(distance / R) +
        Math.cos(this.toRad(lat)) * Math.sin(distance / R) * Math.cos(bearing)
    );
    const newLon =
      this.toRad(lon) +
      Math.atan2(
        Math.sin(bearing) * Math.sin(distance / R) * Math.cos(this.toRad(lat)),
        Math.cos(distance / R) - Math.sin(this.toRad(lat)) * Math.sin(newLat)
      );
    return {
      latitude: this.toRadToDeg(newLat),
      longitude: this.toRadToDeg(newLon),
    };
  }

  toRadToDeg(radians) {
    return radians * (180 / Math.PI);
  }

  async handleArrival(drone) {
    // Snap to reached destination
    drone.currentLocation.latitude = drone.destination.latitude;
    drone.currentLocation.longitude = drone.destination.longitude;

    // If reached restaurant first, switch to delivery leg
    const atRestaurant =
      drone.startLocation &&
      typeof drone.startLocation.latitude === "number" &&
      typeof drone.startLocation.longitude === "number" &&
      Math.abs(drone.destination.latitude - drone.startLocation.latitude) <
        1e-6 &&
      Math.abs(drone.destination.longitude - drone.startLocation.longitude) <
        1e-6;

    if (
      drone.status === "flying" &&
      atRestaurant &&
      drone.deliveryDestination
    ) {
      drone.destination = {
        latitude: drone.deliveryDestination.latitude,
        longitude: drone.deliveryDestination.longitude,
        address: drone.deliveryDestination.address || "Địa chỉ giao hàng",
      };
      await drone.save();

      this.io.emit("drone:status", {
        droneId: drone.droneId,
        status: "flying",
        orderId: drone.orderId,
        leg: "to-destination",
      });
      return; // continue flying to final destination
    }

    if (drone.status === "flying" || drone.status === "delivering") {
      // Arrived at final destination: deliver then return
      drone.status = "delivering";

      // Simulate delivery time (5 seconds for faster demo)
      setTimeout(async () => {
        const updatedDrone = await Drone.findOne({ droneId: drone.droneId });
        if (updatedDrone && updatedDrone.status === "delivering") {
          updatedDrone.status = "returning";

          // Set return destination to drone's home location (where it started)
          const homeLocation = updatedDrone.homeLocation || {
            latitude: 10.7769,
            longitude: 106.7009,
            address: "Depot Location",
          };

          updatedDrone.destination = {
            latitude: homeLocation.latitude,
            longitude: homeLocation.longitude,
            address: homeLocation.address || "Depot Location",
          };

          await updatedDrone.save();

          // Cập nhật trạng thái đơn hàng thành "Success" khi drone hoàn thành giao hàng
          if (updatedDrone.orderId) {
            try {
              const result = await updateOrderStatusToSuccess(
                updatedDrone.orderId
              );
              if (result.success) {
                console.log(
                  `[DroneSimulation] ✅ Order ${updatedDrone.orderId} status updated to Success after delivery completion`
                );
              } else {
                console.error(
                  `[DroneSimulation] ❌ Failed to update order ${updatedDrone.orderId} status: ${result.error}`
                );
              }
            } catch (error) {
              console.error(
                `[DroneSimulation] ❌ Error updating order status for ${updatedDrone.orderId}:`,
                error.message
              );
              // Không throw error để không ảnh hưởng đến flow của drone
            }
          }

          // Start simulation for returning trip
          this.startSimulation(updatedDrone.droneId);

          this.io.emit("drone:status", {
            droneId: updatedDrone.droneId,
            status: "returning",
            orderId: updatedDrone.orderId,
          });

          console.log(
            `[DroneSimulation] Drone ${updatedDrone.droneId} starting return trip to home location (${homeLocation.latitude}, ${homeLocation.longitude})`
          );
        }
      }, 5000); // Reduced to 5 seconds for faster demo
    } else if (drone.status === "returning") {
      // Drone returned to home location (depot)
      const homeLocation = drone.homeLocation || {
        latitude: 10.7769,
        longitude: 106.7009,
      };

      drone.status = "available";
      drone.orderId = null;
      drone.destination = null;
      drone.deliveryDestination = undefined;
      drone.startLocation = undefined;
      drone.assignedAt = null;
      drone.estimatedArrival = null;

      // Reset to home location (where drone started)
      drone.currentLocation.latitude = homeLocation.latitude;
      drone.currentLocation.longitude = homeLocation.longitude;

      // Recharge battery when returning home (charge to 100%)
      drone.batteryLevel = 100;

      await drone.save();

      this.io.emit("drone:status", {
        droneId: drone.droneId,
        status: "available",
        orderId: null,
      });

      this.stopSimulation(drone.droneId);

      console.log(
        `[DroneSimulation] Drone ${drone.droneId} returned home and is now available at (${homeLocation.latitude}, ${homeLocation.longitude})`
      );
    }

    await drone.save();
  }

  startSimulation(droneId) {
    // Stop existing simulation if any
    this.stopSimulation(droneId);

    // Start new simulation
    const intervalId = setInterval(() => {
      this.simulateDroneMovement(droneId);
    }, this.updateInterval);

    this._simulations.set(droneId, intervalId);
  }

  stopSimulation(droneId) {
    const intervalId = this._simulations.get(droneId);
    if (intervalId) {
      clearInterval(intervalId);
      this._simulations.delete(droneId);
    }
  }

  // Initialize simulations for all active drones and available drones (for charging)
  async initializeSimulations() {
    const activeDrones = await Drone.find({
      status: { $in: ["flying", "delivering", "returning", "available"] },
    });

    for (const drone of activeDrones) {
      this.startSimulation(drone.droneId);
    }
  }

  // Start simulation for a specific drone (called when drone is assigned)
  // Also start for available drones to enable battery charging
  async startDroneSimulation(droneId) {
    const drone = await Drone.findOne({ droneId });
    if (
      drone &&
      (drone.status === "flying" ||
        drone.status === "delivering" ||
        drone.status === "returning" ||
        (drone.status === "available" && drone.batteryLevel < 100))
    ) {
      this.startSimulation(droneId);
    }
  }
}

module.exports = DroneSimulation;
