const MenuItem = require("../models/menuItemModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// @desc    Get all menu items for restaurant
// @route   GET /api/restaurant/menu
// @access  Private
exports.getMenuItems = catchAsync(async (req, res, next) => {
  const { search, category, status, sort, page = 1, limit = 10 } = req.query;

  // Build query
  const query = { restaurantId: req.restaurant.id };

  if (search) {
    query.$text = { $search: search };
  }

  if (category) {
    query.category = category;
  }

  if (status) {
    query.status = status;
  }

  // Pagination
  const skip = (page - 1) * limit;

  // Sorting
  let sortBy = "-createdAt";
  if (sort) {
    sortBy = sort.split(",").join(" ");
  }

  const menuItems = await MenuItem.find(query)
    .sort(sortBy)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await MenuItem.countDocuments(query);

  res.status(200).json({
    status: "success",
    results: menuItems.length,
    data: {
      menuItems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// @desc    Get single menu item
// @route   GET /api/restaurant/menu/:id
// @access  Private
exports.getMenuItem = catchAsync(async (req, res, next) => {
  const menuItem = await MenuItem.findOne({
    _id: req.params.id,
    restaurantId: req.restaurant.id,
  });

  if (!menuItem) {
    return next(new AppError("Menu item not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      menuItem,
    },
  });
});

// @desc    Create menu item
// @route   POST /api/restaurant/menu
// @access  Private
exports.createMenuItem = catchAsync(async (req, res, next) => {
  const {
    title,
    description,
    price,
    promotion,
    category,
    images,
    stock,
    status,
  } = req.body;

  const menuItem = await MenuItem.create({
    restaurantId: req.restaurant.id,
    title,
    description,
    price,
    promotion,
    category,
    images,
    stock,
    status,
  });

  res.status(201).json({
    status: "success",
    data: {
      menuItem,
    },
  });
});

// @desc    Update menu item
// @route   PUT /api/restaurant/menu/:id
// @access  Private
exports.updateMenuItem = catchAsync(async (req, res, next) => {
  const {
    title,
    description,
    price,
    promotion,
    category,
    images,
    stock,
    status,
  } = req.body;

  const menuItem = await MenuItem.findOneAndUpdate(
    {
      _id: req.params.id,
      restaurantId: req.restaurant.id,
    },
    {
      title,
      description,
      price,
      promotion,
      category,
      images,
      stock,
      status,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!menuItem) {
    return next(new AppError("Menu item not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      menuItem,
    },
  });
});

// @desc    Delete menu item
// @route   DELETE /api/restaurant/menu/:id
// @access  Private
exports.deleteMenuItem = catchAsync(async (req, res, next) => {
  const menuItem = await MenuItem.findOneAndDelete({
    _id: req.params.id,
    restaurantId: req.restaurant.id,
  });

  if (!menuItem) {
    return next(new AppError("Menu item not found", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// @desc    Update stock
// @route   PATCH /api/restaurant/menu/:id/stock
// @access  Private
exports.updateStock = catchAsync(async (req, res, next) => {
  const { stock } = req.body;

  const menuItem = await MenuItem.findOneAndUpdate(
    {
      _id: req.params.id,
      restaurantId: req.restaurant.id,
    },
    { stock },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!menuItem) {
    return next(new AppError("Menu item not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      menuItem,
    },
  });
});

