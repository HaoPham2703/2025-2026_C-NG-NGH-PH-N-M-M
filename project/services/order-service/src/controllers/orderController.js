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

// Call Payment Service to refund when order is cancelled
const processRefundOnOrderCancel = async (order) => {
  try {
    // Chỉ refund nếu đã thanh toán (không phải COD)
    if (order.payments === "tiền mặt" || !order.payments) {
      console.log(
        `[Order Service] Order ${order._id} is COD, no refund needed`
      );
      return { success: true, message: "COD order, no refund needed" };
    }

    const paymentServiceUrl =
      process.env.PAYMENT_SERVICE_URL || "http://localhost:4005";
    const apiGatewayUrl =
      process.env.API_GATEWAY_URL || "http://localhost:5001";

    // Gọi qua API Gateway hoặc trực tiếp Payment Service
    const paymentUrl = apiGatewayUrl
      ? `${apiGatewayUrl}/api/v1/payments/refund/order-cancel`
      : `${paymentServiceUrl}/api/v1/payments/refund/order-cancel`;

    console.log(
      `[Order Service] Processing refund for order ${order._id}, payment method: ${order.payments}`
    );

    const response = await axios.post(
      paymentUrl,
      {
        orderId: order._id.toString(),
        userId: order.user?.toString() || order.user,
      },
      {
        timeout: 5000,
      }
    );

    if (response.data?.status === "success" && response.data?.refunded) {
      console.log(
        `[Order Service] Refund processed successfully for order ${order._id}`
      );
      return {
        success: true,
        refunded: true,
        refundId: response.data.refundId,
        amount: response.data.amount,
      };
    } else {
      console.log(
        `[Order Service] No refund needed for order ${order._id}: ${response.data?.message}`
      );
      return {
        success: true,
        refunded: false,
        message: response.data?.message || "No payment found",
      };
    }
  } catch (error) {
    // Không throw error để không block việc hủy đơn
    // Chỉ log và tiếp tục
    console.error(
      `[Order Service] Error processing refund for order ${order._id}:`,
      error.message
    );
    return {
      success: false,
      refunded: false,
      error: error.message,
    };
  }
};

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
  const userRole = req.user.role;
  const userId = req.user._id || req.user.id;
  const newStatus = req.body.status;
  const currentStatus = req.order.status;

  console.log("[checkStatusOrder] User role:", userRole, "User ID:", userId);
  console.log("[checkStatusOrder] Attempting to change status to:", newStatus);
  console.log("[checkStatusOrder] Current order status:", currentStatus);

  // Cho phép admin và restaurant thay đổi status tự do
  if (userRole === "admin" || userRole === "restaurant") {
    console.log(
      userRole === "admin"
        ? "[checkStatusOrder] Admin access granted"
        : "[checkStatusOrder] Restaurant access granted"
    );
    // Kiểm tra xem order đã bị hủy hoặc thành công chưa
    if (currentStatus === "Cancelled" || currentStatus === "Success") {
      return next(new AppError(`Đơn hàng này đã ${currentStatus}`, 403));
    }
    return next();
  }

  // Chỉ user mới bị giới hạn:
  // - User chỉ được hủy đơn khi status = "Processed"
  // - User không được thay đổi status sang các trạng thái khác
  if (userRole === "user") {
    if (
      (newStatus === "Cancelled" && currentStatus !== "Processed") ||
      newStatus !== "Cancelled"
    ) {
      console.log(
        "[checkStatusOrder] User access denied - not allowed to change status"
      );
      return next(new AppError("Bạn không có quyền thực hiện.", 403));
    }
  }

  // Kiểm tra xem order đã bị hủy hoặc thành công chưa
  if (currentStatus === "Cancelled" || currentStatus === "Success") {
    return next(new AppError(`Đơn hàng này đã ${currentStatus}`, 403));
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
  let restaurantAddress = req.body.restaurantAddress;
  let restaurantName = req.body.restaurantName;
  
  if (!restaurantId && req.body.cart && req.body.cart.length > 0) {
    const firstProduct = req.body.cart[0].product;
    restaurantId = firstProduct?.restaurant || firstProduct?.restaurantId;
    
    // Try to extract restaurant info from product if available
    if (firstProduct?.restaurantInfo) {
      restaurantName = firstProduct.restaurantInfo.restaurantName || firstProduct.restaurantInfo.name;
      // Handle structured address
      if (firstProduct.restaurantInfo.address) {
        if (typeof firstProduct.restaurantInfo.address === 'string') {
          restaurantAddress = firstProduct.restaurantInfo.address;
        } else {
          restaurantAddress = [
            firstProduct.restaurantInfo.address.detail,
            firstProduct.restaurantInfo.address.ward,
            firstProduct.restaurantInfo.address.district,
            firstProduct.restaurantInfo.address.city
          ].filter(Boolean).join(', ');
        }
      }
    }
  }

  // Create order with restaurant ID and info
  const orderData = {
    ...req.body,
    restaurant: restaurantId,
    restaurantAddress,
    restaurantName,
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

  // Field limiting - Tối ưu: Chỉ select fields cần thiết
  if (req.query.fields) {
    const fields = req.query.fields.split(",").join(" ");
    query = query.select(fields);
  } else {
    // Chỉ select fields cần thiết cho user orders page
    query = query.select(
      "_id receiver phone address cart totalPrice payments status restaurant createdAt"
    );
  }

  // Pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 50; // Giảm limit mặc định từ 100 xuống 50
  const skip = (page - 1) * limit;

  query = query.skip(skip).limit(limit);

  // Sử dụng lean() để trả về plain object, nhanh hơn Mongoose document
  query = query.lean();

  const orders = await query;

  // Đếm tổng số orders để tính pagination
  const countQuery = Order.countDocuments(JSON.parse(queryStr));
  const totalOrders = await countQuery;

  // Tối ưu: Giảm kích thước cart data bằng cách chỉ giữ thông tin cần thiết
  const optimizedOrders = orders.map((order) => ({
    ...order,
    cart: (order.cart || []).map((item) => ({
      product: {
        _id: item.product?._id,
        title: item.product?.title || item.product?.name,
        price: item.product?.price,
        promotion: item.product?.promotion,
        images: item.product?.images ? [item.product.images[0]] : [], // Chỉ lấy 1 ảnh đầu
      },
      quantity: item.quantity,
    })),
  }));

  // Tính pagination metadata
  const totalPages = Math.ceil(totalOrders / limit);

  res.status(200).json({
    status: "success",
    results: optimizedOrders.length,
    data: {
      orders: optimizedOrders,
      pagination: {
        page,
        limit,
        total: totalOrders,
        totalPages,
      },
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

  // Process refund if order is cancelled and already paid
  if (newStatus === "Cancelled") {
    // Process refund asynchronously (don't block order cancellation)
    processRefundOnOrderCancel(updatedOrder).catch((error) => {
      console.error(
        `[Order Service] Failed to process refund for order ${updatedOrder._id}:`,
        error
      );
    });
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

  // Process refund if order is cancelled and already paid
  if (status === "Cancelled") {
    // Process refund asynchronously (don't block order cancellation)
    processRefundOnOrderCancel(order).catch((error) => {
      console.error(
        `[Order Service] Failed to process refund for order ${order._id}:`,
        error
      );
    });
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

  console.log(
    "[Order Service] getOrdersByRestaurantId - restaurantId:",
    restaurantId,
    "type:",
    typeof restaurantId
  );

  // Build query with restaurant filter - TỐI ƯU: Dùng ObjectId trực tiếp
  const mongoose = require("mongoose");
  let restaurantQuery;

  // Tối ưu: Chỉ dùng ObjectId nếu valid, không dùng $or (chậm hơn)
  if (mongoose.Types.ObjectId.isValid(restaurantId)) {
    try {
      const objectId = new mongoose.Types.ObjectId(restaurantId);
      restaurantQuery = { restaurant: objectId }; // Dùng ObjectId trực tiếp để dùng index tốt hơn
      console.log("[Order Service] Using ObjectId query:", restaurantQuery);
    } catch (e) {
      restaurantQuery = { restaurant: restaurantId };
      console.log(
        "[Order Service] Using string query (catch):",
        restaurantQuery
      );
    }
  } else {
    restaurantQuery = { restaurant: restaurantId };
    console.log(
      "[Order Service] Using string query (not valid):",
      restaurantQuery
    );
  }

  const queryObj = { ...restaurantQuery, ...req.query };
  const excludedFields = ["page", "sort", "limit", "fields"];
  excludedFields.forEach((el) => delete queryObj[el]);

  // TỐI ƯU QUAN TRỌNG: Không dùng JSON.stringify/parse vì nó convert ObjectId thành string
  // Thay vào đó, xử lý query object trực tiếp để GIỮ NGUYÊN ObjectId
  // Xử lý operators (gte, gt, lte, lt) nếu có trong query string
  let finalQueryObj = { ...queryObj };

  // Nếu có operators trong req.query, cần format lại
  // Nhưng vì đã exclude ở trên, nên không cần xử lý

  let query = Order.find(finalQueryObj);

  // Tối ưu: Chỉ select fields cần thiết TRƯỚC khi sort/paginate để giảm dữ liệu xử lý
  // Không select invoicePayment và các fields không cần thiết để giảm kích thước response
  if (req.query.fields) {
    const fields = req.query.fields.split(",").join(" ");
    query = query.select(fields);
  } else {
    // Chỉ select fields cần thiết cho restaurant dashboard
    query = query.select(
      "_id receiver phone address cart totalPrice payments status restaurant createdAt"
    );
  }

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  // Pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 50; // Giảm limit mặc định từ 100 xuống 50
  const skip = (page - 1) * limit;

  query = query.skip(skip).limit(limit);

  // Sử dụng lean() để trả về plain object, nhanh hơn Mongoose document
  query = query.lean();

  // Đếm tổng số orders để tính pagination - TỐI ƯU: Chạy song song với query chính
  // Dùng query object gốc (không có pagination) - GIỮ NGUYÊN ObjectId
  const countQuery = Order.countDocuments(finalQueryObj);

  // DEBUG: Kiểm tra query plan để đảm bảo dùng index
  // Chạy explain() trước để xem query plan (chỉ khi query chậm)
  let explainResult = null;
  if (process.env.DEBUG_SLOW_QUERIES === "true") {
    try {
      explainResult = await query.explain("executionStats");
      const executionStats = explainResult.executionStats || explainResult;
      const stage =
        executionStats.executionStage?.stage || executionStats.stage;
      const indexName =
        executionStats.executionStage?.indexName || executionStats.indexName;

      console.log("[Order Service] 🔍 Query Explain Results:");
      console.log(`  Stage: ${stage}`);
      console.log(`  Index used: ${indexName || "NONE"}`);
      console.log(
        `  Execution time: ${
          executionStats.executionTimeMillis ||
          executionStats.executionTimeMillis
        }ms`
      );
      console.log(
        `  Docs examined: ${
          executionStats.totalDocsExamined || executionStats.totalDocsExamined
        }`
      );
      console.log(
        `  Docs returned: ${
          executionStats.nReturned || executionStats.nReturned
        }`
      );

      if (stage === "COLLSCAN") {
        console.error(
          "[Order Service] ❌ COLLSCAN detected! Query is scanning entire collection!"
        );
        console.error(
          "[Order Service] ⚠️  Need to create index: { restaurant: 1, createdAt: -1 }"
        );
      } else if (stage === "IXSCAN") {
        console.log(`[Order Service] ✅ Using index: ${indexName}`);
      }
    } catch (explainError) {
      console.warn(
        "[Order Service] Could not run explain:",
        explainError.message
      );
    }
  }

  // Chạy query và count song song để tăng tốc
  const startTime = Date.now();
  const [orders, totalOrders] = await Promise.all([
    query.exec(), // Execute query
    countQuery,
  ]);
  const queryTime = Date.now() - startTime;

  // Log query time để monitor performance
  if (queryTime > 1000) {
    console.warn(
      `[Order Service] ⚠️ Slow query detected: ${queryTime}ms for restaurant ${restaurantId}`
    );
    console.warn(
      `[Order Service] 💡 To debug, set DEBUG_SLOW_QUERIES=true in .env and restart service`
    );
    // Nếu query chậm (>2s), tự động chạy explain() để debug
    if (!explainResult && queryTime > 2000) {
      try {
        const autoExplain = await Order.find(finalQueryObj)
          .select("_id")
          .limit(1)
          .explain("executionStats");
        const stats = autoExplain.executionStats || autoExplain;
        const stage = stats.executionStage?.stage || stats.stage;
        const indexName = stats.executionStage?.indexName || stats.indexName;
        const docsExamined = stats.totalDocsExamined || stats.totalDocsExamined;

        console.error("[Order Service] ❌ AUTO-DEBUG: Slow query detected!");
        console.error(`  Query time: ${queryTime}ms`);
        console.error(`  Stage: ${stage}`);
        console.error(`  Index: ${indexName || "NONE"}`);
        console.error(`  Docs examined: ${docsExamined}`);

        if (stage === "COLLSCAN") {
          console.error(
            "[Order Service] ⚠️  COLLSCAN detected! Missing index!"
          );
          console.error(
            "[Order Service] 💡 Run: node scripts/check-indexes.js to create indexes"
          );
        } else if (docsExamined > limit * 10) {
          console.error(
            `[Order Service] ⚠️  Examining too many docs (${docsExamined}) for ${limit} results`
          );
        }
      } catch (e) {
        // Ignore explain errors
      }
    }
  } else {
    console.log(
      `[Order Service] ✅ Query completed in ${queryTime}ms, found ${orders.length} orders`
    );
  }

  // FALLBACK: Nếu không tìm thấy với ObjectId, thử với String
  // Và nếu vẫn không có, thử query với $or để match cả hai
  if (orders.length === 0 && mongoose.Types.ObjectId.isValid(restaurantId)) {
    console.log(
      "[Order Service] No orders found with ObjectId, trying fallback queries..."
    );

    try {
      const objectId = new mongoose.Types.ObjectId(restaurantId);
      // Thử với $or để match cả ObjectId và String
      const fallbackQueryObj = {
        $or: [
          { restaurant: objectId },
          { restaurant: restaurantId },
          { restaurant: restaurantId.toString() },
        ],
        ...(req.query.status && req.query.status !== "all"
          ? { status: req.query.status }
          : {}),
      };

      const excludedFields = ["page", "sort", "limit", "fields"];
      excludedFields.forEach((el) => delete fallbackQueryObj[el]);

      // Không dùng JSON.stringify/parse để giữ ObjectId
      let fallbackQuery = Order.find(fallbackQueryObj)
        .select(
          "_id receiver phone address cart totalPrice payments status restaurant createdAt"
        )
        .sort("-createdAt")
        .skip(skip)
        .limit(limit)
        .lean();

      const [fallbackOrders, fallbackCount] = await Promise.all([
        fallbackQuery.exec(),
        Order.countDocuments(fallbackQueryObj),
      ]);

      if (fallbackOrders.length > 0) {
        // Dùng kết quả từ fallback query - Tối ưu: bỏ images
        const optimizedFallbackOrders = fallbackOrders.map((order) => ({
          _id: order._id,
          receiver: order.receiver,
          phone: order.phone,
          address: order.address,
          cart: (order.cart || []).map((item) => ({
            product: {
              _id: item.product?._id,
              title: item.product?.title || item.product?.name,
              price: item.product?.price,
              promotion: item.product?.promotion,
              // Bỏ images để giảm kích thước
            },
            quantity: item.quantity,
          })),
          totalPrice: order.totalPrice,
          payments: order.payments,
          status: order.status,
          restaurant: order.restaurant,
          createdAt: order.createdAt,
        }));

        const totalPages = Math.ceil(fallbackCount / limit);

        return res.status(200).json({
          status: "success",
          results: optimizedFallbackOrders.length,
          data: {
            orders: optimizedFallbackOrders,
            pagination: {
              page,
              limit,
              total: fallbackCount,
              totalPages,
            },
          },
          message: `Found ${optimizedFallbackOrders.length} orders for restaurant ${restaurantId} (using fallback query)`,
        });
      }
    } catch (fallbackError) {
      console.error("[Order Service] Fallback query error:", fallbackError);
    }
  }

  // TỐI ƯU TỐI ĐA: Giảm kích thước cart data xuống mức tối thiểu
  // Chỉ giữ lại thông tin cần thiết nhất cho restaurant dashboard
  const optimizedOrders = orders.map((order) => {
    // Chỉ giữ tên sản phẩm, số lượng, và giá - BỎ TẤT CẢ thông tin khác
    const optimizedCart = (order.cart || []).map((item) => ({
      product: {
        title: item.product?.title || item.product?.name || "Sản phẩm",
        // BỎ _id, price, promotion, images - không cần cho danh sách orders
      },
      quantity: item.quantity,
    }));

    return {
      _id: order._id,
      receiver: order.receiver,
      phone: order.phone,
      address: order.address,
      cart: optimizedCart, // Cart đã được tối ưu tối đa
      totalPrice: order.totalPrice,
      payments: order.payments,
      status: order.status,
      // BỎ restaurant field - không cần vì đã filter theo restaurant rồi
      createdAt: order.createdAt,
    };
  });

  // Tính pagination metadata
  const totalPages = Math.ceil(totalOrders / limit);

  res.status(200).json({
    status: "success",
    results: optimizedOrders.length,
    data: {
      orders: optimizedOrders,
      pagination: {
        page,
        limit,
        total: totalOrders,
        totalPages,
      },
    },
    message: `Found ${optimizedOrders.length} orders for restaurant ${restaurantId}`,
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
