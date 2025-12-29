const express = require("express");
const adminController = require("../controllers/adminController");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// All admin routes require admin authentication
router.use(requireAdmin);

// Restaurant CRUD operations
router
  .route("/restaurants")
  .get(adminController.getAllRestaurants)
  .post(adminController.createRestaurant);

router
  .route("/restaurants/stats")
  .get(adminController.getRestaurantStats);

router
  .route("/restaurants/:id")
  .get(adminController.getRestaurant)
  .put(adminController.updateRestaurant)
  .delete(adminController.deleteRestaurant);

router
  .route("/restaurants/:id/status")
  .patch(adminController.updateRestaurantStatus);

router
  .route("/restaurants/:id/verify")
  .patch(adminController.verifyRestaurant);

module.exports = router;
