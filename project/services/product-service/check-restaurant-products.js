const mongoose = require("mongoose");
require("dotenv").config();
const path = require("path");

// Import models
const Product = require("./src/models/productModel");
const Restaurant = require("../restaurant-service/src/models/restaurantModel");
const MenuItem = require("../restaurant-service/src/models/menuItemModel");

// Connect to MongoDB
const connectDB = async (dbUrl, dbName) => {
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ Connected to ${dbName}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error for ${dbName}:`, error);
    throw error;
  }
};

const checkRestaurantProducts = async () => {
  try {
    // Connect to product service DB
    const productDbUrl =
      process.env.DB_URL || "mongodb://127.0.0.1:27017/fastfood_products";
    await connectDB(productDbUrl, "Product DB");

    const email = "pho.hanoi@fastfood.com";
    console.log(`\n🔍 Checking products for restaurant: ${email}\n`);

    // 1. Find restaurant by email (from restaurant DB)
    console.log("1️⃣ Finding restaurant by email...");

    // Connect to restaurant DB temporarily
    const restaurantDbUrl =
      process.env.DB_URL || "mongodb://127.0.0.1:27017/fastfood_restaurants";

    await mongoose.disconnect();
    await connectDB(restaurantDbUrl, "Restaurant DB");

    const restaurant = await Restaurant.findOne({ email });

    if (!restaurant) {
      console.log("❌ Restaurant not found!");
      return;
    }

    console.log("✅ Restaurant found:");
    console.log(`   - ID: ${restaurant._id}`);
    console.log(`   - Name: ${restaurant.restaurantName}`);
    console.log(`   - Email: ${restaurant.email}`);

    // 2. Check products in Product service (by restaurant ObjectId)
    console.log("\n2️⃣ Checking products in Product service...");
    await mongoose.disconnect();
    await connectDB(productDbUrl, "Product DB");

    const products = await Product.find({ restaurant: restaurant._id });
    console.log(`   Found ${products.length} products in Product service`);

    if (products.length > 0) {
      console.log("\n   Products in Product service:");
      products.forEach((p, i) => {
        console.log(
          `   ${i + 1}. ${p.title || p.name} - ${p.price}đ (ID: ${p._id})`
        );
      });
    } else {
      console.log("   ⚠️ No products found by restaurant ObjectId");
    }

    // 3. Check products by restaurantId string (restaurant_1)
    console.log("\n3️⃣ Checking products by restaurantId string...");
    const productsByString = await Product.find({
      $or: [
        { restaurantId: "restaurant_1" },
        { restaurantId: restaurant._id.toString() },
      ],
    });
    console.log(
      `   Found ${productsByString.length} products by restaurantId string`
    );

    if (productsByString.length > 0) {
      console.log("\n   Products by restaurantId:");
      productsByString.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.title || p.name} - ${p.price}đ`);
      });
    }

    // 4. Check MenuItems in Restaurant service
    console.log("\n4️⃣ Checking MenuItems in Restaurant service...");
    await mongoose.disconnect();
    await connectDB(restaurantDbUrl, "Restaurant DB");

    const menuItems = await MenuItem.find({ restaurantId: restaurant._id });
    console.log(
      `   Found ${menuItems.length} menu items in Restaurant service`
    );

    if (menuItems.length > 0) {
      console.log("\n   Menu Items:");
      menuItems.forEach((item, i) => {
        console.log(
          `   ${i + 1}. ${item.title} - ${item.price}đ (Stock: ${item.stock})`
        );
      });
    } else {
      console.log(
        "   ⚠️ No menu items found! Restaurant needs to add products to their menu."
      );
      console.log(
        "   💡 Products may exist in Product service but not synced to MenuItems."
      );
    }

    // Summary
    console.log("\n📊 Summary:");
    console.log(
      `   - Products in Product service (by ObjectId): ${products.length}`
    );
    console.log(
      `   - Products by restaurantId string: ${productsByString.length}`
    );
    console.log(`   - Menu Items in Restaurant service: ${menuItems.length}`);

    if (menuItems.length === 0 && products.length > 0) {
      console.log("\n💡 Suggestion:");
      console.log(
        "   Products exist in Product service but not in Restaurant MenuItems."
      );
      console.log(
        "   The restaurant needs to manually add these products to their menu,"
      );
      console.log("   or you need to sync products to MenuItems.");
    } else if (menuItems.length === 0 && products.length === 0) {
      console.log("\n⚠️ Warning:");
      console.log("   No products found! You may need to:");
      console.log("   1. Run seed-products-data.js to seed products");
      console.log(
        "   2. Run link-restaurants.js to link products to restaurants"
      );
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

checkRestaurantProducts();

