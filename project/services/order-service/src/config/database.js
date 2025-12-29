const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Set mongoose options to suppress deprecation warnings
    mongoose.set("strictQuery", false);

    // Support both DB_URL (MongoDB URI) and individual connection parameters
    // MongoDB URI format: mongodb+srv://username:password@cluster.mongodb.net/dbname
    // or: mongodb://username:password@host:port/dbname
    let dbUrl = process.env.DB_URL || process.env.MONGODB_URI;

    // If no URI provided, construct from individual parameters
    if (!dbUrl) {
      const host = process.env.DB_HOST || "localhost";
      const port = process.env.DB_PORT || "27017";
      const dbName = process.env.DB_NAME || "fastfood_orders";
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
    };

    const conn = await mongoose.connect(dbUrl, connectionOptions);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Đảm bảo indexes được tạo khi service khởi động
    // Mongoose sẽ tự động tạo indexes từ schema, nhưng đảm bảo chắc chắn
    try {
      const Order = require("../models/orderModel");
      // Mongoose sẽ tự động tạo indexes từ schema.index() khi model được load
      // Nhưng có thể cần sync indexes nếu đã có data
      await Order.ensureIndexes();
      console.log(`✅ Order indexes ensured`);
    } catch (indexError) {
      console.warn(`⚠️  Could not ensure indexes: ${indexError.message}`);
      console.warn(`💡 Run: node scripts/check-indexes.js to create indexes manually`);
    }
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
