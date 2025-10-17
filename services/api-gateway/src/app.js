const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      "http://localhost:3475", // Frontend microservices
      "http://localhost:3000", // Frontend cũ
      "http://localhost:4005", // Frontend cũ
      "http://localhost:5173",
      "http://localhost:5174",
      "http://127.0.0.1:3475",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
    ],
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    status: "error",
    message: "Too many requests from this IP, please try again later",
  },
});
app.use("/api", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Request ID middleware
app.use((req, res, next) => {
  const requestId =
    req.headers["x-request-id"] ||
    `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
});

// Routes
app.use("/", routes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(`[${req.requestId}] Error:`, err);

  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal server error",
    requestId: req.requestId,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
    path: req.originalUrl,
    requestId: req.requestId,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Services configured:`);
  console.log(
    `   - User Service: ${
      process.env.USER_SERVICE_URL || "http://localhost:4001"
    }`
  );
  console.log(
    `   - Product Service: ${
      process.env.PRODUCT_SERVICE_URL || "http://localhost:4002"
    }`
  );
  console.log(
    `   - Order Service: ${
      process.env.ORDER_SERVICE_URL || "http://localhost:4003"
    }`
  );
  console.log(
    `   - Payment Service: ${
      process.env.PAYMENT_SERVICE_URL || "http://localhost:4004"
    }`
  );
});

module.exports = app;
