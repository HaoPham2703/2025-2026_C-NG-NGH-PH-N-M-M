const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

const app = require("./app");

// Debug: kiểm tra biến môi trường
console.log("DATABASE =", process.env.DATABASE);
console.log("DB_LINK =", process.env.DB_LINK);

// Dùng DB_LINK nếu DATABASE không có
const DB = process.env.DATABASE || process.env.DB_LINK;

mongoose
  .connect(DB)
  .then(() => console.log("✅ MongoDB connected successfully!"))
  .catch((err) => console.log("❌ DB connection error:", err));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 App running on port ${port}...`);
});
