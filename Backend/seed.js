const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: "./config.env" });

// Import models
const User = require("./models/userModel");
const Product = require("./models/productModel");
const Category = require("./models/categoryModel");
const Brand = require("./models/brandModel");
const Comment = require("./models/commentModel");
const Import = require("./models/importModel");
const Location = require("./models/locationModel");
const Order = require("./models/orderModel");
const Review = require("./models/reviewModel");
const Transaction = require("./models/transactionModel");

// Database connection
const DB = process.env.DATABASE || process.env.DB_LINK;
mongoose
  .connect(DB)
  .then(() => console.log("✅ MongoDB connected successfully!"))
  .catch((err) => {
    console.log("❌ DB connection error:", err);
    process.exit(1);
  });

// Function to import data from JSON files
const importData = async () => {
  try {
    console.log("🔄 Starting data import...");

    // Clear existing data
    await User.deleteMany();
    await Product.deleteMany();
    await Category.deleteMany();
    await Brand.deleteMany();
    await Comment.deleteMany();
    await Import.deleteMany();
    await Location.deleteMany();
    await Order.deleteMany();
    await Review.deleteMany();
    await Transaction.deleteMany();

    console.log("🗑️ Cleared existing data");

    // Import data from JSON files
    const dataDir = path.join(__dirname, "../Data");

    // Import users
    const usersData = JSON.parse(
      fs.readFileSync(path.join(dataDir, "fastfood.users.json"), "utf8")
    );
    await User.insertMany(usersData);
    console.log("✅ Users imported:", usersData.length);

    // Import categories
    const categoriesData = JSON.parse(
      fs.readFileSync(path.join(dataDir, "fastfood.categories.json"), "utf8")
    );
    await Category.insertMany(categoriesData);
    console.log("✅ Categories imported:", categoriesData.length);

    // Import brands
    const brandsData = JSON.parse(
      fs.readFileSync(path.join(dataDir, "fastfood.brands.json"), "utf8")
    );
    await Brand.insertMany(brandsData);
    console.log("✅ Brands imported:", brandsData.length);

    // Import products
    const productsData = JSON.parse(
      fs.readFileSync(path.join(dataDir, "fastfood.products.json"), "utf8")
    );
    await Product.insertMany(productsData);
    console.log("✅ Products imported:", productsData.length);

    // Import other collections (if they have data)
    const collections = [
      { name: "comments", model: Comment },
      { name: "imports", model: Import },
      { name: "locations", model: Location },
      { name: "orders", model: Order },
      { name: "reviews", model: Review },
      { name: "transactions", model: Transaction },
    ];

    for (const collection of collections) {
      try {
        const data = JSON.parse(
          fs.readFileSync(
            path.join(dataDir, `fastfood.${collection.name}.json`),
            "utf8"
          )
        );
        if (data.length > 0) {
          await collection.model.insertMany(data);
          console.log(`✅ ${collection.name} imported:`, data.length);
        } else {
          console.log(`ℹ️ ${collection.name} is empty, skipped`);
        }
      } catch (err) {
        console.log(`⚠️ Error importing ${collection.name}:`, err.message);
      }
    }

    console.log("🎉 Data import completed successfully!");
    process.exit(0);
  } catch (err) {
    console.log("❌ Error during import:", err);
    process.exit(1);
  }
};

// Run import
importData();
