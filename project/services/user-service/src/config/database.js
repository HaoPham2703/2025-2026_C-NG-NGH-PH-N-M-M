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
      const dbName = process.env.DB_NAME || "fastfood_users";
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
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
