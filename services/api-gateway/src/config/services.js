// Service URLs configuration
const services = {
  user: process.env.USER_SERVICE_URL || "http://localhost:3001",
  product: process.env.PRODUCT_SERVICE_URL || "http://localhost:3002",
  order: process.env.ORDER_SERVICE_URL || "http://localhost:3003",
  payment: process.env.PAYMENT_SERVICE_URL || "http://localhost:3004",
};

// Service health check endpoints
const healthEndpoints = {
  user: `${services.user}/health`,
  product: `${services.product}/health`,
  order: `${services.order}/health`,
  payment: `${services.payment}/health`,
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
};

module.exports = {
  services,
  healthEndpoints,
  serviceRoutes,
};
