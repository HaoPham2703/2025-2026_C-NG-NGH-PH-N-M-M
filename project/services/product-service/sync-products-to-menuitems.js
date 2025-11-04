const mongoose = require("mongoose");
require("dotenv").config();

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

const syncProductsToMenuItems = async () => {
  try {
    console.log("\n🔄 Starting sync: Products -> MenuItems\n");

    // Step 1: Connect to Product DB
    const productDbUrl =
      process.env.DB_URL || "mongodb://127.0.0.1:27017/fastfood_products";
    await connectDB(productDbUrl, "Product DB");

    // Get all products with restaurantId
    console.log("1️⃣ Fetching products from Product service...");
    const products = await Product.find({
      restaurantId: { $exists: true, $ne: null },
    });

    console.log(`   Found ${products.length} products with restaurantId`);

    if (products.length === 0) {
      console.log("\n⚠️ No products found! Please seed products first:");
      console.log("   node data_demo/seed-products-data.js");
      process.exit(0);
    }

    // Step 2: Connect to Restaurant DB
    console.log("\n2️⃣ Connecting to Restaurant DB...");
    const restaurantDbUrl =
      process.env.DB_URL || "mongodb://127.0.0.1:27017/fastfood_restaurants";

    await mongoose.disconnect();
    await connectDB(restaurantDbUrl, "Restaurant DB");

    // Get all restaurants
    console.log("\n3️⃣ Fetching restaurants...");
    const restaurants = await Restaurant.find({});
    console.log(`   Found ${restaurants.length} restaurants`);

    // Create mapping by restaurantName (from products)
    const restaurantMap = new Map();
    restaurants.forEach((rest) => {
      restaurantMap.set(rest.restaurantName, rest);
    });

    // Group products by restaurantName
    const productsByRestaurant = new Map();

    products.forEach((product) => {
      const restaurantName = product.restaurantName;
      if (restaurantName && !productsByRestaurant.has(restaurantName)) {
        productsByRestaurant.set(restaurantName, []);
      }
      if (restaurantName) {
        productsByRestaurant.get(restaurantName).push(product);
      }
    });

    console.log(
      `\n4️⃣ Found ${productsByRestaurant.size} restaurants with products`
    );

    // Step 3: Sync each restaurant's products to MenuItems
    let totalSynced = 0;
    let totalSkipped = 0;

    for (const [restaurantName, restaurantProducts] of productsByRestaurant) {
      const restaurant = restaurantMap.get(restaurantName);

      if (!restaurant) {
        console.log(
          `\n   ⚠️ Restaurant not found: ${restaurantName}`
        );
        console.log(
          `      Skipping ${restaurantProducts.length} products`
        );
        totalSkipped += restaurantProducts.length;
        continue;
      }

      console.log(
        `\n   📦 Processing restaurant: ${restaurant.restaurantName} (${restaurant.email})`
      );
      console.log(`      Found ${restaurantProducts.length} products`);

      // Check existing menu items
      const existingMenuItems = await MenuItem.find({
        restaurantId: restaurant._id,
      });
      const existingTitles = new Set(
        existingMenuItems.map((item) => item.title.toLowerCase())
      );

      let synced = 0;
      let skipped = 0;

      for (const product of restaurantProducts) {
        // Check if menu item already exists
        if (existingTitles.has(product.title.toLowerCase())) {
          skipped++;
          continue;
        }

        // Map Product category to MenuItem category
        let category = "Khác";
        if (product.origin && product.origin.includes("Việt Nam")) {
          category = "Món Việt";
        } else if (
          product.ingredients &&
          product.ingredients.toLowerCase().includes("burger")
        ) {
          category = "Món ăn nhanh";
        } else if (
          product.title &&
          (product.title.toLowerCase().includes("trà") ||
            product.title.toLowerCase().includes("sinh tố") ||
            product.title.toLowerCase().includes("nước") ||
            product.title.toLowerCase().includes("chè"))
        ) {
          category = "Đồ uống";
        } else if (
          product.title &&
          (product.title.toLowerCase().includes("chè") ||
            product.title.toLowerCase().includes("bánh") ||
            product.title.toLowerCase().includes("tráng miệng"))
        ) {
          category = "Tráng miệng";
        }

        // Create MenuItem from Product
        const menuItem = await MenuItem.create({
          restaurantId: restaurant._id,
          title: product.title,
          description: product.description || "",
          price: product.price,
          promotion: product.promotion || null,
          category: category,
          images: product.images || [],
          stock: product.inventory || 0,
          status: "active",
          sold: 0,
          rating: product.ratingsAverage || 0,
          reviewCount: product.ratingsQuantity || 0,
        });

        synced++;
        console.log(`      ✅ Created: ${product.title}`);
      }

      totalSynced += synced;
      totalSkipped += skipped;
      console.log(
        `      Summary: ${synced} created, ${skipped} skipped (already exist)`
      );
    }

    // Summary
    console.log("\n📊 Sync Summary:");
    console.log(`   ✅ Total synced: ${totalSynced} menu items`);
    console.log(`   ⏭️  Total skipped: ${totalSkipped} (already exist)`);
    console.log(
      `   📦 Total restaurants processed: ${productsByRestaurant.size}`
    );

    if (totalSynced > 0) {
      console.log("\n✅ Sync completed successfully!");
      console.log(
        "   Products are now available in Restaurant Dashboard -> Quản lý món ăn"
      );
    } else if (totalSkipped > 0) {
      console.log("\n⚠️ All products already exist in MenuItems!");
      console.log(
        "   If you don't see products in the dashboard, check the restaurant login."
      );
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

syncProductsToMenuItems();

