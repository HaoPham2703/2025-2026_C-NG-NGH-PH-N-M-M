const Restaurant = require("../models/restaurantModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const axios = require("axios");

// @desc    Get all restaurants (with filters and pagination)
// @route   GET /api/v1/admin/restaurants
// @access  Private/Admin
exports.getAllRestaurants = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    status,
    search,
    sort = "-createdAt",
  } = req.query;

  // Build query
  let query = {};

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Search by name, email, or owner name
  if (search) {
    query.$or = [
      { restaurantName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { ownerName: { $regex: search, $options: "i" } },
    ];
  }

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Execute query with pagination
  const restaurants = await Restaurant.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  const total = await Restaurant.countDocuments(query);

  res.status(200).json({
    status: "success",
    results: restaurants.length,
    data: {
      restaurants,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    },
  });
});

// @desc    Get single restaurant
// @route   GET /api/v1/admin/restaurants/:id
// @access  Private/Admin
exports.getRestaurant = catchAsync(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.params.id);

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

// @desc    Create restaurant
// @route   POST /api/v1/admin/restaurants
// @access  Private/Admin
exports.createRestaurant = catchAsync(async (req, res, next) => {
  const {
    restaurantName,
    ownerName,
    email,
    password,
    phone,
    cuisine,
    description,
    address,
    city,
    district,
    ward,
    status = "active",
    verified = false,
  } = req.body;

  // Check if restaurant already exists
  const existingRestaurant = await Restaurant.findOne({ email });
  if (existingRestaurant) {
    return next(new AppError("Email already registered", 400));
  }

  // Create restaurant
  const restaurant = await Restaurant.create({
    restaurantName,
    ownerName,
    email,
    password: password || "defaultPassword123", // Admin can set default password
    phone,
    cuisine,
    description,
    address: {
      detail: address,
      ward,
      district,
      city,
    },
    status,
    verified,
  });

  res.status(201).json({
    status: "success",
    data: {
      restaurant,
    },
  });
});

