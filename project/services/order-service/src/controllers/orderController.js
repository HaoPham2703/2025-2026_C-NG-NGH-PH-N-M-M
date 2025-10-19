const Order = require("../models/orderModel");
const {
  checkInventory,
  updateInventory,
} = require("../services/inventoryService");
const {
  sendOrderCreated,
  sendOrderStatusChanged,
  sendOrderCancelled,
  sendOrderCompleted,
} = require("../events/orderEvents");
const moment = require("moment");

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

exports.checkStatusOrder = catchAsync(async (req, res, next) => {
  if (
    req.user.role == "user" &&
    ((req.body.status == "Cancelled" && req.order.status != "Processed") ||
      req.body.status != "Cancelled")
  ) {
    return next(new AppError("Bạn không có quyền thực hiện.", 403));
  }
  if (req.order.status == "Cancelled" || req.order.status == "Success") {
    return next(new AppError(`Đơn hàng nãy đã ${req.order.status}`, 403));
  }
  next();
});

exports.setUser = (req, res, next) => {
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.createOrder = catchAsync(async (req, res, next) => {
  // Check inventory before creating order
  const inventoryCheck = await checkInventory(req.body.cart);
  if (!inventoryCheck.success) {
    return next(new AppError(inventoryCheck.message, 400));
  }

  // Create order
  const newOrder = await Order.create(req.body);

  // Update inventory
  const inventoryUpdate = await updateInventory(req.body.cart, "decrease");
  if (!inventoryUpdate.success) {
    // Rollback order if inventory update fails
    await Order.findByIdAndDelete(newOrder._id);
    return next(new AppError("Failed to update inventory", 500));
  }

  // Send order created event
  await sendOrderCreated(newOrder);

  res.status(201).json({
    status: "success",
    data: {
      order: newOrder,
    },
  });
});

exports.getOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError("Không tìm thấy đơn hàng với ID này", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

exports.getAllOrders = catchAsync(async (req, res, next) => {
  // Build query
  const queryObj = { ...req.query };
  const excludedFields = ["page", "sort", "limit", "fields"];
  excludedFields.forEach((el) => delete queryObj[el]);

  // Advanced filtering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

  let query = Order.find(JSON.parse(queryStr));

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

  const orders = await query;

  res.status(200).json({
    status: "success",
    results: orders.length,
    data: {
      orders,
    },
  });
});

exports.updateOrder = catchAsync(async (req, res, next) => {
  const oldStatus = req.order.status;
  const newStatus = req.body.status;

  if (req.body.status == "Cancelled") {
    // Restore inventory when order is cancelled
    const inventoryUpdate = await updateInventory(req.order.cart, "increase");
    if (!inventoryUpdate.success) {
      return next(new AppError("Failed to restore inventory", 500));
    }
  }

  const updatedOrder = await Order.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updatedOrder) {
    return next(new AppError("Không tìm thấy đơn hàng với ID này", 404));
  }

  // Send appropriate events
  if (newStatus === "Cancelled") {
    await sendOrderCancelled(updatedOrder);
  } else if (newStatus === "Success") {
    await sendOrderCompleted(updatedOrder);
  } else if (oldStatus !== newStatus) {
    await sendOrderStatusChanged(updatedOrder, oldStatus, newStatus);
  }

  res.status(200).json({
    status: "success",
    data: {
      order: updatedOrder,
    },
  });
});

exports.deleteOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findByIdAndDelete(req.params.id);

  if (!order) {
    return next(new AppError("Không tìm thấy đơn hàng với ID này", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.isOwner = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError("Không tìm thấy đơn hàng với ID này", 404));
  }

  // Check if user is owner or admin
  if (order.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new AppError("Bạn không có quyền truy cập đơn hàng này", 403));
  }

  req.order = order;
  next();
});

exports.getTableOrder = catchAsync(async (req, res, next) => {
  const orders = await Order.find().populate("user", "name email");

  res.status(200).json({
    status: "success",
    results: orders.length,
    data: {
      orders,
    },
  });
});

// Analytics endpoints
exports.countStatus = catchAsync(async (req, res, next) => {
  const data = await Order.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  res.status(200).json(data);
});

exports.countStatusOption = catchAsync(async (req, res, next) => {
  const option = {
    status: "$status",
  };
  if (req.body.year) option.year = { $year: "$createdAt" };
  if (req.body.month) option.month = { $month: "$createdAt" };
  if (req.body.week) option.week = { $week: "$createdAt" };
  if (req.body.date) option.date = { $dayOfWeek: "$createdAt" };
  const data = await Order.aggregate([
    {
      $group: {
        _id: option,
        count: { $sum: 1 },
      },
    },
  ]);
  res.status(200).json(data);
});

