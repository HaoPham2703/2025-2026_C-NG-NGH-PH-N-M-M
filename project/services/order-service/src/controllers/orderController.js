const Order = require("../models/orderModel");
const AppError = require("../utils/appError");
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
const axios = require("axios");

// Auto-assign available drone to order
// Uses API Gateway for consistent routing and authentication
const autoAssignDroneToOrder = async (orderId) => {
  try {
    const apiGatewayUrl =
      process.env.API_GATEWAY_URL || "http://localhost:5001";

    // 1. Get available drones via API Gateway
    const availableDronesResponse = await axios.get(
      `${apiGatewayUrl}/api/v1/drones/available`,
      {
        timeout: 3000,
        // Optional: Add service-to-service authentication token if needed
        // headers: {
        //   'Authorization': `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}`
        // }
      }
    );

    // Handle different response structures from API Gateway
    const availableDrones =
      availableDronesResponse.data?.data?.data ||
      availableDronesResponse.data?.data ||
      [];

    if (availableDrones.length === 0) {
      console.log(`[autoAssignDrone] No available drones for order ${orderId}`);
      return null;
    }

    // 2. Select first available drone
    const selectedDrone = availableDrones[0];

    // 3. Assign drone to order via API Gateway
    const assignResponse = await axios.post(
      `${apiGatewayUrl}/api/v1/drones/assign`,
      {
        droneId: selectedDrone.droneId,
        orderId: orderId,
      },
      {
        timeout: 5000,
        // Optional: Add service-to-service authentication token if needed
        // headers: {
        //   'Authorization': `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}`
        // }
      }
    );

    console.log(
      `[autoAssignDrone] Successfully assigned drone ${selectedDrone.droneId} to order ${orderId}`
    );
    return assignResponse.data;
  } catch (error) {
    console.error(
      `[autoAssignDrone] Error assigning drone to order ${orderId}:`,
      error.message
    );
    console.error(`[autoAssignDrone] Error details:`, {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    throw error;
  }
};

// Helper function for async error handling
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
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
  if (!req.body.user) {
    // Handle both _id and id fields from API Gateway user object
    req.body.user = req.user._id || req.user.id;
  }
  next();
};

exports.createOrder = catchAsync(async (req, res, next) => {
  // Check inventory before creating order
  const inventoryCheck = await checkInventory(req.body.cart);
  if (!inventoryCheck.success) {
    return next(new AppError(inventoryCheck.message, 400));
  }

  // Extract restaurant ID from cart products (first product's restaurant)
  // Cart structure: [{ product: { restaurant, restaurantId, ... }, quantity }]
  let restaurantId = req.body.restaurant;
  if (!restaurantId && req.body.cart && req.body.cart.length > 0) {
    const firstProduct = req.body.cart[0].product;
    restaurantId = firstProduct?.restaurant || firstProduct?.restaurantId;
  }

  // Create order with restaurant ID
  const orderData = {
    ...req.body,
    restaurant: restaurantId,
  };
  const newOrder = await Order.create(orderData);

  // Update inventory
  const inventoryUpdate = await updateInventory(req.body.cart, "decrease");
  if (!inventoryUpdate.success) {
    // Rollback order if inventory update fails
    await Order.findByIdAndDelete(newOrder._id);
    return next(new AppError("Failed to update inventory", 500));
  }

  // Send order created event
  await sendOrderCreated(newOrder);

  // Auto-assign drone if order status is Delivery or Waiting Goods
  if (newOrder.status === "Delivery" || newOrder.status === "Waiting Goods") {
    try {
      await autoAssignDroneToOrder(newOrder._id.toString());
    } catch (error) {
      console.error(
        "Auto-assign drone failed on order creation:",
        error.message
      );
      // Don't fail the order creation if drone assignment fails
    }
  }

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
  const excludedFields = [
    "page",
    "sort",
    "limit",
    "fields",
    "queryKey",
    "signal",
  ];
  excludedFields.forEach((el) => delete queryObj[el]);

  // Filter orders by current user (unless admin)
  if (req.user) {
    const userId = req.user._id || req.user.id || req.user.userId;

    // Log for debugging
    console.log("[getAllOrders] User info:", {
      hasUser: !!req.user,
      userId: userId,
      userRole: req.user.role,
      userObject: req.user,
    });

    // Only show orders for current user unless they are admin
    if (req.user.role !== "admin" && userId) {
      queryObj.user = userId;
      console.log("[getAllOrders] Filtering orders for user:", userId);
    } else if (!userId) {
      console.warn("[getAllOrders] User ID not found in req.user");
    }
  } else {
    console.warn("[getAllOrders] req.user is not defined");
    // If no user, return empty results
    return res.status(200).json({
      status: "success",
      results: 0,
      data: {
        orders: [],
      },
    });
  }

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
  // Handle both _id and id fields from API Gateway user object
  const userId = req.user._id || req.user.id;
  if (
    order.user.toString() !== userId.toString() &&
    req.user.role !== "admin"
  ) {
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

// ===== NEW METHODS FOR ENHANCED ORDER MANAGEMENT =====

// Update order status specifically
exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;

  if (!status) {
    return next(new AppError("Status is required", 400));
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  const oldStatus = order.status;

  // Check if status change is allowed
  if (order.status === "Cancelled" || order.status === "Success") {
    return next(new AppError(`Order is already ${order.status}`, 400));
  }

  // Handle inventory restoration for cancelled orders
  if (status === "Cancelled") {
    const inventoryUpdate = await updateInventory(order.cart, "increase");
    if (!inventoryUpdate.success) {
      return next(new AppError("Failed to restore inventory", 500));
    }
  }

  order.status = status;
  await order.save();

  // Auto-assign drone when order status changes to Delivery or Waiting Goods
  if (
    (status === "Delivery" || status === "Waiting Goods") &&
    oldStatus !== status
  ) {
    try {
      await autoAssignDroneToOrder(order._id.toString());
    } catch (error) {
      console.error("Auto-assign drone failed:", error.message);
      // Don't fail the order status update if drone assignment fails
    }
  }

  // Send appropriate events
  if (status === "Cancelled") {
    await sendOrderCancelled(order);
  } else if (status === "Success") {
    await sendOrderCompleted(order);
  } else if (oldStatus !== status) {
    await sendOrderStatusChanged(order, oldStatus, status);
  }

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
    message: `Order status updated to ${status}`,
  });
});

// Assign delivery person to order
exports.assignDeliveryPerson = catchAsync(async (req, res, next) => {
  const { deliveryPersonId, deliveryPersonName } = req.body;

  if (!deliveryPersonId) {
    return next(new AppError("Delivery person ID is required", 400));
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  // Check if order can be assigned
  if (order.status === "Cancelled" || order.status === "Success") {
    return next(
      new AppError(`Cannot assign delivery to ${order.status} order`, 400)
    );
  }

  order.deliveryPerson = {
    id: deliveryPersonId,
    name: deliveryPersonName || "Unknown Driver",
  };

  // Update status to "In Delivery" if not already assigned
  if (order.status === "Processed") {
    order.status = "In Delivery";
  }

  await order.save();

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
    message: "Delivery person assigned successfully",
  });
});

// Get orders by user ID
exports.getOrdersByUserId = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  // Build query with user filter
  const queryObj = { user: userId, ...req.query };
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
    message: `Found ${orders.length} orders for user ${userId}`,
  });
});

// Get orders by restaurant ID
exports.getOrdersByRestaurantId = catchAsync(async (req, res, next) => {
  const { restaurantId } = req.params;

  // Build query with restaurant filter
  const queryObj = { restaurant: restaurantId, ...req.query };
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
    message: `Found ${orders.length} orders for restaurant ${restaurantId}`,
  });
});

// Get orders by delivery person ID
exports.getOrdersByDeliveryPersonId = catchAsync(async (req, res, next) => {
  const { deliveryPersonId } = req.params;

  // Build query with delivery person filter
  const queryObj = { "deliveryPerson.id": deliveryPersonId, ...req.query };
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
    message: `Found ${orders.length} orders for delivery person ${deliveryPersonId}`,
  });
});
