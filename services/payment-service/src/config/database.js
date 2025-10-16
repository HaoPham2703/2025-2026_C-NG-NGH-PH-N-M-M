const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/fastfood_payments';
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
