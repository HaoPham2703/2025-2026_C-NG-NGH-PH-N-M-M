const mongoose = require("mongoose");
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

// Sample restaurant products data (without category field)
const restaurantProducts = [
  // Món Việt
  {
    title: "Phở Bò Tái",
    price: 65000,
    promotion: 55000,
    description: "Phở bò tái thơm ngon với nước dùng đậm đà, bánh phở mềm mại",
    ratingsAverage: 4.5,
    ratingsQuantity: 128,
    inventory: 50,
    images: [
      "https://images.unsplash.com/photo-1563379091339-03246963d4d4?w=500",
    ],
    origin: "Việt Nam",
    ingredients: "Bánh phở, thịt bò, hành tây, rau thơm",
    weight: 400,
    shelfLife: "1 ngày",
    storage: "Bảo quản lạnh",
    calories: 350,
    nutrition: "Protein: 25g, Carbs: 40g, Fat: 8g",
    allergen: "Gluten, Đậu nành",
    demand: "Bữa sáng, bữa trưa",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 ngày trước
  },
  {
    title: "Bún Chả Hà Nội",
    price: 45000,
    description: "Bún chả truyền thống Hà Nội với thịt nướng thơm lừng",
    ratingsAverage: 4.3,
    ratingsQuantity: 95,
    inventory: 30,
    images: ["https://images.unsplash.com/photo-1559847844-5315695dadae?w=500"],
    origin: "Việt Nam",
    ingredients: "Bún, thịt lợn, nước mắm, rau sống",
    weight: 350,
    shelfLife: "1 ngày",
    storage: "Bảo quản lạnh",
    calories: 280,
    nutrition: "Protein: 20g, Carbs: 35g, Fat: 6g",
    allergen: "Cá",
    demand: "Bữa trưa, bữa tối",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 ngày trước
  },
  {
    title: "Cơm Tấm Sài Gòn",
    price: 50000,
    promotion: 42000,
    description: "Cơm tấm Sài Gòn với sườn nướng, chả trứng, bì",
    ratingsAverage: 4.7,
    ratingsQuantity: 156,
    inventory: 25,
    images: [
      "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500",
    ],
    origin: "Việt Nam",
    ingredients: "Cơm tấm, sườn heo, chả trứng, bì, dưa leo",
    weight: 450,
    shelfLife: "1 ngày",
    storage: "Bảo quản lạnh",
    calories: 420,
    nutrition: "Protein: 28g, Carbs: 45g, Fat: 12g",
    allergen: "Trứng, Đậu nành",
    demand: "Bữa trưa, bữa tối",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 ngày trước
  },

  // Món ăn nhanh
  {
    title: "Burger Bò Phô Mai",
    price: 75000,
    description: "Burger bò thịt nướng với phô mai cheddar, rau xanh tươi",
    ratingsAverage: 4.2,
    ratingsQuantity: 89,
    inventory: 40,
    images: [
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500",
    ],
    origin: "Mỹ",
    ingredients: "Bánh mì, thịt bò, phô mai, rau xanh, sốt",
    weight: 300,
    shelfLife: "2 giờ",
    storage: "Bảo quản nóng",
    calories: 520,
    nutrition: "Protein: 32g, Carbs: 38g, Fat: 25g",
    allergen: "Gluten, Sữa, Trứng",
    demand: "Bữa trưa, bữa tối",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 ngày trước
  },
  {
    title: "Pizza Margherita",
    price: 120000,
    promotion: 99000,
    description: "Pizza cổ điển với cà chua, mozzarella, húng quế",
    ratingsAverage: 4.6,
    ratingsQuantity: 203,
    inventory: 15,
    images: [
      "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500",
    ],
    origin: "Ý",
    ingredients: "Bột mì, cà chua, mozzarella, húng quế, dầu ô liu",
    weight: 600,
    shelfLife: "1 ngày",
    storage: "Bảo quản lạnh",
    calories: 480,
    nutrition: "Protein: 22g, Carbs: 55g, Fat: 18g",
    allergen: "Gluten, Sữa",
    demand: "Bữa tối, tiệc",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 ngày trước
  },
  {
    title: "Gà Rán Giòn",
    price: 55000,
    description: "Gà rán giòn rụm với gia vị đặc biệt, ăn kèm khoai tây",
    ratingsAverage: 4.4,
    ratingsQuantity: 167,
    inventory: 60,
    images: [
      "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=500",
    ],
    origin: "Mỹ",
    ingredients: "Thịt gà, bột chiên, gia vị, khoai tây",
    weight: 400,
    shelfLife: "2 giờ",
    storage: "Bảo quản nóng",
    calories: 380,
    nutrition: "Protein: 28g, Carbs: 25g, Fat: 20g",
    allergen: "Gluten, Trứng",
    demand: "Bữa trưa, bữa tối",
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 ngày trước
  },

  // Đồ uống
  {
    title: "Trà Sữa Trân Châu",
    price: 35000,
    description: "Trà sữa thơm ngon với trân châu đen mềm dẻo",
    ratingsAverage: 4.1,
    ratingsQuantity: 234,
    inventory: 80,
    images: ["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500"],
    origin: "Đài Loan",
    ingredients: "Trà đen, sữa tươi, trân châu, đường",
    weight: 500,
    shelfLife: "4 giờ",
    storage: "Bảo quản lạnh",
    calories: 280,
    nutrition: "Protein: 8g, Carbs: 45g, Fat: 6g",
    allergen: "Sữa",
    demand: "Mọi thời điểm",
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 ngày trước
  },
  {
    title: "Cà Phê Sữa Đá",
    price: 25000,
    description: "Cà phê sữa đá truyền thống Việt Nam",
    ratingsAverage: 4.8,
    ratingsQuantity: 189,
    inventory: 100,
    images: [
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500",
    ],
    origin: "Việt Nam",
    ingredients: "Cà phê đen, sữa đặc, đá viên",
    weight: 300,
    shelfLife: "2 giờ",
    storage: "Bảo quản lạnh",
    calories: 120,
    nutrition: "Protein: 4g, Carbs: 18g, Fat: 3g",
    allergen: "Sữa",
    demand: "Bữa sáng, chiều",
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 ngày trước
  },
  {
    title: "Nước Cam Tươi",
    price: 30000,
    description: "Nước cam tươi vắt nguyên chất, không đường",
    ratingsAverage: 4.3,
    ratingsQuantity: 145,
    inventory: 45,
    images: [
      "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500",
    ],
    origin: "Việt Nam",
    ingredients: "Cam tươi, đá viên",
    weight: 400,
    shelfLife: "1 ngày",
    storage: "Bảo quản lạnh",
    calories: 80,
    nutrition: "Protein: 2g, Carbs: 18g, Fat: 0g",
    allergen: "Không",
    demand: "Mọi thời điểm",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 ngày trước
  },

  // Tráng miệng
  {
    title: "Chè Đậu Đỏ",
    price: 20000,
    description: "Chè đậu đỏ ngọt ngào với nước cốt dừa thơm béo",
    ratingsAverage: 4.5,
    ratingsQuantity: 98,
    inventory: 35,
    images: ["https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500"],
    origin: "Việt Nam",
    ingredients: "Đậu đỏ, đường, nước cốt dừa, đá viên",
    weight: 250,
    shelfLife: "1 ngày",
    storage: "Bảo quản lạnh",
    calories: 150,
    nutrition: "Protein: 4g, Carbs: 32g, Fat: 2g",
    allergen: "Dừa",
    demand: "Tráng miệng",
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 ngày trước
  },
  {
    title: "Bánh Flan Caramel",
    price: 28000,
    description: "Bánh flan mềm mịn với caramel ngọt ngào",
    ratingsAverage: 4.7,
    ratingsQuantity: 112,
    inventory: 20,
    images: [
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500",
    ],
    origin: "Pháp",
    ingredients: "Trứng, sữa, đường, vani",
    weight: 150,
    shelfLife: "2 ngày",
    storage: "Bảo quản lạnh",
    calories: 200,
    nutrition: "Protein: 8g, Carbs: 25g, Fat: 6g",
    allergen: "Trứng, Sữa",
    demand: "Tráng miệng",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 ngày trước
  },

  // Món chay
  {
    title: "Cơm Chay Thập Cẩm",
    price: 40000,
    description: "Cơm chay với đậu phụ, nấm, rau củ tươi ngon",
    ratingsAverage: 4.2,
    ratingsQuantity: 76,
    inventory: 25,
    images: [
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500",
    ],
    origin: "Việt Nam",
    ingredients: "Cơm, đậu phụ, nấm, rau củ, nước tương",
    weight: 380,
    shelfLife: "1 ngày",
    storage: "Bảo quản lạnh",
    calories: 320,
    nutrition: "Protein: 15g, Carbs: 50g, Fat: 8g",
    allergen: "Đậu nành",
    demand: "Bữa trưa, bữa tối",
    createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000), // 11 ngày trước
  },
  {
    title: "Bún Chay Thanh Đạm",
    price: 35000,
    description: "Bún chay với nước dùng rau củ thanh đạm",
    ratingsAverage: 4.0,
    ratingsQuantity: 64,
    inventory: 30,
    images: ["https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500"],
    origin: "Việt Nam",
    ingredients: "Bún, rau củ, nấm, đậu phụ, nước dùng chay",
    weight: 320,
    shelfLife: "1 ngày",
    storage: "Bảo quản lạnh",
    calories: 250,
    nutrition: "Protein: 12g, Carbs: 40g, Fat: 5g",
    allergen: "Đậu nành",
    demand: "Bữa trưa, bữa tối",
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 ngày trước
  },

  // Món nướng
  {
    title: "Thịt Nướng BBQ",
    price: 85000,
    description: "Thịt nướng BBQ với sốt đặc biệt, ăn kèm rau sống",
    ratingsAverage: 4.6,
    ratingsQuantity: 143,
    inventory: 18,
    images: [
      "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=500",
    ],
    origin: "Mỹ",
    ingredients: "Thịt heo, sốt BBQ, rau sống, bánh mì",
    weight: 500,
    shelfLife: "1 ngày",
    storage: "Bảo quản lạnh",
    calories: 450,
    nutrition: "Protein: 35g, Carbs: 20g, Fat: 25g",
    allergen: "Gluten",
    demand: "Bữa tối, tiệc",
    createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000), // 13 ngày trước
  },
  {
    title: "Cá Nướng Lá Chuối",
    price: 95000,
    description: "Cá nướng trong lá chuối với gia vị đặc biệt",
    ratingsAverage: 4.4,
    ratingsQuantity: 89,
    inventory: 12,
    images: ["https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=500"],
    origin: "Việt Nam",
    ingredients: "Cá tươi, lá chuối, gia vị, rau thơm",
    weight: 600,
    shelfLife: "1 ngày",
    storage: "Bảo quản lạnh",
    calories: 380,
    nutrition: "Protein: 40g, Carbs: 15g, Fat: 18g",
    allergen: "Cá",
    demand: "Bữa tối, tiệc",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 ngày trước
  },

  // Thêm một số món mới (để test filter "Mới")
  {
    title: "Bánh Mì Pate Nóng",
    price: 30000,
    description: "Bánh mì pate nóng giòn với pate thơm ngon",
    ratingsAverage: 4.3,
    ratingsQuantity: 45,
    inventory: 50,
    images: [
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500",
    ],
    origin: "Việt Nam",
    ingredients: "Bánh mì, pate, rau thơm, dưa leo",
    weight: 200,
    shelfLife: "2 giờ",
    storage: "Bảo quản nóng",
    calories: 280,
    nutrition: "Protein: 12g, Carbs: 35g, Fat: 8g",
    allergen: "Gluten, Thịt",
    demand: "Bữa sáng, bữa trưa",
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 giờ trước (MỚI)
  },
  {
    title: "Sinh Tố Bơ",
    price: 32000,
    description: "Sinh tố bơ thơm ngon, bổ dưỡng",
    ratingsAverage: 4.5,
    ratingsQuantity: 67,
    inventory: 40,
    images: [
      "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=500",
    ],
    origin: "Việt Nam",
    ingredients: "Bơ, sữa tươi, đá viên, đường",
    weight: 350,
    shelfLife: "2 giờ",
    storage: "Bảo quản lạnh",
    calories: 220,
    nutrition: "Protein: 6g, Carbs: 25g, Fat: 12g",
    allergen: "Sữa",
    demand: "Mọi thời điểm",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 giờ trước (MỚI)
  },

  // Thêm một số món khác để có đủ dữ liệu test
  {
    title: "Bánh Xèo Giòn Rụm",
    price: 40000,
    description: "Bánh xèo giòn rụm với tôm thịt và rau sống",
    ratingsAverage: 4.4,
    ratingsQuantity: 89,
    inventory: 35,
    images: ["https://images.unsplash.com/photo-1559847844-5315695dadae?w=500"],
    origin: "Việt Nam",
    ingredients: "Bột gạo, tôm, thịt, giá đỗ, rau sống",
    weight: 300,
    shelfLife: "2 giờ",
    storage: "Bảo quản nóng",
    calories: 320,
    nutrition: "Protein: 18g, Carbs: 35g, Fat: 12g",
    allergen: "Tôm, Thịt",
    demand: "Bữa trưa, bữa tối",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 ngày trước
  },
  {
    title: "Nem Nướng Nha Trang",
    price: 45000,
    description: "Nem nướng Nha Trang với bánh tráng và rau sống",
    ratingsAverage: 4.6,
    ratingsQuantity: 134,
    inventory: 28,
    images: [
      "https://images.unsplash.com/photo-1563379091339-03246963d4d4?w=500",
    ],
    origin: "Việt Nam",
    ingredients: "Thịt heo, bánh tráng, rau sống, nước mắm",
    weight: 280,
    shelfLife: "1 ngày",
    storage: "Bảo quản lạnh",
    calories: 280,
    nutrition: "Protein: 22g, Carbs: 25g, Fat: 10g",
    allergen: "Cá",
    demand: "Bữa trưa, bữa tối",
    createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000), // 16 ngày trước
  },
  {
    title: "Lẩu Thái",
    price: 180000,
    promotion: 150000,
    description: "Lẩu Thái chua cay với hải sản tươi ngon",
    ratingsAverage: 4.8,
    ratingsQuantity: 156,
    inventory: 8,
    images: ["https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=500"],
    origin: "Thái Lan",
    ingredients: "Hải sản, rau củ, nước dùng Thái, gia vị",
    weight: 800,
    shelfLife: "1 ngày",
    storage: "Bảo quản lạnh",
    calories: 450,
    nutrition: "Protein: 35g, Carbs: 30g, Fat: 20g",
    allergen: "Hải sản",
    demand: "Bữa tối, tiệc",
    createdAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000), // 17 ngày trước
  },
];

