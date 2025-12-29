const mongoose = require("mongoose");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Brand = require("../models/brandModel");
const Review = require("../models/reviewModel");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const path = require("path");

// Helper function for async error handling
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Helper function for creating errors
const AppError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
  return error;
};

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new AppError("Only image files are allowed!", 400), false);
    }
  },
});

// Allow optional file uploads for updates
const uploadFiles = upload.fields([{ name: "images", maxCount: 5 }]);

// Helper function to convert category name to ObjectId
const getCategoryId = async (categoryInput) => {
  // If it's already an ObjectId, return it
  if (
    mongoose.Types.ObjectId.isValid(categoryInput) &&
    categoryInput.length === 24
  ) {
    return categoryInput;
  }

  // If it's a string (category name), find or create the category
  if (typeof categoryInput === "string" && categoryInput.trim()) {
    let category = await Category.findOne({ name: categoryInput.trim() });

    if (!category) {
      // Create new category if it doesn't exist
      category = await Category.create({ name: categoryInput.trim() });
    }

    return category._id;
  }

  return null;
};

exports.uploadProductImages = (req, res, next) => {
  uploadFiles(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return next(new AppError("Vượt quá số lượng file quy định.", 400));
      }
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(new AppError("Kích thước file quá lớn (tối đa 5MB).", 400));
      }
    } else if (err) {
      // Nếu không có file upload (update không có ảnh mới), cho phép tiếp tục
      if (err.message && err.message.includes("Unexpected field")) {
        return next(new AppError("Trường file không hợp lệ.", 400));
      }
      // Cho phép request không có file (update chỉ giá, không có ảnh)
      if (!req.files || !req.files.images) {
        if (req.body.promotion == "") req.body.promotion = req.body.price;
        return next();
      }
      return next(new AppError("Upload thất bại.", 400));
    }
    if (req.body.promotion == "") req.body.promotion = req.body.price;
    next();
  });
};

exports.resizeProductImages = catchAsync(async (req, res, next) => {
  let images = [];

  // Handle uploaded files
  if (req.files && req.files.images && Array.isArray(req.files.images)) {
    for (const file of req.files.images) {
      try {
        // Kiểm tra file.path tồn tại trước khi upload
        if (file.path) {
          const result = await cloudinary.uploader.upload(file.path);
          if (result && result.url) {
            images.push(result.url);
          }
        }
      } catch (error) {
        console.error("Error uploading image to Cloudinary:", error);
        // Không throw error, chỉ log để không block update product
      }
    }
  }

  // Handle URL images
  if (req.body.urlImages) {
    try {
      const urlImages = JSON.parse(req.body.urlImages);
      if (Array.isArray(urlImages)) {
        images = [...images, ...urlImages];
      }
    } catch (error) {
      console.error("Error parsing URL images:", error);
    }
  }

  // Only update images if we have new images
  // Nếu không có ảnh mới, giữ nguyên ảnh cũ (không update req.body.images)
  if (images.length > 0) {
    req.body.images = images;
  }

  next();
});

exports.deleteImageCloud = catchAsync(async (req, res, next) => {
  // Chỉ xóa ảnh cũ khi có ảnh mới được upload
  // Nếu không có ảnh mới (update chỉ giá, không có ảnh), giữ nguyên ảnh cũ
  if (
    !req.files ||
    !req.files.images ||
    !Array.isArray(req.files.images) ||
    req.files.images.length === 0
  ) {
    // Không có ảnh mới, giữ nguyên ảnh cũ
    return next();
  }

  // Có ảnh mới, xóa ảnh cũ
  try {
    const product = await Product.findById(req.params.id);

    // Delete image from cloudinary
    if (product && product.images && Array.isArray(product.images)) {
      for (const imageURL of product.images) {
        try {
          // Extract public_id from Cloudinary URL
          // Format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
          const urlParts = imageURL.split("/");
          const publicIdWithExt = urlParts[urlParts.length - 1];
          const publicId = publicIdWithExt.split(".")[0];

          if (publicId) {
            await cloudinary.uploader.destroy(publicId);
          }
        } catch (error) {
          console.error("Error deleting image from Cloudinary:", error);
          // Không throw error, chỉ log để không block update product
        }
      }
    }
  } catch (error) {
    console.error("Error in deleteImageCloud:", error);
    // Không throw error, chỉ log để không block update product
  }

  next();
});

exports.aliasTopProducts = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields =
    "name,price,priceDiscount,ratingsAverage,title,images,description,promotion,ratingsQuantity";
  next();
};

