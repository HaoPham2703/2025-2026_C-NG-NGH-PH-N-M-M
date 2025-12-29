const express = require("express");
const droneController = require("../controllers/droneController");

const router = express.Router();

// Get all drones
router.get("/", droneController.getAllDrones);

// Get available drones
router.get("/available", droneController.getAvailableDrones);

// Get drone by order ID - MUST be before /:id to avoid route conflict
router.get("/order/:orderId", droneController.getDroneByOrderId);

// Get drone by ID - MUST be last to avoid matching /order/:orderId
router.get("/:id", droneController.getDroneById);

// Create new drone
router.post("/", droneController.createDrone);

// Assign drone to order
router.post("/assign", droneController.assignDroneToOrder);

// Update drone status
router.patch("/:id/status", droneController.updateDroneStatus);

// Update drone location
router.patch("/:id/location", droneController.updateDroneLocation);

module.exports = router;
