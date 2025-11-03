const express = require("express");
const { proxies } = require("../middleware/proxy");
const {
  verifyToken,
  verifyRestaurantToken,
  optionalAuth,
  requireAdmin,
} = require("../middleware/auth");

const router = express.Router();

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    status: "success",
    message: "API Gateway is running",
    timestamp: new Date().toISOString(),
    services: {
      user: process.env.USER_SERVICE_URL || "http://localhost:4001",
      product: process.env.PRODUCT_SERVICE_URL || "http://localhost:4002",
      order: process.env.ORDER_SERVICE_URL || "http://localhost:4003",
      payment: process.env.PAYMENT_SERVICE_URL || "http://localhost:4004",
      restaurant: process.env.RESTAURANT_SERVICE_URL || "http://localhost:4006",
      drone: process.env.DRONE_SERVICE_URL || "http://localhost:4007",
    },
  });
});

// Fixed service endpoints - no automatic switching
// Authentication routes (no auth required) - route to /api/v1 in user service
router.use("/api/v1/auth", proxies.userProxy);

// User routes (require authentication) - FIXED to user service
router.use("/api/v1/users", verifyToken, proxies.userProxy);

// Product routes (optional authentication for public access) - FIXED to product service
router.use("/api/v1/products", optionalAuth, proxies.productProxy);
router.use("/api/v1/categories", optionalAuth, proxies.productProxy);
router.use("/api/v1/brands", optionalAuth, proxies.productProxy);

// Order routes (require authentication) - FIXED to order service
router.use("/api/v1/orders", verifyToken, proxies.orderProxy);

// Payment routes (require authentication) - FIXED to payment service
router.use("/api/v1/payments", verifyToken, proxies.paymentProxy);
router.use("/api/v1/transactions", verifyToken, proxies.paymentProxy);

// Restaurant routes - public auth routes and protected routes
router.use("/api/restaurant/signup", proxies.restaurantProxy);
router.use("/api/restaurant/login", proxies.restaurantProxy);
router.use("/api/restaurant", verifyRestaurantToken, proxies.restaurantProxy);

// Drone routes (require authentication) - FIXED to drone service
router.use("/api/v1/drones", verifyToken, proxies.droneProxy);

// Admin routes (require admin role) - FIXED to respective services
router.use("/api/v1/admin/users", verifyToken, requireAdmin, proxies.userProxy);
router.use(
  "/api/v1/admin/products",
  verifyToken,
  requireAdmin,
  proxies.productProxy
);
router.use(
  "/api/v1/admin/orders",
  verifyToken,
  requireAdmin,
  proxies.orderProxy
);
router.use(
  "/api/v1/admin/payments",
  verifyToken,
  requireAdmin,
  proxies.paymentProxy
);

// Catch all for undefined routes
router.all("*", (req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      "/api/v1/auth/*",
      "/api/v1/users/*",
      "/api/v1/products/*",
      "/api/v1/orders/*",
      "/api/v1/payments/*",
      "/api/v1/drones/*",
      "/api/restaurant/*",
      "/health",
    ],
  });
});

module.exports = router;
