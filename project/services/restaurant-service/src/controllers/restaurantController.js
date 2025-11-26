const Restaurant = require("../models/restaurantModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// @desc    Get public restaurant info (for shipping fee calculation)
// @route   GET /api/v1/restaurants/:id/public
// @access  Public
exports.getPublicRestaurantInfo = catchAsync(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.params.id).select("restaurantName address");

  if (!restaurant) {
    return next(new AppError("Restaurant not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      restaurant: {
        _id: restaurant._id,
        restaurantName: restaurant.restaurantName,
        address: restaurant.address,
      },
    },
  });
});

// @desc    Get restaurant profile
// @route   GET /api/restaurant/profile
// @access  Private
exports.getProfile = catchAsync(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.restaurant.id);

  if (!restaurant) {
    return next(new AppError("Restaurant not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      restaurant,
    },
  });
});

// @desc    Update restaurant profile
// @route   PUT /api/restaurant/profile
// @access  Private
exports.updateProfile = catchAsync(async (req, res, next) => {
  const {
    restaurantName,
    ownerName,
    phone,
    cuisine,
    description,
    address,
    ward,
    district,
    city,
  } = req.body;

  const updateData = {};

  if (restaurantName) updateData.restaurantName = restaurantName;
  if (ownerName) updateData.ownerName = ownerName;
  if (phone) updateData.phone = phone;
  if (cuisine) updateData.cuisine = cuisine;
  if (description !== undefined) updateData.description = description;

  if (address || ward || district || city) {
    updateData.address = {
      detail: address,
      ward,
      district,
      city,
    };
  }

  const restaurant = await Restaurant.findByIdAndUpdate(
    req.restaurant.id,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!restaurant) {
    return next(new AppError("Restaurant not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      restaurant,
    },
  });
});

// @desc    Update business hours
// @route   PUT /api/restaurant/business-hours
// @access  Private
exports.updateBusinessHours = catchAsync(async (req, res, next) => {
  const { businessHours } = req.body;

  const restaurant = await Restaurant.findByIdAndUpdate(
    req.restaurant.id,
    { businessHours },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!restaurant) {
    return next(new AppError("Restaurant not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      restaurant,
    },
  });
});

// @desc    Update notification settings
// @route   PUT /api/restaurant/notification-settings
// @access  Private
exports.updateNotificationSettings = catchAsync(async (req, res, next) => {
  const { notificationSettings } = req.body;

  const restaurant = await Restaurant.findByIdAndUpdate(
    req.restaurant.id,
    { notificationSettings },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!restaurant) {
    return next(new AppError("Restaurant not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      restaurant,
    },
  });
});

