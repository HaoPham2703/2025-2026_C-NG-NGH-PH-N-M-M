const mongoose = require("mongoose");

const connectDB = async (retries = 5, delay = 5000) => {
  // Set mongoose options to suppress deprecation warnings
  mongoose.set("strictQuery", false);

  // Support both DB_URL (MongoDB URI) and individual connection parameters
  // MongoDB URI format: mongodb+srv://username:password@cluster.mongodb.net/dbname
  // or: mongodb://username:password@host:port/dbname
  let dbUrl = process.env.DB_URL || process.env.MONGODB_URI;

  // If no URI provided, construct from individual parameters
  if (!dbUrl) {
    const host = process.env.DB_HOST || "127.0.0.1";
    const port = process.env.DB_PORT || "27017";
    const dbName = process.env.DB_NAME || "fastfood_payments_2";
    const user = process.env.DB_USER;
    const password = process.env.DB_PASSWORD;

    if (user && password) {
      dbUrl = `mongodb://${user}:${password}@${host}:${port}/${dbName}`;
    } else {
      dbUrl = `mongodb://${host}:${port}/${dbName}`;
    }
  }

  const connectionOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000, // 10 seconds
    socketTimeoutMS: 45000, // 45 seconds
    connectTimeoutMS: 10000, // 10 seconds
    retryWrites: true,
    w: "majority",
  };

  // Retry logic for connection
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Chỉ log lần đầu và lần cuối để giảm spam
      if (attempt === 1 || attempt === retries) {
        console.log(
          `🔄 Attempting to connect to MongoDB (attempt ${attempt}/${retries})...`
        );
      }

      const conn = await mongoose.connect(dbUrl, connectionOptions);

      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      console.log(`📊 Database: ${conn.connection.name}`);
      return;
    } catch (error) {
      // Chỉ log chi tiết lỗi ở lần đầu
      if (attempt === 1) {
        console.error(
          `❌ MongoDB connection error: ${error.message}`
        );

        // Check for specific error types - chỉ hiển thị ở lần đầu
        if (error.message.includes("querySrv EREFUSED")) {
          console.error(
            "⚠️  DNS resolution failed. Retrying..."
          );
        } else if (error.message.includes("ENOTFOUND")) {
          console.error("⚠️  Hostname not found. Retrying...");
        } else if (error.message.includes("ETIMEDOUT")) {
          console.error("⚠️  Connection timeout. Retrying...");
        }
      } else if (attempt === retries) {
        // Log lần cuối nếu vẫn lỗi
        console.error(
          `❌ MongoDB connection error (attempt ${attempt}/${retries}): ${error.message}`
        );
      } else {
        // Các lần giữa chỉ log ngắn gọn
        console.log(`   Retry ${attempt}/${retries}...`);
      }

      // If this is the last attempt, exit
      if (attempt === retries) {
        console.error("");
        console.error("❌ Failed to connect to MongoDB after", retries, "attempts");
        console.error("   The service will exit. Please check your connection and try again.");
        process.exit(1);
      }

      // Wait before retrying - chỉ log ở lần đầu
      if (attempt === 1) {
        console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

module.exports = connectDB;