// Seed products
const seedProducts = async () => {
  try {
    console.log("🌱 Starting to seed restaurant products...");

    // Clear existing products
    await Product.deleteMany({});
    console.log("🗑️ Cleared existing products");

    // Insert new products
    const products = await Product.insertMany(restaurantProducts);
    console.log(`✅ Successfully seeded ${products.length} products`);

    // Show statistics
    console.log("\n📊 Product Statistics:");
    console.log(`   Total products: ${products.length}`);

    // Show products with promotions
    const promoProducts = products.filter((p) => p.promotion);
    console.log(`   Products on sale: ${promoProducts.length}`);

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
      console.log(
        `   - ${product.title}: ${priceText} [${product.ratingsAverage}⭐]`
      );
    });

    // Show products with promotions
    console.log(`\n🎉 Products on sale:`);
    promoProducts.forEach((product) => {
      const discount = Math.round(
        (1 - product.promotion / product.price) * 100
      );
      console.log(
        `   - ${
          product.title
        }: ${discount}% off (${product.promotion.toLocaleString()}đ)`
      );
    });

    // Show new products (created in last 24 hours)
    const newProducts = products.filter(
      (p) => new Date(p.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    console.log(`\n🆕 New products (last 24h): ${newProducts.length}`);
    newProducts.forEach((product) => {
      console.log(`   - ${product.title}: ${product.price.toLocaleString()}đ`);
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
