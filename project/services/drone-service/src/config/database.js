const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.DB_URL || "mongodb://127.0.0.1:27017/fastfood_drones",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
