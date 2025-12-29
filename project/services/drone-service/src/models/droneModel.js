const mongoose = require("mongoose");

const droneSchema = new mongoose.Schema(
  {
    droneId: {
      type: String,
      required: [true, "Drone phải có ID"],
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Drone phải có tên"],
    },
    status: {
      type: String,
      enum: [
        "available",
        "assigned",
        "flying",
        "delivering",
        "returning",
        "maintenance",
      ],
      default: "available",
    },
    orderId: {
      type: String,
      ref: "Order",
      default: null,
    },
    currentLocation: {
      latitude: {
        type: Number,
        required: true,
        default: 10.7769, // Ho Chi Minh City default
      },
      longitude: {
        type: Number,
        required: true,
        default: 106.7009,
      },
      altitude: {
        type: Number,
        default: 50, // meters
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
    destination: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
    // Final delivery destination (kept when destination is temporarily set to startLocation)
    deliveryDestination: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
    // Start location (restaurant) for the assigned order
    startLocation: {
      latitude: Number,
      longitude: Number,
      address: String,
      restaurantId: String,
      restaurantName: String,
    },
    homeLocation: {
      latitude: {
        type: Number,
        default: 10.7769, // Default depot location
      },
      longitude: {
        type: Number,
        default: 106.7009,
      },
      address: {
        type: String,
        default: "Depot Location",
      },
    },
    speed: {
      type: Number,
      default: 20, // km/h
    },
    batteryLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },
    flightHistory: [
      {
        latitude: Number,
        longitude: Number,
        altitude: Number,
        timestamp: Date,
      },
    ],
    assignedAt: {
      type: Date,
      default: null,
    },
    estimatedArrival: {
      type: Date,
      default: null,
    },
    // Track if 1km notification has been sent
    notificationSent1km: {
      type: Boolean,
      default: false,
    },
    // Track if 1/3 milestone notifications have been sent
    notificationSentToRestaurant: {
      type: Boolean,
      default: false,
    },
    notificationSentFromRestaurant: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for geospatial queries
droneSchema.index({
  "currentLocation.latitude": 1,
  "currentLocation.longitude": 1,
});
droneSchema.index({ status: 1 });
droneSchema.index({ orderId: 1 });

const Drone = mongoose.model("Drone", droneSchema);

module.exports = Drone;
