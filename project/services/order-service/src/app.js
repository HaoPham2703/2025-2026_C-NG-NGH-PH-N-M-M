require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/database");
const orderRoutes = require("./routes/orderRoutes");

const app = express();
const PORT = process.env.PORT || 4003;

// Trust proxy for rate limiting and X-Forwarded-For headers from API Gateway
app.set("trust proxy", 1);

// Connect to database
connectDB();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      "http://localhost:4000",
      "http://localhost:4005",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://127.0.0.1:4000",
      "http://127.0.0.1:4005",
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

// Extract user information from API gateway (Base64 encoded)
app.use((req, res, next) => {
  const userHeader = req.headers["x-user"];
  if (userHeader) {
    try {
      // Decode Base64 first, then parse JSON
      const userJson = Buffer.from(userHeader, "base64").toString("utf-8");
      req.user = JSON.parse(userJson);
      console.log("[Order Service] User extracted from header:", {
        userId: req.user._id || req.user.id || req.user.userId,
        role: req.user.role,
        email: req.user.email,
      });
    } catch (error) {
      console.error("[Order Service] Error parsing user header:", error);
      console.error("[Order Service] User header value:", userHeader);
    }
  } else {
    console.warn("[Order Service] No x-user header found in request");
  }
  next();
});

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

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "success",
    message: "Order Service is running",
    timestamp: new Date().toISOString(),
    service: "order-service",
    port: PORT,
  });
});

// Routes
app.use("/api/v1/orders", orderRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(`[${req.requestId}] Error:`, err);

  res.status(err.statusCode || 500).json({
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

// No graceful shutdown needed - simple service like User/Product Service

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Order Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(
    `🔗 Database: ${
      process.env.DB_URL || "mongodb://localhost:27017/fastfood_orders"
    }`
  );
  // No Kafka logging - simple service like User/Product Service
});

module.exports = app;
