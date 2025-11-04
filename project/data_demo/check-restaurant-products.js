// Change to product-service directory to have access to node_modules
const path = require("path");
process.chdir(path.join(__dirname, "../services/product-service"));

const mongoose = require("mongoose");
require("dotenv").config();

// Import models
const Product = require("./src/models/productModel");
const Restaurant = require("../restaurant-service/src/models/restaurantModel");
const MenuItem = require("../restaurant-service/src/models/menuItemModel");

// Connect to MongoDB
const connectDB = async () => {
  try {
    mongoose.set("strictQuery", false);
    // Connect to product service DB
    const productDbUrl =
      process.env.DB_URL || "mongodb://127.0.0.1:27017/fastfood_products";
    await mongoose.connect(productDbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to Product DB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const checkRestaurantProducts = async () => {
  try {
    await connectDB();

    const email = "pho.hanoi@fastfood.com";
    console.log(`\n🔍 Checking products for restaurant: ${email}\n`);

    // 1. Find restaurant by email
    console.log("1️⃣ Finding restaurant by email...");
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
    const products = await Product.find({ restaurant: restaurant._id });
    console.log(`   Found ${products.length} products in Product service`);
    
    if (products.length > 0) {
      console.log("\n   Products in Product service:");
      products.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.title || p.name} - ${p.price}đ`);
      });
    }

    // 3. Check products by restaurantId string (restaurant_1)
    console.log("\n3️⃣ Checking products by restaurantId string...");
    const productsByString = await Product.find({ 
      $or: [
        { restaurantId: "restaurant_1" },
        { restaurantId: restaurant._id.toString() }
      ]
    });
    console.log(`   Found ${productsByString.length} products by restaurantId string`);
    
    if (productsByString.length > 0) {
      console.log("\n   Products by restaurantId:");
      productsByString.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.title || p.name} - ${p.price}đ`);
      });
    }

    // 4. Check MenuItems in Restaurant service (connect to restaurant DB)
    console.log("\n4️⃣ Checking MenuItems in Restaurant service...");
    
    // Load restaurant service env (from product-service directory)
    const restaurantEnvPath = path.join(__dirname, "../../services/restaurant-service/.env");
    try {
      require("dotenv").config({ path: restaurantEnvPath, override: false });
    } catch (e) {
      // Ignore if .env doesn't exist
    }
    
    const restaurantDbUrl =
      process.env.DB_URL || "mongodb://127.0.0.1:27017/fastfood_restaurants";
    
    await mongoose.disconnect();
    await mongoose.connect(restaurantDbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to Restaurant DB");

    const menuItems = await MenuItem.find({ restaurantId: restaurant._id });
    console.log(`   Found ${menuItems.length} menu items in Restaurant service`);
    
    if (menuItems.length > 0) {
      console.log("\n   Menu Items:");
      menuItems.forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.title} - ${item.price}đ`);
      });
    } else {
      console.log("   ⚠️ No menu items found! Restaurant needs to add products to their menu.");
    }

    // Summary
    console.log("\n📊 Summary:");
    console.log(`   - Products in Product service: ${products.length}`);
    console.log(`   - Products by restaurantId string: ${productsByString.length}`);
    console.log(`   - Menu Items in Restaurant service: ${menuItems.length}`);
    
    if (menuItems.length === 0 && products.length > 0) {
      console.log("\n💡 Suggestion:");
      console.log("   Products exist in Product service but not in Restaurant MenuItems.");
      console.log("   You may need to sync products to MenuItems or have restaurant add them manually.");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

checkRestaurantProducts();

