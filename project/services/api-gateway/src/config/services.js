// Service URLs configuration - FIXED ENDPOINTS (no auto-switching)
const services = {
  user: process.env.USER_SERVICE_URL || "http://localhost:4001",
  product: process.env.PRODUCT_SERVICE_URL || "http://localhost:4002",
  order: process.env.ORDER_SERVICE_URL || "http://localhost:4003",
  payment: process.env.PAYMENT_SERVICE_URL || "http://localhost:4004",
  restaurant: process.env.RESTAURANT_SERVICE_URL || "http://localhost:4006",
  drone: process.env.DRONE_SERVICE_URL || "http://localhost:4007",
};

// Service health check endpoints
const healthEndpoints = {
  user: `${services.user}/health`,
  product: `${services.product}/health`,
  order: `${services.order}/health`,
  payment: `${services.payment}/health`,
  restaurant: `${services.restaurant}/health`,
  drone: `${services.drone}/health`,
};

// Service routing configuration
const serviceRoutes = {
  "/api/v1/auth": services.user,
  "/api/v1/users": services.user,
  "/api/v1/products": services.product,
  "/api/v1/categories": services.product,
  "/api/v1/brands": services.product,
  "/api/v1/orders": services.order,
  "/api/v1/payments": services.payment,
  "/api/v1/transactions": services.payment,
  "/api/restaurant": services.restaurant,
  "/api/v1/drones": services.drone,
};

module.exports = {
  services,
  healthEndpoints,
  serviceRoutes,
};
