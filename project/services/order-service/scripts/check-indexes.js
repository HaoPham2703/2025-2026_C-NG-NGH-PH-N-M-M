/**
 * Script để kiểm tra và tạo indexes cho Order collection
 * Chạy: node scripts/check-indexes.js
 */

const mongoose = require("mongoose");
require("dotenv").config();

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Hóa đơn phải có người mua"],
    },
    address: String,
    receiver: String,
    phone: String,
    cart: Array,
    createdAt: Date,
    totalPrice: Number,
    payments: String,
    status: String,
    restaurant: {
      type: mongoose.Schema.ObjectId,
      ref: "Restaurant",
    },
    invoicePayment: Object,
  },
  { collection: "orders" }
);

// Compound indexes
orderSchema.index({ restaurant: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, status: 1, createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);

async function checkIndexes() {
  try {
    const dbUrl =
      process.env.DB_URL ||
      process.env.MONGODB_URI ||
      "mongodb://127.0.0.1:27017/fastfood_orders";
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    const collection = mongoose.connection.collection("orders");

    // Lấy danh sách indexes hiện tại
    const indexes = await collection.indexes();
    console.log("\n📋 Current indexes:");
    indexes.forEach((index, i) => {
      console.log(`  ${i + 1}. ${JSON.stringify(index.key)} - ${index.name}`);
    });

    // Kiểm tra index cần thiết
    const requiredIndexes = [
      { restaurant: 1, createdAt: -1 },
      { restaurant: 1, status: 1, createdAt: -1 },
    ];

    console.log("\n🔍 Checking required indexes...");
    for (const indexKey of requiredIndexes) {
      const indexExists = indexes.some(
        (idx) => JSON.stringify(idx.key) === JSON.stringify(indexKey)
      );

      if (indexExists) {
        console.log(`  ✅ Index exists: ${JSON.stringify(indexKey)}`);
      } else {
        console.log(`  ⚠️  Missing index: ${JSON.stringify(indexKey)}`);
        console.log(`     Creating index...`);
        await collection.createIndex(indexKey);
        console.log(`     ✅ Index created successfully`);
      }
    }

    // Test query với explain
    console.log("\n🧪 Testing query performance...");
    const testRestaurantId = new mongoose.Types.ObjectId(
      "691409eb30c02dc5e49e4c8a"
    );
    const explainResult = await collection
      .find({ restaurant: testRestaurantId })
      .limit(10)
      .explain("executionStats");

    const executionStats = explainResult.executionStats;
    console.log(
      `  Query execution time: ${executionStats.executionTimeMillis}ms`
    );
    console.log(`  Documents examined: ${executionStats.totalDocsExamined}`);
    console.log(`  Documents returned: ${executionStats.nReturned}`);

    if (executionStats.executionStage.stage === "IXSCAN") {
      console.log(
        `  ✅ Using index: ${executionStats.executionStage.indexName}`
      );
    } else if (executionStats.executionStage.stage === "COLLSCAN") {
      console.log(
        `  ⚠️  COLLSCAN detected - query is scanning entire collection!`
      );
      console.log(`     This is slow. Make sure indexes are created.`);
    }

    console.log("\n✅ Index check completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkIndexes();
