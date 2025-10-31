const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Set mongoose options to suppress deprecation warnings
    mongoose.set("strictQuery", false);

    const dbUrl =
      process.env.DB_URL || "mongodb://localhost:27017/fastfood_users";
    const conn = await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
