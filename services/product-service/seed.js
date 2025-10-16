const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Import Product model
const Product = require("./src/models/productModel");

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

// Seed products
const seedProducts = async () => {
  try {
    // Read products data
    const productsPath = path.join(
      __dirname,
      "../../Data/fastfood.products.json"
    );
    const productsData = JSON.parse(fs.readFileSync(productsPath, "utf8"));

    console.log(`📦 Found ${productsData.length} products to seed`);

    // Clear existing products
    await Product.deleteMany({});
    console.log("🗑️ Cleared existing products");

    // Insert new products (clean data)
    const products = productsData.map((product) => ({
      title: product.title,
      price: product.price,
      promotion: product.promotion,
      description: product.description,
      ratingsAverage: product.ratingsAverage,
      inventory: product.inventory,
      origin: product.origin,
      ingredients: product.ingredients,
      weight: product.weight,
      shelfLife: product.shelfLife,
      storage: product.storage,
      calories: product.calories,
      nutrition: product.nutrition,
      allergen: product.allergen,
      demand: product.demand,
      // Skip category for now, will add later
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await Product.insertMany(products);
    console.log(`✅ Successfully seeded ${products.length} products`);

    // Show sample products
    const sampleProducts = await Product.find().limit(5);
    console.log("📋 Sample products:");
    sampleProducts.forEach((product) => {
      console.log(`  - ${product.title}: ${product.price}đ`);
    });
  } catch (error) {
    console.error("❌ Error seeding products:", error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await seedProducts();
  process.exit(0);
};

main();