// Generic CRUD operations
exports.getAllProducts = catchAsync(async (req, res, next) => {
  // Build query
  const queryObj = { ...req.query };
  const excludedFields = ["page", "sort", "limit", "fields", "search"];
  excludedFields.forEach((el) => delete queryObj[el]);

  // Support filter by restaurant ObjectId (for Restaurant Dashboard)
  if (req.query.restaurant) {
    queryObj.restaurant = req.query.restaurant;
  }

  // Advanced filtering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

  let baseQuery = JSON.parse(queryStr);

  // Search functionality
  if (req.query.search) {
    console.log("🔍 Search query:", req.query.search);
    const searchRegex = new RegExp(req.query.search, "i"); // Case insensitive search
    baseQuery = {
      ...baseQuery,
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { name: searchRegex },
      ],
    };
    console.log("🔍 Search regex:", searchRegex);
  }

  // Get total count before pagination
  const total = await Product.countDocuments(baseQuery);

  let query = Product.find(baseQuery);

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  // Field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(",").join(" ");
    query = query.select(fields);
  }

  // Pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 100;
  const skip = (page - 1) * limit;

  query = query.skip(skip).limit(limit);

  const products = await query;

  console.log("🔍 Search results:", products.length, "products found");
  if (req.query.search && products.length > 0) {
    console.log("🔍 First result:", products[0].title || products[0].name);
  }

  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    status: "success",
    results: products.length,
    total,
    totalPages,
    currentPage: page,
    limit,
    data: {
      products,
    },
  });
});

exports.getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate("reviews");

  if (!product) {
    return next(new AppError("No product found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      product,
    },
  });
});

exports.createProduct = catchAsync(async (req, res, next) => {
  // Convert category name to ObjectId if needed
  if (req.body.category) {
    const categoryId = await getCategoryId(req.body.category);
    if (categoryId) {
      req.body.category = categoryId;
    } else {
      delete req.body.category; // Remove invalid category
    }
  }

  const newProduct = await Product.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      product: newProduct,
    },
  });
});

exports.updateProduct = catchAsync(async (req, res, next) => {
  try {
    // Convert category name to ObjectId if needed
    if (req.body.category) {
      const categoryId = await getCategoryId(req.body.category);
      if (categoryId) {
        req.body.category = categoryId;
      } else {
        delete req.body.category; // Remove invalid category
      }
    }

    // Xử lý promotion: nếu promotion rỗng hoặc null, set thành null
    if (
      req.body.promotion === "" ||
      req.body.promotion === null ||
      req.body.promotion === undefined
    ) {
      req.body.promotion = null;
    }

    // Xử lý price: đảm bảo là số
    if (req.body.price !== undefined) {
      req.body.price = Number(req.body.price);
      if (isNaN(req.body.price) || req.body.price <= 0) {
        return next(new AppError("Giá sản phẩm phải là số dương", 400));
      }
    }

    // Xử lý promotion: đảm bảo là số và nhỏ hơn price
    if (req.body.promotion !== null && req.body.promotion !== undefined) {
      req.body.promotion = Number(req.body.promotion);
      if (isNaN(req.body.promotion)) {
        req.body.promotion = null;
      } else if (req.body.price && req.body.promotion >= req.body.price) {
        return next(new AppError("Giá khuyến mãi phải nhỏ hơn giá gốc", 400));
      }
    }

    // Xử lý inventory/stock
    if (req.body.stock !== undefined) {
      req.body.inventory = Number(req.body.stock) || 0;
      delete req.body.stock; // Remove stock field, use inventory instead
    }

    // Tìm product hiện tại để giữ nguyên các field không được update
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return next(new AppError("Không tìm thấy sản phẩm với ID này", 404));
    }

    // Nếu title không thay đổi, không update title để tránh lỗi unique constraint
    if (req.body.title && req.body.title === existingProduct.title) {
      delete req.body.title;
    }

    // Nếu không có ảnh mới, giữ nguyên ảnh cũ
    if (
      !req.body.images ||
      !Array.isArray(req.body.images) ||
      req.body.images.length === 0
    ) {
      delete req.body.images; // Không update images nếu không có ảnh mới
    }

    // Update product với validation
    // Sử dụng findOneAndUpdate với upsert: false để tránh lỗi unique khi update
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      {
        new: true,
        runValidators: true,
        upsert: false,
      }
    );

    if (!product) {
      return next(new AppError("Không tìm thấy sản phẩm với ID này", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        product,
      },
    });
  } catch (error) {
    // Xử lý lỗi validation từ Mongoose
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return next(new AppError(messages.join(", "), 400));
    }

    // Xử lý lỗi duplicate key (unique constraint)
    if (error.code === 11000) {
      return next(new AppError("Tên sản phẩm đã tồn tại", 400));
    }

    // Lỗi khác
    console.error("[updateProduct] Error:", error);
    return next(
      new AppError(error.message || "Cập nhật sản phẩm thất bại", 500)
    );
  }
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return next(new AppError("No product found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getTableProduct = catchAsync(async (req, res, next) => {
  const products = await Product.find().select(
    "-description -ingredients -nutrition"
  );

  res.status(200).json({
    status: "success",
    results: products.length,
    data: {
      products,
    },
  });
});

