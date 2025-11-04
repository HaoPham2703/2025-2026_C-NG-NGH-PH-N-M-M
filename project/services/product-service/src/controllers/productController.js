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

const uploadFiles = upload.fields([{ name: "images", maxCount: 5 }]);

exports.uploadProductImages = (req, res, next) => {
  uploadFiles(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return next(new AppError("Vượt quá số lượng file quy định.", 400));
      }
    } else if (err) {
      return next(new AppError("Upload thất bại.", 400));
    }
    if (req.body.promotion == "") req.body.promotion = req.body.price;
    next();
  });
};

exports.resizeProductImages = catchAsync(async (req, res, next) => {
  let images = [];

  // Handle uploaded files
  if (req.files && req.files.images) {
    for (const file of req.files.images) {
      const result = await cloudinary.uploader.upload(file.path);
      images.push(result.url);
    }
  }

  // Handle URL images
  if (req.body.urlImages) {
    try {
      const urlImages = JSON.parse(req.body.urlImages);
      images = [...images, ...urlImages];
    } catch (error) {
      console.error("Error parsing URL images:", error);
    }
  }

  // Only update images if we have new images
  if (images.length > 0) {
    req.body.images = images;
  }

  next();
});

exports.deleteImageCloud = catchAsync(async (req, res, next) => {
  if (
    req.body.action == "Edit" &&
    (req.files === undefined || !req.files.images)
  )
    return next();
  let product = await Product.findById(req.params.id);

  // Delete image from cloudinary
  if (product && product.images) {
    for (const imageURL of product.images) {
      const getPublicId = imageURL.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(getPublicId);
    }
  }

  next();
});

exports.aliasTopProducts = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,priceDiscount,ratingsAverage,title";
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

  let query = Product.find(JSON.parse(queryStr));

  // Search functionality
  if (req.query.search) {
    console.log("🔍 Search query:", req.query.search);
    const searchRegex = new RegExp(req.query.search, "i"); // Case insensitive search
    query = query.or([
      { title: searchRegex },
      { description: searchRegex },
      { name: searchRegex },
    ]);
    console.log("🔍 Search regex:", searchRegex);
  }

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

  res.status(200).json({
    status: "success",
    results: products.length,
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
  const newProduct = await Product.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      product: newProduct,
    },
  });
});

exports.updateProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

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

  res.status(200).json({
    success: allAvailable,
    message: allAvailable
      ? "All products have sufficient inventory"
      : "Some products have insufficient inventory",
    results,
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
