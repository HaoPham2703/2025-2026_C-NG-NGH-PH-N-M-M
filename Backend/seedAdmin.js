// seedAdmin.js
require("dotenv").config({ path: "./.env" }); // load biến môi trường
const mongoose = require("mongoose");
const User = require("./models/userModel");

// Kiểm tra biến môi trường
console.log("DB_LINK =", process.env.DB_LINK);

// Kết nối MongoDB
mongoose
  .connect(process.env.DB_LINK, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected successfully!"))
  .catch((err) => {
    console.log("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Admin info
const adminUser = {
  name: "Admin FastFood",
  email: "admin@fastfood.vn", // thay bằng email bạn muốn
  password: "123456", // mật khẩu mặc định
  passwordConfirm: "123456",
  role: "admin",
  active: "active",
};

// Seed admin function
const seedAdmin = async () => {
  try {
    const exists = await User.findOne({ email: adminUser.email });
    if (exists) {
      console.log("⚠️ Admin đã tồn tại:", adminUser.email);
    } else {
      const newAdmin = await User.create(adminUser);
      console.log("✅ Admin tạo thành công:", newAdmin.email);
    }
    process.exit();
  } catch (err) {
    console.log("❌ Lỗi khi tạo admin:", err);
    process.exit(1);
  }
};

seedAdmin();
