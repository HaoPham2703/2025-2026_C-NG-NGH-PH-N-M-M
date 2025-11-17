const express = require("express");
const restaurantController = require("../controllers/restaurantController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// All routes are protected
router.use(protect);

router
  .route("/profile")
  .get(restaurantController.getProfile)
  .put(restaurantController.updateProfile);

router.put("/business-hours", restaurantController.updateBusinessHours);
router.put(
  "/notification-settings",
  restaurantController.updateNotificationSettings
);
router.get("/stats", restaurantController.getStats);
router.get("/orders", restaurantController.getOrders);

// Rating update endpoint (called by product-service)
router.patch("/:id/ratings", restaurantController.updateRatings);

module.exports = router;
