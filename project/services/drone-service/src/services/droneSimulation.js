const Drone = require("../models/droneModel");

class DroneSimulation {
  constructor(io) {
    this.io = io;
    this._simulations = new Map(); // Map<droneId, intervalId>
    this.updateInterval = 2000; // Update every 2 seconds
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

    // Only simulate if drone is flying or delivering
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

    // If very close to destination (within 50m), mark as arrived
    if (distance < 0.05) {
      await this.handleArrival(drone);
      return;
    }

    // Calculate movement per update (speed in km/h, updateInterval in ms)
    const hoursElapsed = this.updateInterval / (1000 * 60 * 60);
    const distancePerUpdate = drone.speed * hoursElapsed; // km

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

    // Decrease battery slightly (0.1% per update when flying)
    drone.batteryLevel = Math.max(0, drone.batteryLevel - 0.1);

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
    if (drone.status === "flying" || drone.status === "delivering") {
      // Drone arrived at destination
      drone.status = "delivering";
      drone.currentLocation.latitude = drone.destination.latitude;
      drone.currentLocation.longitude = drone.destination.longitude;

      // Simulate delivery time (30 seconds)
      setTimeout(async () => {
        const updatedDrone = await Drone.findOne({ droneId: drone.droneId });
        if (updatedDrone && updatedDrone.status === "delivering") {
          updatedDrone.status = "returning";
          // Set return destination (to a depot/restaurant location)
          updatedDrone.destination = {
            latitude: 10.7769, // Default depot location
            longitude: 106.7009,
            address: "Depot Location",
          };
          await updatedDrone.save();

          this.io.emit("drone:status", {
            droneId: updatedDrone.droneId,
            status: "returning",
            orderId: updatedDrone.orderId,
          });
        }
      }, 30000);
    } else if (drone.status === "returning") {
      // Drone returned to depot
      drone.status = "available";
      drone.orderId = null;
      drone.destination = null;
      drone.assignedAt = null;
      drone.estimatedArrival = null;
      // Reset to depot location
      drone.currentLocation.latitude = 10.7769;
      drone.currentLocation.longitude = 106.7009;

      this.io.emit("drone:status", {
        droneId: drone.droneId,
        status: "available",
        orderId: null,
      });

      this.stopSimulation(drone.droneId);
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

  // Initialize simulations for all active drones
  async initializeSimulations() {
    const activeDrones = await Drone.find({
      status: { $in: ["flying", "delivering", "returning"] },
    });

    for (const drone of activeDrones) {
      this.startSimulation(drone.droneId);
    }
  }

  // Start simulation for a specific drone (called when drone is assigned)
  async startDroneSimulation(droneId) {
    const drone = await Drone.findOne({ droneId });
    if (
      drone &&
      (drone.status === "flying" ||
        drone.status === "delivering" ||
        drone.status === "returning")
    ) {
      this.startSimulation(droneId);
    }
  }
}

module.exports = DroneSimulation;
