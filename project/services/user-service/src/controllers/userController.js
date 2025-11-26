const User = require("../models/userModel");
const AppError = require("../utils/appError");

// Helper function for async error handling
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError("Trang này không dùng để thay đổi mật khẩu", 400));
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated,this is all field can update:
  const filteredBody = filterObj(
    req.body,
    "name",
    "avatar",
    "gender",
    "dateOfBirth",
    "phone"
  );

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

// Helper function to check and handle orders when deleting user account
const handleUserOrdersOnDelete = async (userId, authHeader = null) => {
  try {
    const axios = require("axios");
    const orderServiceUrl =
      process.env.ORDER_SERVICE_URL || "http://localhost:4003";
    const apiGatewayUrl =
      process.env.API_GATEWAY_URL || "http://localhost:5001";

    // Get all orders for this user
    const orderUrl = `${orderServiceUrl}/api/v1/orders/user/${userId}`;

    let orders = [];
    try {
      const orderResponse = await axios.get(orderUrl, {
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader || "",
          "x-user": Buffer.from(
            JSON.stringify({
              id: userId,
              role: "user",
            })
          ).toString("base64"),
        },
        timeout: 15000,
      });

      orders = orderResponse.data?.data?.orders || [];
    } catch (error) {
      console.error(
        `[User Controller] Error fetching orders for user ${userId}:`,
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
                  id: userId,
                  role: "user",
                })
              ).toString("base64"),
            },
            timeout: 15000,
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
                  userId: userId.toString(),
                  amount: order.totalPrice,
                  reason: "Tài khoản người dùng đã bị xóa",
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
                    userId: userId.toString(),
                    amount: order.totalPrice,
                    reason: "Tài khoản người dùng đã bị xóa",
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
                  `[User Controller] Failed to refund order ${order._id}:`,
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
              `[User Controller] Refund error for order ${order._id}:`,
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
          `[User Controller] Failed to cancel order ${order._id}:`,
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
      `[User Controller] Error handling orders for user ${userId}:`,
      error.message
    );
    return {
      success: false,
      error: error.message,
    };
  }
};

exports.deleteMe = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  // Handle orders and payments before deleting account
  const authHeader = req.headers.authorization || null;
  const orderHandlingResult = await handleUserOrdersOnDelete(
    userId,
    authHeader
  );

  // Delete user account (set active to "ban" or actually delete)
  // Option 1: Soft delete (set active = "ban") - keeps data for records
  await User.findByIdAndUpdate(userId, { active: "ban" });

  // Option 2: Hard delete (uncomment if you want to actually delete)
  // await User.findByIdAndDelete(userId);

  res.status(200).json({
    status: "success",
    message: "Tài khoản đã được xóa thành công",
    data: {
      deletedUser: {
        id: userId,
        email: req.user.email,
      },
      orderHandling: orderHandlingResult,
    },
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not defined! Please use /signup instead",
  });
};

exports.createAddress = catchAsync(async (req, res) => {
  const user = req.user;
  let arr = user.address;
  let index = arr.length;
  const data = {
    name: req.body.name,
    phone: req.body.phone,
    province: req.body.province,
    district: req.body.district,
    ward: req.body.ward,
    detail: req.body.detail,
  };
  if (index == 0) data.setDefault = true;
  arr.push(data);
  user.address = arr;
  await user.save({ validateBeforeSave: false });
  res.status(200).json({
    status: "success",
    message: "You have already added address successfully.",
    data: user,
  });
});

exports.updateAddress = catchAsync(async (req, res) => {
  const user = req.user;
  const id = req.body.id;
  if (user.address.length > id) {
    let arr = user.address;
    const data = {
      name: req.body.name,
      phone: req.body.phone,
      province: req.body.province,
      district: req.body.district,
      ward: req.body.ward,
      detail: req.body.detail,
      setDefault: req.body.setDefault,
    };
    arr[id] = data;
    user.address = arr;
    await user.save({ validateBeforeSave: false });
    return res.status(200).json({
      status: "success",
      message: "You have already updated address successfully.",
    });
  }
  res.status(500).json({
    status: "error",
    message: "This data is not exist. Please try again!!!",
    data: user,
  });
});

exports.deleteAddress = catchAsync(async (req, res) => {
  const user = req.user;
  const address = user.address;
  const index = req.body.id;
  if (address.length > index) {
    const check = address[index].setDefault;
    address.splice(index, 1);
    if (check == true && address.length > 0) {
      address[0].setDefault = true;
    }
    user.address = address;
    await user.save({ validateBeforeSave: false });
    return res.status(200).json({
      status: "success",
      message: "Delete address successfully.",
      data: user,
    });
  }
  res.status(500).json({
    status: "error",
    message: "This data is not exist. Please try again!!!",
  });
});

exports.setDefaultAddress = catchAsync(async (req, res) => {
  const user = req.user;
  const address = user.address;
  const index = req.body.id;

  // Validate index
  if (
    index === undefined ||
    index === null ||
    index < 0 ||
    index >= address.length
  ) {
    return res.status(400).json({
      status: "error",
      message: "Invalid address index. Please try again!!!",
    });
  }

  // Find current default address index
  const current = address.findIndex((value) => value.setDefault == true);

  // Set new default
  address[index].setDefault = true;

  // Unset old default if exists
  if (current !== -1 && current !== index) {
    address[current].setDefault = false;
  }

  user.address = address;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json({
    status: "success",
    message: "Set default address successfully.",
    data: user,
  });
});

exports.getUserAddress = (req, res) => {
  console.log("=== DEBUG getUserAddress ===");
  console.log("req.user:", req.user);
  console.log("req.user.address:", req.user.address);
  console.log(
    "address length:",
    req.user.address ? req.user.address.length : "undefined"
  );
  console.log("===========================");

  const address = req.user.address;
  res.status(200).json({
    status: "success",
    data: {
      address,
    },
    message: "Get all user address successfully.",
  });
};

// Generic CRUD operations
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("Không tìm thấy người dùng với ID này", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return next(new AppError("Không tìm thấy người dùng với ID này", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError("Không tìm thấy người dùng với ID này", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getTableUser = catchAsync(async (req, res, next) => {
  const users = await User.find().select("-password");

  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});
