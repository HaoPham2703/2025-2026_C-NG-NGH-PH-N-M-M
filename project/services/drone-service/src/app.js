require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const { createServer } = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/database");
const droneRoutes = require("./routes/droneRoutes");
const DroneSimulation = require("./services/droneSimulation");
const Drone = require("./models/droneModel");

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
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
  },
});

const PORT = process.env.PORT || 4007;

// Initialize drone simulation
const droneSimulation = new DroneSimulation(io);

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
    } catch (error) {
      console.error("Error parsing user header:", error);
    }
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
    message: "Drone Service is running",
    timestamp: new Date().toISOString(),
    service: "drone-service",
    port: PORT,
  });
});

// Routes
app.use("/api/v1/drones", droneRoutes);

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join order-specific room for tracking
  socket.on("join:order", (orderId) => {
    socket.join(`order:${orderId}`);
    console.log(`Socket ${socket.id} joined order:${orderId}`);
  });

  // Leave order room
  socket.on("leave:order", (orderId) => {
    socket.leave(`order:${orderId}`);
    console.log(`Socket ${socket.id} left order:${orderId}`);
  });

  // Subscribe to specific drone updates
  socket.on("subscribe:drone", (droneId) => {
    socket.join(`drone:${droneId}`);
    console.log(`Socket ${socket.id} subscribed to drone:${droneId}`);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

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

// Watch for drone status changes and start/stop simulations
// This will automatically handle starting simulation when drone is assigned
// Also handles charging for available drones with low battery
setInterval(async () => {
  try {
    // Include available drones with low battery (< 100%) so they can charge
    const activeDrones = await Drone.find({
      $or: [
        { status: { $in: ["flying", "delivering", "returning"] } },
        { status: "available", batteryLevel: { $lt: 100 } },
      ],
    });

    for (const drone of activeDrones) {
      // Check if simulation is not running for this drone
      if (!droneSimulation.simulations.has(drone.droneId)) {
        droneSimulation.startSimulation(drone.droneId);
      }
    }

    // Stop simulation for available drones that are fully charged
    const fullyChargedDrones = await Drone.find({
      status: "available",
      batteryLevel: 100,
    });

    for (const drone of fullyChargedDrones) {
      if (droneSimulation.simulations.has(drone.droneId)) {
        droneSimulation.stopSimulation(drone.droneId);
      }
    }
  } catch (error) {
    console.error("Error checking drone simulations:", error);
  }
}, 5000); // Check every 5 seconds

// Initialize simulations for existing active drones
droneSimulation.initializeSimulations();

// Start server
server.listen(PORT, () => {
  console.log(`🚁 Drone Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(
    `🔗 Database: ${
      process.env.DB_URL || "mongodb://127.0.0.1:27017/fastfood_drones"
    }`
  );
  console.log(`🔌 WebSocket server ready for real-time tracking`);
});

module.exports = { app, io, droneSimulation };
