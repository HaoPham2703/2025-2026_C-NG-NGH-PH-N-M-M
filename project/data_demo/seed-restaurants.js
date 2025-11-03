const mongoose = require("mongoose");
require("dotenv").config();

// Import Restaurant model - from restaurant service
const Restaurant = require("../services/restaurant-service/src/models/restaurantModel");

// Connect to MongoDB
const connectDB = async () => {
  try {
    mongoose.set("strictQuery", false);
    const dbUrl =
      process.env.DB_URL || "mongodb://127.0.0.1:27017/fastfood_restaurants";
    await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected for seeding");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Restaurant data based on products-data.json
const restaurantsData = [
  {
    restaurantName: "Phở Gia Truyền Hà Nội",
    ownerName: "Nguyễn Văn Phở",
    email: "pho.hanoi@fastfood.com",
    password: "123456", // Will be hashed automatically
    phone: "0901234567",
    cuisine: "Việt Nam",
    description:
      "Phở bò truyền thống Hà Nội với nước dùng đậm đà, thịt bò tươi ngon",
    address: {
      detail: "123 Đường Phở",
      ward: "Phường Phở Bò",
      district: "Quận 1",
      city: "TP. Hồ Chí Minh",
    },
    businessHours: {
      monday: { open: "06:00", close: "22:00", closed: false },
      tuesday: { open: "06:00", close: "22:00", closed: false },
      wednesday: { open: "06:00", close: "22:00", closed: false },
      thursday: { open: "06:00", close: "22:00", closed: false },
      friday: { open: "06:00", close: "22:00", closed: false },
      saturday: { open: "06:00", close: "22:00", closed: false },
      sunday: { open: "06:00", close: "22:00", closed: false },
    },
    status: "active",
    verified: true,
    rating: 4.5,
  },
  {
    restaurantName: "Bánh Mì Sài Gòn",
    ownerName: "Trần Văn Bánh",
    email: "banhmi.saigon@fastfood.com",
    password: "123456",
    phone: "0901234568",
    cuisine: "Việt Nam",
    description:
      "Bánh mì Sài Gòn đặc sắc với pate tự làm và thịt nướng thơm lừng",
    address: {
      detail: "456 Đường Bánh Mì",
      ward: "Phường Bánh Mì",
      district: "Quận 3",
      city: "TP. Hồ Chí Minh",
    },
    businessHours: {
      monday: { open: "05:00", close: "23:00", closed: false },
      tuesday: { open: "05:00", close: "23:00", closed: false },
      wednesday: { open: "05:00", close: "23:00", closed: false },
      thursday: { open: "05:00", close: "23:00", closed: false },
      friday: { open: "05:00", close: "23:00", closed: false },
      saturday: { open: "05:00", close: "23:00", closed: false },
      sunday: { open: "05:00", close: "23:00", closed: false },
    },
    status: "active",
    verified: true,
    rating: 4.7,
  },
  {
    restaurantName: "Bún Chả Hà Nội",
    ownerName: "Lê Văn Bún",
    email: "buncha.hanoi@fastfood.com",
    password: "123456",
    phone: "0901234569",
    cuisine: "Việt Nam",
    description:
      "Bún chả truyền thống Hà Nội với thịt nướng than hoa thơm lừng",
    address: {
      detail: "789 Đường Bún Chả",
      ward: "Phường Bún",
      district: "Quận 1",
      city: "TP. Hồ Chí Minh",
    },
    businessHours: {
      monday: { open: "10:00", close: "21:00", closed: false },
      tuesday: { open: "10:00", close: "21:00", closed: false },
      wednesday: { open: "10:00", close: "21:00", closed: false },
      thursday: { open: "10:00", close: "21:00", closed: false },
      friday: { open: "10:00", close: "21:00", closed: false },
      saturday: { open: "10:00", close: "21:00", closed: false },
      sunday: { open: "10:00", close: "21:00", closed: false },
    },
    status: "active",
    verified: true,
    rating: 4.6,
  },
  {
    restaurantName: "Cơm Tấm Sài Gòn",
    ownerName: "Phạm Văn Cơm",
    email: "comtam.saigon@fastfood.com",
    password: "123456",
    phone: "0901234570",
    cuisine: "Việt Nam",
    description: "Cơm tấm Sài Gòn với sườn nướng mật ong đậm đà, chả trứng, bì",
    address: {
      detail: "321 Đường Cơm Tấm",
      ward: "Phường Cơm",
      district: "Quận 5",
      city: "TP. Hồ Chí Minh",
    },
    businessHours: {
      monday: { open: "11:00", close: "22:00", closed: false },
      tuesday: { open: "11:00", close: "22:00", closed: false },
      wednesday: { open: "11:00", close: "22:00", closed: false },
      thursday: { open: "11:00", close: "22:00", closed: false },
      friday: { open: "11:00", close: "22:00", closed: false },
      saturday: { open: "11:00", close: "22:00", closed: false },
      sunday: { open: "11:00", close: "22:00", closed: false },
    },
    status: "active",
    verified: true,
    rating: 4.4,
  },
  {
    restaurantName: "Bún Bò Huế Xưa",
    ownerName: "Hoàng Văn Bún",
    email: "bunbo.hue@fastfood.com",
    password: "123456",
    phone: "0901234571",
    cuisine: "Việt Nam",
    description: "Bún bò Huế cay nồng với nước dùng đậm đà, đặc trưng xứ Huế",
    address: {
      detail: "654 Đường Bún Bò",
      ward: "Phường Bún Bò",
      district: "Quận 7",
      city: "TP. Hồ Chí Minh",
    },
    businessHours: {
      monday: { open: "06:00", close: "22:00", closed: false },
      tuesday: { open: "06:00", close: "22:00", closed: false },
      wednesday: { open: "06:00", close: "22:00", closed: false },
      thursday: { open: "06:00", close: "22:00", closed: false },
      friday: { open: "06:00", close: "22:00", closed: false },
      saturday: { open: "06:00", close: "22:00", closed: false },
      sunday: { open: "06:00", close: "22:00", closed: false },
    },
    status: "active",
    verified: true,
    rating: 4.8,
  },
  {
    restaurantName: "Gỏi Cuốn Tươi",
    ownerName: "Võ Văn Gỏi",
    email: "goicuon@fastfood.com",
    password: "123456",
    phone: "0901234572",
    cuisine: "Việt Nam",
    description: "Gỏi cuốn tươi ngon với nguyên liệu tươi sống hàng ngày",
    address: {
      detail: "987 Đường Gỏi",
      ward: "Phường Gỏi Cuốn",
      district: "Quận 2",
      city: "TP. Hồ Chí Minh",
    },
    businessHours: {
      monday: { open: "09:00", close: "21:00", closed: false },
      tuesday: { open: "09:00", close: "21:00", closed: false },
      wednesday: { open: "09:00", close: "21:00", closed: false },
      thursday: { open: "09:00", close: "21:00", closed: false },
      friday: { open: "09:00", close: "21:00", closed: false },
      saturday: { open: "09:00", close: "21:00", closed: false },
      sunday: { open: "09:00", close: "21:00", closed: false },
    },
    status: "active",
    verified: true,
    rating: 4.5,
  },
  {
    restaurantName: "Bánh Xèo Miền Tây",
    ownerName: "Đỗ Văn Xèo",
    email: "banhxeo@fastfood.com",
    password: "123456",
    phone: "0901234573",
    cuisine: "Việt Nam",
    description: "Bánh xèo giòn rụm miền Tây với nhân tôm thịt đầy đặn",
    address: {
      detail: "147 Đường Bánh Xèo",
      ward: "Phường Bánh Xèo",
      district: "Quận 4",
      city: "TP. Hồ Chí Minh",
    },
    businessHours: {
      monday: { open: "10:00", close: "22:00", closed: false },
      tuesday: { open: "10:00", close: "22:00", closed: false },
      wednesday: { open: "10:00", close: "22:00", closed: false },
      thursday: { open: "10:00", close: "22:00", closed: false },
      friday: { open: "10:00", close: "22:00", closed: false },
      saturday: { open: "10:00", close: "22:00", closed: false },
      sunday: { open: "10:00", close: "22:00", closed: false },
    },
    status: "active",
    verified: true,
    rating: 4.6,
  },
  {
    restaurantName: "Hủ Tiếu Nam Vang",
    ownerName: "Bùi Văn Hủ",
    email: "hutieu@fastfood.com",
    password: "123456",
    phone: "0901234574",
    cuisine: "Việt Nam",
    description:
      "Hủ tiếu Nam Vang với nước dùng trong ngọt, sợi hủ tiếu dai mềm",
    address: {
      detail: "258 Đường Hủ Tiếu",
      ward: "Phường Hủ Tiếu",
      district: "Quận 6",
      city: "TP. Hồ Chí Minh",
    },
    businessHours: {
      monday: { open: "06:00", close: "23:00", closed: false },
      tuesday: { open: "06:00", close: "23:00", closed: false },
      wednesday: { open: "06:00", close: "23:00", closed: false },
      thursday: { open: "06:00", close: "23:00", closed: false },
      friday: { open: "06:00", close: "23:00", closed: false },
      saturday: { open: "06:00", close: "23:00", closed: false },
      sunday: { open: "06:00", close: "23:00", closed: false },
    },
    status: "active",
    verified: true,
    rating: 4.3,
  },
  {
    restaurantName: "Bánh Canh Cua",
    ownerName: "Lý Văn Cua",
    email: "banhcanh@fastfood.com",
    password: "123456",
    phone: "0901234575",
    cuisine: "Việt Nam",
    description: "Bánh canh cua với nước dùng đậm đà, cua tươi, chả cá",
    address: {
      detail: "369 Đường Bánh Canh",
      ward: "Phường Bánh Canh",
      district: "Quận 8",
      city: "TP. Hồ Chí Minh",
    },
    businessHours: {
      monday: { open: "07:00", close: "21:00", closed: false },
      tuesday: { open: "07:00", close: "21:00", closed: false },
      wednesday: { open: "07:00", close: "21:00", closed: false },
      thursday: { open: "07:00", close: "21:00", closed: false },
      friday: { open: "07:00", close: "21:00", closed: false },
      saturday: { open: "07:00", close: "21:00", closed: false },
      sunday: { open: "07:00", close: "21:00", closed: false },
    },
    status: "active",
    verified: true,
    rating: 4.7,
  },
  {
    restaurantName: "Cháo Lòng 24h",
    ownerName: "Ngô Văn Cháo",
    email: "chaolong@fastfood.com",
    password: "123456",
    phone: "0901234576",
    cuisine: "Việt Nam",
    description:
      "Cháo lòng nóng hổi phục vụ 24/7, thích hợp cho bữa sáng và đêm khuya",
    address: {
      detail: "741 Đường Cháo Lòng",
      ward: "Phường Cháo",
      district: "Quận 10",
      city: "TP. Hồ Chí Minh",
    },
    businessHours: {
      monday: { open: "00:00", close: "23:59", closed: false },
      tuesday: { open: "00:00", close: "23:59", closed: false },
      wednesday: { open: "00:00", close: "23:59", closed: false },
      thursday: { open: "00:00", close: "23:59", closed: false },
      friday: { open: "00:00", close: "23:59", closed: false },
      saturday: { open: "00:00", close: "23:59", closed: false },
      sunday: { open: "00:00", close: "23:59", closed: false },
    },
    status: "active",
    verified: true,
    rating: 4.2,
  },
  {
    restaurantName: "Bánh Mì Pate",
    ownerName: "Đinh Văn Pate",
    email: "banhmi.pate@fastfood.com",
    password: "123456",
    phone: "0901234577",
    cuisine: "Việt Nam",
    description: "Bánh mì pate với pate tự làm thơm ngon, chả lụa, thịt nguội",
    address: {
      detail: "852 Đường Pate",
      ward: "Phường Pate",
      district: "Quận 11",
      city: "TP. Hồ Chí Minh",
    },
    businessHours: {
      monday: { open: "05:00", close: "12:00", closed: false },
      tuesday: { open: "05:00", close: "12:00", closed: false },
      wednesday: { open: "05:00", close: "12:00", closed: false },
      thursday: { open: "05:00", close: "12:00", closed: false },
      friday: { open: "05:00", close: "12:00", closed: false },
      saturday: { open: "05:00", close: "12:00", closed: false },
      sunday: { open: "05:00", close: "12:00", closed: false },
    },
    status: "active",
    verified: true,
    rating: 4.4,
  },
  {
    restaurantName: "Nem Nướng Nha Trang",
    ownerName: "Phan Văn Nem",
    email: "nemnuong@fastfood.com",
    password: "123456",
    phone: "0901234578",
    cuisine: "Việt Nam",
    description:
      "Nem nướng Nha Trang đặc sản với thịt heo xay ướp gia vị đặc biệt",
    address: {
      detail: "963 Đường Nem",
      ward: "Phường Nem",
      district: "Quận 9",
      city: "TP. Hồ Chí Minh",
    },
    businessHours: {
      monday: { open: "11:00", close: "22:00", closed: false },
      tuesday: { open: "11:00", close: "22:00", closed: false },
      wednesday: { open: "11:00", close: "22:00", closed: false },
      thursday: { open: "11:00", close: "22:00", closed: false },
      friday: { open: "11:00", close: "22:00", closed: false },
      saturday: { open: "11:00", close: "22:00", closed: false },
      sunday: { open: "11:00", close: "22:00", closed: false },
    },
    status: "active",
    verified: true,
    rating: 4.6,
  },
  {
    restaurantName: "Chè Đặc Sản",
    ownerName: "Vương Văn Chè",
    email: "che@fastfood.com",
    password: "123456",
    phone: "0901234579",
    cuisine: "Việt Nam",
    description:
      "Chè đậu xanh, chè đậu đỏ, chè khúc bạch và nhiều loại chè đặc sản khác",
    address: {
      detail: "159 Đường Chè",
      ward: "Phường Chè",
      district: "Quận 12",
      city: "TP. Hồ Chí Minh",
    },
    businessHours: {
      monday: { open: "08:00", close: "22:00", closed: false },
      tuesday: { open: "08:00", close: "22:00", closed: false },
      wednesday: { open: "08:00", close: "22:00", closed: false },
      thursday: { open: "08:00", close: "22:00", closed: false },
      friday: { open: "08:00", close: "22:00", closed: false },
      saturday: { open: "08:00", close: "22:00", closed: false },
      sunday: { open: "08:00", close: "22:00", closed: false },
    },
    status: "active",
    verified: true,
    rating: 4.3,
  },
  {
    restaurantName: "Sinh Tố Tươi",
    ownerName: "Tạ Văn Sinh",
    email: "sinhto@fastfood.com",
    password: "123456",
    phone: "0901234580",
    cuisine: "Việt Nam",
    description: "Sinh tố trái cây tươi ngon, làm từ trái cây tươi mỗi ngày",
    address: {
      detail: "357 Đường Sinh Tố",
      ward: "Phường Sinh Tố",
      district: "Quận Bình Thạnh",
      city: "TP. Hồ Chí Minh",
    },
    businessHours: {
      monday: { open: "07:00", close: "23:00", closed: false },
      tuesday: { open: "07:00", close: "23:00", closed: false },
      wednesday: { open: "07:00", close: "23:00", closed: false },
      thursday: { open: "07:00", close: "23:00", closed: false },
      friday: { open: "07:00", close: "23:00", closed: false },
      saturday: { open: "07:00", close: "23:00", closed: false },
      sunday: { open: "07:00", close: "23:00", closed: false },
    },
    status: "active",
    verified: true,
    rating: 4.5,
  },
  {
    restaurantName: "Quán Nước Vỉa Hè",
    ownerName: "Trương Văn Nước",
    email: "quannuoc@fastfood.com",
    password: "123456",
    phone: "0901234581",
    cuisine: "Việt Nam",
    description:
      "Trà đá, cà phê đá, nước mía và các loại nước giải khát vỉa hè",
    address: {
      detail: "468 Đường Vỉa Hè",
      ward: "Phường Vỉa Hè",
      district: "Quận Tân Bình",
      city: "TP. Hồ Chí Minh",
    },
    businessHours: {
      monday: { open: "06:00", close: "23:00", closed: false },
      tuesday: { open: "06:00", close: "23:00", closed: false },
      wednesday: { open: "06:00", close: "23:00", closed: false },
      thursday: { open: "06:00", close: "23:00", closed: false },
      friday: { open: "06:00", close: "23:00", closed: false },
      saturday: { open: "06:00", close: "23:00", closed: false },
      sunday: { open: "06:00", close: "23:00", closed: false },
    },
    status: "active",
    verified: true,
    rating: 4.0,
  },
  {
    restaurantName: "Nước Dừa Tươi",
    ownerName: "Lưu Văn Dừa",
    email: "nuocdua@fastfood.com",
    password: "123456",
    phone: "0901234582",
    cuisine: "Việt Nam",
    description:
      "Nước dừa tươi nguyên trái, giải khát tự nhiên, bổ sung điện giải",
    address: {
      detail: "753 Đường Dừa",
      ward: "Phường Dừa",
      district: "Quận Phú Nhuận",
      city: "TP. Hồ Chí Minh",
    },
    businessHours: {
      monday: { open: "07:00", close: "22:00", closed: false },
      tuesday: { open: "07:00", close: "22:00", closed: false },
      wednesday: { open: "07:00", close: "22:00", closed: false },
      thursday: { open: "07:00", close: "22:00", closed: false },
      friday: { open: "07:00", close: "22:00", closed: false },
      saturday: { open: "07:00", close: "22:00", closed: false },
      sunday: { open: "07:00", close: "22:00", closed: false },
    },
    status: "active",
    verified: true,
    rating: 4.6,
  },
];

// Seed restaurants
const seedRestaurants = async () => {
  try {
    console.log("🍽️ Starting to seed restaurants...");

    // Check if restaurants already exist
    const existingCount = await Restaurant.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️ Found ${existingCount} existing restaurants`);
      console.log("🗑️ Clearing existing restaurants...");
      await Restaurant.deleteMany({});
    }

    // Insert new restaurants
    const restaurants = await Restaurant.create(restaurantsData);
    console.log(`✅ Successfully seeded ${restaurants.length} restaurants`);

    // Show statistics
    console.log("\n📊 Restaurant Statistics:");
    console.log(`   Total restaurants: ${restaurants.length}`);

    // Show restaurants by cuisine
    const cuisineMap = {};
    restaurants.forEach((r) => {
      cuisineMap[r.cuisine] = (cuisineMap[r.cuisine] || 0) + 1;
    });
    console.log("\n🍜 Restaurants by Cuisine:");
    Object.entries(cuisineMap).forEach(([cuisine, count]) => {
      console.log(`   - ${cuisine}: ${count}`);
    });

    // Show restaurants by status
    const activeCount = restaurants.filter((r) => r.status === "active").length;
    const verifiedCount = restaurants.filter((r) => r.verified).length;
    console.log(
      `\n✅ Status: Active (${activeCount}), Verified (${verifiedCount})`
    );

    // Show sample restaurants with login info
    console.log("\n📋 Sample restaurants (all passwords: 123456):");
    restaurants.slice(0, 5).forEach((restaurant) => {
      console.log(
        `   - ${restaurant.restaurantName}: ${restaurant.email} [Rating: ${restaurant.rating}⭐]`
      );
    });

    // Show all restaurants with IDs for mapping
    console.log("\n🔗 Restaurant IDs for product mapping:");
    restaurants.forEach((restaurant, index) => {
      console.log(
        `   restaurant_${index + 1} -> ${restaurant.restaurantName} (ID: ${
          restaurant._id
        })`
      );
    });

    console.log("\n✨ Seeding completed successfully!");
    console.log("\n💡 Note: All restaurants have password: 123456");
    console.log(
      "💡 You can update products in product-service to link with these restaurant IDs"
    );
  } catch (error) {
    console.error("❌ Error seeding restaurants:", error);
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await seedRestaurants();
    await mongoose.connection.close();
    console.log("\n✅ Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Fatal error:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

main();
