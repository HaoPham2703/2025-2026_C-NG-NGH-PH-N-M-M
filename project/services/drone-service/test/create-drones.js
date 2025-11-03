const mongoose = require("mongoose");
require("dotenv").config();
const Drone = require("../src/models/droneModel");

const connectDB = async () => {
  try {
    mongoose.set("strictQuery", false);
    const dbUrl =
      process.env.DB_URL || "mongodb://127.0.0.1:27017/fastfood_drones";
    await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected for creating drones");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const createSampleDrones = async () => {
  try {
    console.log("🚁 Starting to create sample drones...");

    // Check if drones already exist
    const existingDrones = await Drone.find();
    if (existingDrones.length > 0) {
      console.log(`⚠️ Found ${existingDrones.length} existing drones`);
      console.log("📋 Existing drones:");
      existingDrones.forEach((d) => {
        console.log(`   - ${d.name} (${d.droneId}) - Status: ${d.status}`);
      });
      return;
    }

    // Ho Chi Minh City coordinates (starting locations)
    const locations = [
      { lat: 10.7769, lon: 106.7009, name: "Quận 1" }, // District 1
      { lat: 10.8419, lon: 106.8098, name: "Quận 2" }, // District 2
      { lat: 10.7629, lon: 106.6824, name: "Quận 3" }, // District 3
      { lat: 10.7678, lon: 106.6665, name: "Quận 5" }, // District 5
      { lat: 10.7541, lon: 106.6534, name: "Quận 7" }, // District 7
    ];

    const dronesToCreate = locations.map((loc, index) => ({
      droneId: `DRONE_${String(index + 1).padStart(3, "0")}`,
      name: `Drone Giao Hàng ${index + 1}`,
      status: "available",
      currentLocation: {
        latitude: loc.lat,
        longitude: loc.lon,
        altitude: 50 + Math.random() * 20, // Random altitude 50-70m
        updatedAt: new Date(),
      },
      speed: 35 + Math.random() * 15, // Random speed 35-50 km/h
      batteryLevel: 80 + Math.random() * 20, // Random battery 80-100%
      flightHistory: [],
    }));

    const insertedDrones = await Drone.insertMany(dronesToCreate);
    console.log(`✅ Successfully created ${insertedDrones.length} drones`);

    console.log("\n📋 Created drones:");
    insertedDrones.forEach((d) => {
      console.log(`   - ${d.name} (${d.droneId})`);
      console.log(
        `     Location: ${d.currentLocation.latitude.toFixed(
          4
        )}, ${d.currentLocation.longitude.toFixed(4)}`
      );
      console.log(`     Speed: ${d.speed.toFixed(1)} km/h`);
      console.log(`     Battery: ${d.batteryLevel.toFixed(0)}%`);
      console.log(`     Status: ${d.status}`);
      console.log("");
    });
  } catch (error) {
    console.error("❌ Error creating drones:", error);
  }
};

const main = async () => {
  await connectDB();
  await createSampleDrones();
  mongoose.connection.close();
  console.log("✅ Database connection closed");
  process.exit(0);
};

main();
