const express = require("express");
const restaurantController = require("../controllers/restaurantController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Public route - Get restaurant info for shipping calculation (no auth required)
router.get("/:id/public", restaurantController.getPublicRestaurantInfo);

// All other routes are protected
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
router.get("/analytics", restaurantController.getAnalytics);

module.exports = router;
