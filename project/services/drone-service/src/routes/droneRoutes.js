const express = require("express");
const droneController = require("../controllers/droneController");

const router = express.Router();

// Get all drones
router.get("/", droneController.getAllDrones);

// Get available drones
router.get("/available", droneController.getAvailableDrones);

// Get drone by ID
router.get("/:id", droneController.getDroneById);

// Get drone by order ID
router.get("/order/:orderId", droneController.getDroneByOrderId);

// Create new drone
router.post("/", droneController.createDrone);

// Assign drone to order
router.post("/assign", droneController.assignDroneToOrder);

// Update drone status
router.patch("/:id/status", droneController.updateDroneStatus);

// Update drone location
router.patch("/:id/location", droneController.updateDroneLocation);

module.exports = router;