exports.sumRevenueOption = catchAsync(async (req, res, next) => {
  const option = {};
  if (req.body.year) option.year = { $year: "$createdAt" };
  if (req.body.month) option.month = { $month: "$createdAt" };
  if (req.body.week) option.week = { $week: "$createdAt" };
  if (req.body.date) option.date = { $dayOfWeek: "$createdAt" };
  const data = await Order.aggregate([
    {
      $match: { status: "Success" },
    },
    {
      $group: {
        _id: option,
        total_revenue: { $sum: "$totalPrice" },
      },
    },
  ]);
  res.status(200).json(data);
});

exports.sumRevenue = catchAsync(async (req, res, next) => {
  const data = await Order.aggregate([
    {
      $match: { status: "Success" },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        total_revenue_month: { $sum: "$totalPrice" },
      },
    },
  ]);
  res.status(200).json(data);
});

exports.topProduct = catchAsync(async (req, res, next) => {
  const option = {
    product: "$cart.product.id",
  };
  if (req.body.year) option.year = { $year: "$createdAt" };
  if (req.body.month) option.month = { $month: "$createdAt" };
  if (req.body.week) option.week = { $week: "$createdAt" };
  if (req.body.date) option.date = { $dayOfWeek: "$createdAt" };

  const data = await Order.aggregate([
    {
      $unwind: "$cart",
    },
    {
      $match: { status: "Success" },
    },
    {
      $group: {
        _id: option,
        quantity: { $sum: "$cart.quantity" },
        title: { $first: "$cart.product.title" },
        image: { $first: "$cart.product.images" },
      },
    },
    { $sort: { quantity: -1 } },
    { $limit: 5 },
  ]);
  res.status(200).json(data);
});

exports.countStatusInRange = catchAsync(async (req, res, next) => {
  const dateFrom = req.body.dateFrom;
  const dateTo = req.body.dateTo;
  const option = {
    status: "$status",
  };
  let dateStart = new Date(dateFrom);
  let dateEnd = new Date(dateTo);
  dateStart.setUTCHours(0, 0, 0, 0);
  dateEnd.setUTCHours(23, 59, 59, 999);
  const data = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: moment.utc(dateStart).toDate(),
          $lt: moment.utc(dateEnd).toDate(),
        },
      },
    },
    {
      $group: {
        _id: option,
        count: { $sum: 1 },
      },
    },
  ]);
  res.status(200).json(data);
});

exports.topProductInRange = catchAsync(async (req, res, next) => {
  const option = {
    product: "$cart.product.id",
  };
  const dateFrom = req.body.dateFrom;
  const dateTo = req.body.dateTo;
  let dateStart = new Date(dateFrom);
  let dateEnd = new Date(dateTo);
  dateStart.setUTCHours(0, 0, 0, 0);
  dateEnd.setUTCHours(23, 59, 59, 999);
  const data = await Order.aggregate([
    {
      $unwind: "$cart",
    },
    {
      $match: {
        status: "Success",
        createdAt: {
          $gte: moment.utc(dateStart).toDate(),
          $lt: moment.utc(dateEnd).toDate(),
        },
      },
    },
    {
      $group: {
        _id: option,
        quantity: { $sum: "$cart.quantity" },
        title: { $first: "$cart.product.title" },
        image: { $first: "$cart.product.images" },
      },
    },
    { $sort: { quantity: -1 } },
    { $limit: 5 },
  ]);
  res.status(200).json(data);
});

exports.sumInRange = catchAsync(async (req, res, next) => {
  const dateFrom = req.body.dateFrom;
  const dateTo = req.body.dateTo;
  let dateStart = new Date(dateFrom);
  let dateEnd = new Date(dateTo);
  dateStart.setUTCHours(0, 0, 0, 0);
  dateEnd.setUTCHours(23, 59, 59, 999);
  const data = await Order.aggregate([
    {
      $match: {
        status: "Success",
        createdAt: {
          $gte: moment.utc(dateStart).toDate(),
          $lt: moment.utc(dateEnd).toDate(),
        },
      },
    },
    {
      $group: {
        _id: null,
        total_revenue: { $sum: "$totalPrice" },
      },
    },
  ]);
  res.status(200).json(data);
});
