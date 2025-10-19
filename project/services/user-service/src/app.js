require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/database");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 4001;

// Trust proxy for rate limiting and X-Forwarded-For headers
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
      "http://localhost:3475", // Frontend port
      "http://127.0.0.1:4000",
      "http://127.0.0.1:4005",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
      "http://127.0.0.1:3475", // Frontend port
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
    message: "User Service is running",
    timestamp: new Date().toISOString(),
    service: "user-service",
    port: PORT,
  });
});

// Routes - mount at root since API Gateway handles /api/v1/auth prefix
app.use("/", userRoutes);

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

// ❌ KHÔNG gọi app.listen ở đây - đã tách ra server.js
module.exports = app;
