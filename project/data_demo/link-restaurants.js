const mongoose = require("mongoose");
require("dotenv").config();

// Import Product model - from product service
const Product = require("../services/product-service/src/models/productModel");

// Connect to MongoDB
const connectDB = async () => {
  try {
    const dbUrl =
      process.env.DB_URL || "mongodb://127.0.0.1:27017/fastfood_products";
    await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected for linking restaurants");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Get restaurants from restaurant service
const getRestaurants = async () => {
  try {
    const restaurantServiceUrl =
      process.env.RESTAURANT_SERVICE_URL || "http://localhost:4006";
    const apiGatewayUrl =
      process.env.API_GATEWAY_URL || "http://localhost:5001";

    // Try to get restaurants via direct connection (if no auth required)
    // Or we can connect to restaurant DB directly
    // For now, we'll create a mapping based on restaurantId string

    // Since we can't easily query restaurant service, we'll use a different approach
    // We'll manually map based on the restaurant names we know exist
    return null; // Will use direct DB connection approach instead
  } catch (error) {
    console.error("Error getting restaurants:", error);
    return null;
  }
};

// Link products with restaurants using direct DB connection
const linkRestaurants = async () => {
  try {
    // Connect to restaurant database directly
    const restaurantDbUrl =
      process.env.RESTAURANT_DB_URL ||
      "mongodb://127.0.0.1:27017/fastfood_restaurants";

    const restaurantConn = await mongoose.createConnection(restaurantDbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const Restaurant = restaurantConn.model(
      "Restaurant",
      new mongoose.Schema({}, { collection: "restaurants", strict: false })
    );

    // Get all restaurants
    const restaurants = await Restaurant.find({}).select("_id restaurantName");
    console.log(`📋 Found ${restaurants.length} restaurants in database`);

    // Create mapping: restaurant_1 -> ObjectId, etc.
    const restaurantMap = {};
    restaurants.forEach((restaurant, index) => {
      const key = `restaurant_${index + 1}`;
      restaurantMap[key] = restaurant._id;
      console.log(
        `   ${key} -> ${restaurant.restaurantName} (${restaurant._id})`
      );
    });

    // Get all products
    const products = await Product.find({});
    console.log(`\n📦 Found ${products.length} products to link`);

    let linkedCount = 0;
    let notLinkedCount = 0;

    // Update products with restaurant ObjectId
    for (const product of products) {
      if (product.restaurantId && restaurantMap[product.restaurantId]) {
        product.restaurant = restaurantMap[product.restaurantId];
        await product.save();
        linkedCount++;
        console.log(
          `✅ Linked: ${product.title.substring(0, 30)}... -> ${
            product.restaurantId
          }`
        );
      } else {
        notLinkedCount++;
        console.log(
          `⚠️ No link: ${product.title.substring(0, 30)}... (restaurantId: ${
            product.restaurantId
          })`
        );
      }
    }

    console.log(`\n📊 Linking Summary:`);
    console.log(`   ✅ Linked: ${linkedCount}`);
    console.log(`   ⚠️ Not linked: ${notLinkedCount}`);

    await restaurantConn.close();
    console.log("\n✨ Linking completed successfully!");
  } catch (error) {
    console.error("❌ Error linking restaurants:", error);
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await linkRestaurants();
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
