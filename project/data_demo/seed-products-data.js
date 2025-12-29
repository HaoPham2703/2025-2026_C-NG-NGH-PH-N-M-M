const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
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
    console.log("✅ MongoDB Connected for seeding");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Seed products from products-data.json
const seedProducts = async () => {
  try {
    // Read products data from products-data.json in the same directory
    const productsPath = path.join(__dirname, "products-data.json");
    
    // Alternative: if running from service directory, use this path
    // const productsPath = path.join(__dirname, "../../data_demo/products-data.json");

    if (!fs.existsSync(productsPath)) {
      console.error(`❌ File not found: ${productsPath}`);
      process.exit(1);
    }

    const productsData = JSON.parse(fs.readFileSync(productsPath, "utf8"));

    console.log(`📦 Found ${productsData.length} products to seed`);

    // Clear existing products
    await Product.deleteMany({});
    console.log("🗑️ Cleared existing products");

    // Map products data to Product model
    const products = productsData.map((product) => ({
      title: product.title,
      price: product.price,
      promotion: product.promotion || null,
      description: product.description || "",
      images: product.images || [],
      inventory: product.inventory || 0,
      ratingsAverage: product.ratingsAverage || 4.5,
      ratingsQuantity: product.ratingsQuantity || 0,
      restaurantId: product.restaurantId || null,
      // Note: restaurant field (ObjectId) will need to be linked later
      // if you have actual Restaurant documents in database
      origin: product.origin || "",
      ingredients: product.ingredients || "",
      weight: product.weight || null,
      shelfLife: product.shelfLife || "",
      storage: product.storage || "",
      calories: product.calories || null,
      nutrition: product.nutrition || "",
      allergen: product.allergen || "",
      demand: product.demand || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await Product.insertMany(products);
    console.log(`✅ Successfully seeded ${products.length} products`);

    // Show statistics
    console.log("\n📊 Product Statistics:");
    console.log(`   Total products: ${products.length}`);

    // Show products with promotions
    const promoProducts = products.filter((p) => p.promotion);
    console.log(`   Products on sale: ${promoProducts.length}`);

    // Show products with restaurant
    const withRestaurant = products.filter((p) => p.restaurantId);
    console.log(`   Products with restaurant: ${withRestaurant.length}`);

    // Show products by price range
    const lowPrice = products.filter((p) => p.price < 50000).length;
    const midPrice = products.filter(
      (p) => p.price >= 50000 && p.price < 100000
    ).length;
    const highPrice = products.filter((p) => p.price >= 100000).length;
    console.log(
      `   Price ranges: <50k (${lowPrice}), 50k-100k (${midPrice}), >100k (${highPrice})`
    );

    // Show products by rating
    const highRating = products.filter((p) => p.ratingsAverage >= 4.5).length;
    const midRating = products.filter(
      (p) => p.ratingsAverage >= 4.0 && p.ratingsAverage < 4.5
    ).length;
    const lowRating = products.filter((p) => p.ratingsAverage < 4.0).length;
    console.log(
      `   Ratings: 4.5+ (${highRating}), 4.0-4.5 (${midRating}), <4.0 (${lowRating})`
    );

    // Show sample products
    console.log("\n📋 Sample products:");
    const sampleProducts = await Product.find().limit(5);
    sampleProducts.forEach((product) => {
      const priceText = product.promotion
        ? `${product.promotion.toLocaleString()}đ (was ${product.price.toLocaleString()}đ)`
        : `${product.price.toLocaleString()}đ`;
      const restaurantInfo = product.restaurantId
        ? ` [${product.restaurantId}]`
        : "";
      console.log(
        `   - ${product.title}: ${priceText}${restaurantInfo} [${product.ratingsAverage}⭐]`
      );
    });

    // Show products grouped by restaurant
    if (withRestaurant.length > 0) {
      console.log("\n🍽️ Products by Restaurant:");
      const restaurantMap = {};
      products.forEach((p) => {
        if (p.restaurantId) {
          if (!restaurantMap[p.restaurantId]) {
            restaurantMap[p.restaurantId] = 0;
          }
          restaurantMap[p.restaurantId]++;
        }
      });

      Object.entries(restaurantMap).forEach(([restaurantId, count]) => {
        console.log(`   - ${restaurantId}: ${count} products`);
      });
    }

    console.log("\n✨ Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding products:", error);
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await seedProducts();
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