// Category operations
exports.getAllCategories = catchAsync(async (req, res, next) => {
  const categories = await Category.find();

  res.status(200).json({
    status: "success",
    results: categories.length,
    data: {
      categories,
    },
  });
});

exports.createCategory = catchAsync(async (req, res, next) => {
  const newCategory = await Category.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      category: newCategory,
    },
  });
});

// Brand operations
exports.getAllBrands = catchAsync(async (req, res, next) => {
  const brands = await Brand.find();

  res.status(200).json({
    status: "success",
    results: brands.length,
    data: {
      brands,
    },
  });
});

exports.createBrand = catchAsync(async (req, res, next) => {
  const newBrand = await Brand.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      brand: newBrand,
    },
  });
});

// Inventory operations
exports.checkInventory = catchAsync(async (req, res, next) => {
  const { products } = req.body;

  if (!products || !Array.isArray(products)) {
    return next(new AppError("Products array is required", 400));
  }

  const results = [];
  let allAvailable = true;

  for (const item of products) {
    const product = await Product.findById(item.id);

    if (!product) {
      results.push({
        id: item.id,
        success: false,
        message: "Product not found",
      });
      allAvailable = false;
      continue;
    }

    if (product.inventory < item.quantity) {
      results.push({
        id: item.id,
        success: false,
        message: `Insufficient inventory. Available: ${product.inventory}, Requested: ${item.quantity}`,
        available: product.inventory,
        requested: item.quantity,
      });
      allAvailable = false;
    } else {
      results.push({
        id: item.id,
        success: true,
        available: product.inventory,
        requested: item.quantity,
      });
    }
  }

  // Build detailed error message for products with insufficient inventory
  const failedProducts = results.filter((r) => !r.success);
  let errorMessage = "Some products have insufficient inventory";

  if (failedProducts.length > 0) {
    // Get product names for failed products
    const productInfo = [];
    for (const item of failedProducts) {
      const product = await Product.findById(item.id);
      if (product) {
        productInfo.push({
          name: product.title,
          available: item.available,
          requested: item.requested,
        });
      }
    }

    if (productInfo.length > 0) {
      const productNames = productInfo.map((p) => p.name).join(", ");
      errorMessage = `Sản phẩm không đủ tồn kho: ${productNames}. `;
      productInfo.forEach((info) => {
        errorMessage += `${info.name}: Còn ${info.available}, Yêu cầu ${info.requested}. `;
      });
    }
  }

  res.status(200).json({
    success: allAvailable,
    message: allAvailable
      ? "All products have sufficient inventory"
      : errorMessage,
    results,
    failedProducts: failedProducts.map((item) => ({
      id: item.id,
      message: item.message,
      available: item.available,
      requested: item.requested,
    })),
  });
});

exports.updateInventory = catchAsync(async (req, res, next) => {
  const { products, operation = "decrease" } = req.body;

  if (!products || !Array.isArray(products)) {
    return next(new AppError("Products array is required", 400));
  }

  const results = [];
  let allUpdated = true;

  for (const item of products) {
    const product = await Product.findById(item.id);

    if (!product) {
      results.push({
        id: item.id,
        success: false,
        message: "Product not found",
      });
      allUpdated = false;
      continue;
    }

    if (operation === "decrease") {
      if (product.inventory < item.quantity) {
        results.push({
          id: item.id,
          success: false,
          message: "Insufficient inventory",
          available: product.inventory,
          requested: item.quantity,
        });
        allUpdated = false;
        continue;
      }
      product.inventory -= item.quantity;
    } else if (operation === "increase") {
      product.inventory += item.quantity;
    }

    await product.save();

    results.push({
      id: item.id,
      success: true,
      newInventory: product.inventory,
      operation,
    });
  }

  res.status(200).json({
    success: allUpdated,
    message: allUpdated
      ? "Inventory updated successfully"
      : "Some inventory updates failed",
    results,
  });
});
