require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

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

// Connect to Kafka (optional - won't fail if Kafka is not available)
connectKafka().catch((error) => {
  console.warn("⚠️ Kafka connection skipped:", error.message);
});

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