// @desc    Update restaurant
// @route   PUT /api/v1/admin/restaurants/:id
// @access  Private/Admin
exports.updateRestaurant = catchAsync(async (req, res, next) => {
  const {
    restaurantName,
    ownerName,
    email,
    phone,
    cuisine,
    description,
    address,
    city,
    district,
    ward,
    status,
    verified,
    logo,
  } = req.body;

  // Build update object
  const updateData = {};

  if (restaurantName) updateData.restaurantName = restaurantName;
  if (ownerName) updateData.ownerName = ownerName;
  if (email) {
    // Check if email already exists for another restaurant
    const existingRestaurant = await Restaurant.findOne({ email });
    if (
      existingRestaurant &&
      existingRestaurant._id.toString() !== req.params.id
    ) {
      return next(new AppError("Email already registered", 400));
    }
    updateData.email = email;
  }
  if (phone) updateData.phone = phone;
  if (cuisine) updateData.cuisine = cuisine;
  if (description !== undefined) updateData.description = description;
  if (status) updateData.status = status;
  if (verified !== undefined) updateData.verified = verified;
  if (logo !== undefined) updateData.logo = logo;

  if (address || ward || district || city) {
    updateData.address = {
      detail: address,
      ward,
      district,
      city,
    };
  }

  const restaurant = await Restaurant.findByIdAndUpdate(
    req.params.id,
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

// Helper function to check and handle orders when deleting restaurant
const handleRestaurantOrdersOnDelete = async (
  restaurantId,
  adminId = null,
  authHeader = null
) => {
  try {
    const orderServiceUrl =
      process.env.ORDER_SERVICE_URL || "http://localhost:4003";
    const apiGatewayUrl =
      process.env.API_GATEWAY_URL || "http://localhost:5001";

    // Get all orders for this restaurant
    const orderUrl = `${orderServiceUrl}/api/v1/orders/restaurant/${restaurantId}`;

    let orders = [];
    try {
      const orderResponse = await axios.get(orderUrl, {
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader || "",
          "x-user": Buffer.from(
            JSON.stringify({
              id: restaurantId,
              role: "admin",
            })
          ).toString("base64"),
        },
        timeout: 15000, // Increase timeout to 15 seconds
      });

      orders = orderResponse.data?.data?.orders || [];
    } catch (error) {
      console.error(
        `[Admin Controller] Error fetching orders for restaurant ${restaurantId}:`,
        error.message
      );
      return {
        success: false,
        error: "Failed to fetch orders",
        orders: [],
      };
    }

    if (!Array.isArray(orders) || orders.length === 0) {
      return {
        success: true,
        ordersProcessed: 0,
        refundsProcessed: 0,
        orders: [],
      };
    }

    // Process each order
    const results = {
      ordersProcessed: 0,
      refundsProcessed: 0,
      cancelledOrders: [],
      failedRefunds: [],
    };

    for (const order of orders) {
      // Skip if order is already completed or cancelled
      if (order.status === "Success" || order.status === "Cancelled") {
        continue;
      }

      try {
        // Cancel the order by updating status to "Cancelled"
        // Call Order Service directly (bypass API Gateway to avoid proxy issues)
        const cancelUrl = `${orderServiceUrl}/api/v1/orders/${order._id}/status`;

        await axios.patch(
          cancelUrl,
          {
            status: "Cancelled",
          },
          {
            headers: {
              "Content-Type": "application/json",
              "x-user": Buffer.from(
                JSON.stringify({
                  id: adminId || restaurantId,
                  role: "admin",
                })
              ).toString("base64"),
            },
            timeout: 15000, // Increase timeout to 15 seconds
          }
        );

        results.cancelledOrders.push(order._id);
        results.ordersProcessed++;

        // Process refund if payment was made (not COD)
        if (
          order.payments &&
          order.payments !== "tiền mặt" &&
          order.totalPrice > 0
        ) {
          try {
            const paymentServiceUrl =
              process.env.PAYMENT_SERVICE_URL || "http://localhost:4004";
            const paymentService2Url =
              process.env.PAYMENT_SERVICE_2_URL || "http://localhost:3005";

            // Try payment service 2 first (VNPay/MoMo)
            let refundUrl = `${paymentService2Url}/api/v1/payments/refund`;

            try {
              const refundResponse = await axios.post(
                refundUrl,
                {
                  orderId: order._id.toString(),
                  userId: order.user?.toString() || order.user,
                  amount: order.totalPrice,
                  reason: "Restaurant đã bị xóa khỏi hệ thống",
                },
                {
                  timeout: 10000,
                }
              );

              if (refundResponse.data?.status === "success") {
                results.refundsProcessed++;
              }
            } catch (refundError) {
              // Try payment service 1
              refundUrl = `${paymentServiceUrl}/api/v1/payments/refund`;

              try {
                const refundResponse = await axios.post(
                  refundUrl,
                  {
                    orderId: order._id.toString(),
                    userId: order.user?.toString() || order.user,
                    amount: order.totalPrice,
                    reason: "Restaurant đã bị xóa khỏi hệ thống",
                  },
                  {
                    timeout: 10000,
                  }
                );

                if (refundResponse.data?.status === "success") {
                  results.refundsProcessed++;
                }
              } catch (error2) {
                console.error(
                  `[Admin Controller] Failed to refund order ${order._id}:`,
                  error2.message
                );
                results.failedRefunds.push({
                  orderId: order._id,
                  error: error2.message,
                });
              }
            }
          } catch (refundError) {
            console.error(
              `[Admin Controller] Refund error for order ${order._id}:`,
              refundError.message
            );
            results.failedRefunds.push({
              orderId: order._id,
              error: refundError.message,
            });
          }
        }
      } catch (cancelError) {
        console.error(
          `[Admin Controller] Failed to cancel order ${order._id}:`,
          cancelError.message
        );
      }
    }

    return {
      success: true,
      ...results,
      totalOrders: orders.length,
    };
  } catch (error) {
    console.error(
      `[Admin Controller] Error handling orders for restaurant ${restaurantId}:`,
      error.message
    );
    return {
      success: false,
      error: error.message,
    };
  }
};

// @desc    Delete restaurant
// @route   DELETE /api/v1/admin/restaurants/:id
// @access  Private/Admin
exports.deleteRestaurant = catchAsync(async (req, res, next) => {
  const restaurantId = req.params.id;

  // Check if restaurant exists
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    return next(new AppError("Restaurant not found", 404));
  }

  // Handle orders and payments before deleting
  const adminId = req.user?.id || req.admin?.id || null;
  const authHeader = req.headers.authorization || null;
  const orderHandlingResult = await handleRestaurantOrdersOnDelete(
    restaurantId,
    adminId,
    authHeader
  );

  // Delete restaurant
  await Restaurant.findByIdAndDelete(restaurantId);

  res.status(200).json({
    status: "success",
    message: "Restaurant deleted successfully",
    data: {
      deletedRestaurant: {
        id: restaurantId,
        name: restaurant.restaurantName,
      },
      orderHandling: orderHandlingResult,
    },
  });
});

// @desc    Update restaurant status
// @route   PATCH /api/v1/admin/restaurants/:id/status
// @access  Private/Admin
exports.updateRestaurantStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;

  if (!["active", "inactive", "suspended"].includes(status)) {
    return next(
      new AppError(
        "Invalid status. Must be one of: active, inactive, suspended",
        400
      )
    );
  }

  const restaurant = await Restaurant.findByIdAndUpdate(
    req.params.id,
    { status },
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

// @desc    Verify restaurant
// @route   PATCH /api/v1/admin/restaurants/:id/verify
// @access  Private/Admin
exports.verifyRestaurant = catchAsync(async (req, res, next) => {
  const restaurant = await Restaurant.findByIdAndUpdate(
    req.params.id,
    { verified: true },
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

// @desc    Get restaurant statistics
// @route   GET /api/v1/admin/restaurants/stats
// @access  Private/Admin
exports.getRestaurantStats = catchAsync(async (req, res, next) => {
  const totalRestaurants = await Restaurant.countDocuments();
  const activeRestaurants = await Restaurant.countDocuments({
    status: "active",
  });
  const inactiveRestaurants = await Restaurant.countDocuments({
    status: "inactive",
  });
  const suspendedRestaurants = await Restaurant.countDocuments({
    status: "suspended",
  });
  const verifiedRestaurants = await Restaurant.countDocuments({
    verified: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      stats: {
        total: totalRestaurants,
        active: activeRestaurants,
        inactive: inactiveRestaurants,
        suspended: suspendedRestaurants,
        verified: verifiedRestaurants,
      },
    },
  });
});
