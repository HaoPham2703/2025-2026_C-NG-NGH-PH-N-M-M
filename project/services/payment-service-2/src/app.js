require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const axios = require("axios");

const connectDB = require("./config/database");
const {
  connectKafka,
  disconnectKafka,
  subscribeToTopic,
} = require("./config/kafka");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();
const PORT = process.env.PORT || 3005;

// Connect to database
connectDB();

const isKafkaEnabled =
  process.env.KAFKA_ENABLED === "true" || process.env.KAFKA_ENABLED === "1";

if (isKafkaEnabled) {
  connectKafka().catch((error) => {
    console.warn("⚠️ Kafka connection skipped:", error.message);
  });
} else {
  console.log("ℹ️ Kafka is disabled (set KAFKA_ENABLED=true to enable).");
}

// CORS middleware (must be before helmet)
app.use(
  cors({
    origin: [
      "http://localhost:4000",
      "http://localhost:4005",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3475",
      "http://127.0.0.1:4000",
      "http://127.0.0.1:4005",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
      "http://127.0.0.1:3475",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false, // Disable CSP for development
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
      const userJson = Buffer.from(userHeader, "base64").toString("utf-8");
      req.user = JSON.parse(userJson);
      if (process.env.NODE_ENV === "development") {
        console.log("[Payment Service 2] User extracted from header:", {
          userId: req.user._id || req.user.id || req.user.userId,
          role: req.user.role,
          email: req.user.email,
        });
      }
    } catch (error) {
      console.error("[Payment Service 2] Error parsing user header:", error);
      console.error("[Payment Service 2] User header value:", userHeader);
    }
  } else {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Payment Service 2] No x-user header found in request");
    }
  }
  next();
});

// Fallback: resolve user from Authorization token if x-user header is missing
app.use(async (req, res, next) => {
  if (req.user) {
    return next();
  }

  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return next();
  }

  try {
    const userServiceUrl =
      process.env.USER_SERVICE_URL ||
      process.env.USER_SERVICE_INTERNAL_URL ||
      "http://localhost:4001";

    const response = await axios.get(`${userServiceUrl}/api/v1/auth/verify`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 5000,
    });

    if (response.data?.status === "success" && response.data?.data?.user) {
      req.user = response.data.data.user;
      if (process.env.NODE_ENV === "development") {
        console.log("[Payment Service 2] User fetched via verify endpoint:", {
          userId:
            req.user._id || req.user.id || req.user.userId || "unknown-user",
          role: req.user.role,
          email: req.user.email,
        });
      }
    }
  } catch (error) {
    console.error(
      "[Payment Service 2] Failed to resolve user from auth token:",
      error.message
    );
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

// Debug middleware for CORS
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`
    );
    console.log("Origin:", req.headers.origin);
    console.log("Headers:", JSON.stringify(req.headers, null, 2));
  }
  next();
});

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
    message: "Payment Service 2 (VNPay Sandbox) is running",
    timestamp: new Date().toISOString(),
    service: "payment-service-2",
    port: PORT,
  });
});

// Routes
app.use("/api/v1/payments", paymentRoutes);

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

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await disconnectKafka();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  await disconnectKafka();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Payment Service 2 (VNPay Sandbox) running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(
    `🔗 Database: ${
      process.env.DB_URL || "mongodb://localhost:27017/fastfood_payments_2"
    }`
  );
  console.log(`📡 Kafka: ${process.env.KAFKA_URL || "localhost:9092"}`);
  console.log(`💳 VNPay Sandbox: ${process.env.vnp_Url || "Not configured"}`);
});

module.exports = app;