// @desc    Get restaurant stats
// @route   GET /api/restaurant/stats
// @access  Private
exports.getStats = catchAsync(async (req, res, next) => {
  const axios = require("axios");
  const restaurantId = req.restaurant.id;

  console.log("[getStats] Restaurant ID:", restaurantId);

  try {
    // 1. Get orders from Order Service directly (bypass API Gateway for internal call)
    const orderServiceUrl =
      process.env.ORDER_SERVICE_URL || "http://localhost:4003";
    const orderUrl = `${orderServiceUrl}/api/v1/orders/restaurant/${restaurantId}`;

    console.log("[getStats] Calling Order Service:", orderUrl);

    let orders = [];
    try {
      const orderResponse = await axios.get(orderUrl, {
        headers: {
          "x-user": Buffer.from(
            JSON.stringify({
              id: restaurantId,
              role: "restaurant",
            })
          ).toString("base64"),
        },
        timeout: 5000, // 5 second timeout
      });

      console.log(
        "[getStats] Order Service response status:",
        orderResponse.status
      );
      console.log(
        "[getStats] Order Service response data:",
        JSON.stringify(orderResponse.data).substring(0, 200)
      );

      orders = orderResponse.data?.data?.orders || [];
    } catch (orderError) {
      console.error("[getStats] Order Service error:", {
        message: orderError.message,
        status: orderError.response?.status,
        data: orderError.response?.data,
        url: orderUrl,
      });
      // Continue with empty orders array if Order Service is unavailable
      orders = [];
    }

    // Handle case where orders might be null or undefined
    if (!Array.isArray(orders)) {
      console.warn("[getStats] Orders response is not an array:", orders);
      orders = [];
    }

    console.log("[getStats] Found orders:", orders.length);

    // Calculate order statistics
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(
      (o) => o.status === "Processed" || o.status === "Waiting Goods"
    ).length;
    const completedOrders = orders.filter((o) => o.status === "Success").length;

    // Calculate total revenue from completed orders
    const totalRevenue = orders
      .filter((o) => o.status === "Success")
      .reduce((sum, order) => sum + (order.totalPrice || 0), 0);

    // 2. Get products from Product Service
    const productServiceUrl =
      process.env.PRODUCT_SERVICE_URL || "http://localhost:4002";
    const productUrl = `${productServiceUrl}/api/v1/products`;

    console.log(
      "[getStats] Calling Product Service:",
      productUrl,
      "with params:",
      { restaurant: restaurantId }
    );

    let products = [];
    try {
      const productResponse = await axios.get(productUrl, {
        params: { restaurant: restaurantId },
        timeout: 5000, // 5 second timeout
      });

      console.log(
        "[getStats] Product Service response status:",
        productResponse.status
      );
      console.log(
        "[getStats] Product Service response data keys:",
        Object.keys(productResponse.data || {})
      );

      products = productResponse.data?.data?.products || [];
    } catch (productError) {
      console.error("[getStats] Product Service error:", {
        message: productError.message,
        status: productError.response?.status,
        data: productError.response?.data,
        url: productUrl,
      });
      // Continue with empty products array if Product Service is unavailable
      products = [];
    }

    // Handle case where products might be null or undefined
    if (!Array.isArray(products)) {
      console.warn("Products response is not an array:", products);
      products = [];
    }

    const totalProducts = products.length;
    const activeProducts = products.filter(
      (p) => (p.inventory || 0) > 0
    ).length;

    // 3. Calculate growth rates (compare current month vs previous month)
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentMonthOrders = orders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= currentMonthStart;
    });

    const previousMonthOrders = orders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= previousMonthStart && orderDate < currentMonthStart;
    });

    const currentMonthRevenue = currentMonthOrders
      .filter((o) => o.status === "Success")
      .reduce((sum, order) => sum + (order.totalPrice || 0), 0);

    const previousMonthRevenue = previousMonthOrders
      .filter((o) => o.status === "Success")
      .reduce((sum, order) => sum + (order.totalPrice || 0), 0);

    const revenueGrowth =
      previousMonthRevenue > 0
        ? (
            ((currentMonthRevenue - previousMonthRevenue) /
              previousMonthRevenue) *
            100
          ).toFixed(1)
        : currentMonthRevenue > 0
        ? 100
        : 0;

    const ordersGrowth =
      previousMonthOrders.length > 0
        ? (
            ((currentMonthOrders.length - previousMonthOrders.length) /
              previousMonthOrders.length) *
            100
          ).toFixed(1)
        : currentMonthOrders.length > 0
        ? 100
        : 0;

    const stats = {
      totalRevenue: totalRevenue,
      totalOrders: totalOrders,
      pendingOrders: pendingOrders,
      completedOrders: completedOrders,
      totalProducts: totalProducts,
      activeProducts: activeProducts,
      revenueGrowth: parseFloat(revenueGrowth),
      ordersGrowth: parseFloat(ordersGrowth),
    };

    console.log("[getStats] Calculated stats:", stats);

    res.status(200).json({
      status: "success",
      data: {
        stats,
      },
    });
  } catch (error) {
    console.error("Error fetching restaurant stats:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
    });

    // Return default values if service unavailable
    res.status(200).json({
      status: "success",
      data: {
        stats: {
          totalRevenue: 0,
          totalOrders: 0,
          pendingOrders: 0,
          completedOrders: 0,
          totalProducts: 0,
          activeProducts: 0,
          revenueGrowth: 0,
          ordersGrowth: 0,
        },
      },
    });
  }
});

// @desc    Get orders for restaurant
// @route   GET /api/restaurant/orders
// @access  Private
exports.getOrders = catchAsync(async (req, res, next) => {
  const axios = require("axios");
  const restaurantId = req.restaurant.id;

  // Giảm log để tăng performance
  // console.log("[Restaurant Service] getOrders - Restaurant ID:", restaurantId);

  try {
    // Get orders from Order Service directly
    const orderServiceUrl =
      process.env.ORDER_SERVICE_URL || "http://localhost:4003";
    const orderEndpoint = `${orderServiceUrl}/api/v1/orders/restaurant/${restaurantId}`;

    // Truyền query params từ request xuống Order Service
    const queryParams = {
      page: req.query.page || 1,
      limit: req.query.limit || 50,
      ...(req.query.status && { status: req.query.status }),
      ...(req.query.sort && { sort: req.query.sort }),
    };

    // Giảm log để tăng performance
    // console.log("[Restaurant Service] Calling Order Service:", orderEndpoint, "with params:", queryParams);

    const orderResponse = await axios.get(orderEndpoint, {
      params: queryParams,
      headers: {
        "x-user": Buffer.from(
          JSON.stringify({
            id: restaurantId,
            role: "restaurant",
          })
        ).toString("base64"),
      },
      timeout: 5000, // Giảm timeout xuống 5 giây (đủ cho query tối ưu)
    });

    // Giảm log để tăng performance
    // console.log("[Restaurant Service] Order Service response:", {...});

    const orders = orderResponse.data?.data?.orders || [];
    const pagination = orderResponse.data?.data?.pagination;

    // Giảm log để tăng performance
    // console.log("[Restaurant Service] Returning orders:", orders.length, "orders");

    res.status(200).json({
      status: "success",
      results: orders.length,
      data: {
        orders,
        ...(pagination && { pagination }),
      },
      ...(pagination && { pagination }), // Cũng trả về ở top level để dễ access
    });
  } catch (error) {
    console.error("[Restaurant Service] Error fetching restaurant orders:", {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
    });

    // Return empty array if service unavailable
    res.status(200).json({
      status: "success",
      results: 0,
      data: {
        orders: [],
      },
    });
  }
});
