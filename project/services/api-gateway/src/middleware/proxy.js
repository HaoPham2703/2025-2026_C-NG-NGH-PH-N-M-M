const { createProxyMiddleware } = require("http-proxy-middleware");
const { serviceRoutes } = require("../config/services");

// Create proxy middleware for each service - FIXED TARGETS (no auto-switching)
const createServiceProxy = (target, pathRewrite = {}) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true, // Enable origin change for proper proxying
    pathRewrite,
    timeout: 30000, // Fixed timeout
    proxyTimeout: 30000,
    onError: (err, req, res) => {
      console.error(`Proxy error for ${req.url}:`, err.message);
      res.status(503).json({
        status: "error",
        message: "Service temporarily unavailable",
        service: target,
      });
    },
    onProxyReq: (proxyReq, req, res) => {
      // Add correlation ID for tracing
      const correlationId =
        req.headers["x-correlation-id"] ||
        `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      proxyReq.setHeader("x-correlation-id", correlationId);
      proxyReq.setHeader("x-forwarded-for", req.ip);
      proxyReq.setHeader("x-user-agent", req.get("User-Agent"));

      // Forward user information if available (Base64 encoded to avoid header issues)
      if (req.user) {
        const userJson = JSON.stringify(req.user);
        const userBase64 = Buffer.from(userJson).toString("base64");
        proxyReq.setHeader("x-user", userBase64);
      }

      // Fix body forwarding - re-stream the parsed body
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader("Content-Type", "application/json");
        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }

      console.log(
        `[${correlationId}] FIXED Proxying ${req.method} ${req.url} to ${target}`
      );
    },
    onProxyRes: (proxyRes, req, res) => {
      const correlationId = req.headers["x-correlation-id"];
      console.log(
        `[${correlationId}] FIXED Response ${proxyRes.statusCode} from ${target}`
      );
    },
  });
};

// Specific proxy configurations - FIXED TARGETS (no auto-switching)
const proxies = {
  // User service proxy - FIXED to user service with path rewrite for auth
  userProxy: createServiceProxy(serviceRoutes["/api/v1/users"], {
    "^/api/v1/auth": "/", // Rewrite /api/v1/auth/signup to /signup
    "^/api/v1/users": "/", // Rewrite /api/v1/users/me to /me
  }),

  // Product service proxy - FIXED to product service
  productProxy: createServiceProxy(serviceRoutes["/api/v1/products"]),

  // Order service proxy - FIXED to order service
  orderProxy: createServiceProxy(serviceRoutes["/api/v1/orders"]),

  // Payment service proxy - FIXED to payment service
  paymentProxy: createServiceProxy(serviceRoutes["/api/v1/payments"]),

  // Restaurant service proxy - FIXED to restaurant service with path rewrite
  restaurantProxy: createServiceProxy(serviceRoutes["/api/restaurant"], {
    "^/api/restaurant": "/api/v1/restaurant", // Rewrite /api/restaurant/signup to /api/v1/restaurant/signup
  }),

  // Drone service proxy - FIXED to drone service
  droneProxy: createServiceProxy(serviceRoutes["/api/v1/drones"]),
};

// Health check proxy - FIXED to user service port
const healthCheckProxy = createServiceProxy("http://localhost:4001", {
  "^/health": "/health",
});

module.exports = {
  proxies,
  healthCheckProxy,
  createServiceProxy,
};
