const express = require("express");
const reviewController = require("../controllers/reviewController");

const router = express.Router();

// Public routes
router.get("/:id", reviewController.getReview);
router.get("/order/:orderId", reviewController.getReviewByOrder);
router.get("/restaurant/:restaurantId", reviewController.getReviewsByRestaurant);
router.get("/user/:userId", reviewController.getReviewsByUser);
router.get("/stats/restaurant/:restaurantId", reviewController.getRestaurantStats);

// Protected routes (require authentication - middleware added in app.js)
router.post("/", reviewController.createReview);
router.patch("/:id", reviewController.updateReview);
router.delete("/:id", reviewController.deleteReview);

module.exports = router;
