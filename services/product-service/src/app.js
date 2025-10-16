require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/database");
const productRoutes = require("./routes/productRoutes");

const app = express();
const PORT = process.env.PORT || 4002;

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
    message: "Product Service is running",
    timestamp: new Date().toISOString(),
    service: "product-service",
    port: PORT,
  });
});

// Routes
app.use("/api/v1/products", productRoutes);

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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Product Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(
    `🔗 Database: ${
      process.env.DB_URL || "mongodb://localhost:27017/fastfood_products"
    }`
  );
});

module.exports = app;
