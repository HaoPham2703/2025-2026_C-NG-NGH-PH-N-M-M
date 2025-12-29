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
      const host = process.env.DB_HOST || "127.0.0.1";
      const port = process.env.DB_PORT || "27017";
      const dbName = process.env.DB_NAME || "fastfood_drones";
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
      serverSelectionTimeoutMS: 30000, // Tăng timeout lên 30s
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
    };

    console.log(`🔄 Đang kết nối MongoDB...`);
    const conn = await mongoose.connect(dbUrl, connectionOptions);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn(`⚠️  MongoDB disconnected`);
    });

    mongoose.connection.on('reconnected', () => {
      console.log(`✅ MongoDB reconnected`);
    });
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT')) {
      console.error(`💡 Lỗi kết nối mạng. Kiểm tra:`);
      console.error(`   - Kết nối internet`);
      console.error(`   - MongoDB Atlas IP whitelist`);
      console.error(`   - VPN hoặc firewall`);
    } else if (error.message.includes('Authentication failed')) {
      console.error(`💡 Lỗi xác thực. Kiểm tra username/password trong DB_URL`);
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;
