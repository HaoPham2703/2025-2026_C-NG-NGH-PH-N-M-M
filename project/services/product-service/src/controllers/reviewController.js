const Review = require("../models/reviewModel");
const Product = require("../models/productModel");
const mongoose = require("mongoose");
const axios = require("axios");

// Helper function for async error handling
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Helper class for creating errors
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    Error.captureStackTrace(this, this.constructor);
  }
}

// Helper function để gọi Order Service API
const getOrderFromService = async (
  orderId,
  authToken = null,
  userHeader = null
) => {
  try {
    const apiGatewayUrl =
      process.env.API_GATEWAY_URL || "http://localhost:5001";
    const orderServiceUrl =
      process.env.ORDER_SERVICE_URL || "http://localhost:4003";

    const headers = {};
    if (authToken) {
      headers.Authorization = authToken.startsWith("Bearer ")
        ? authToken
        : `Bearer ${authToken}`;
    }
    if (userHeader) {
      headers["x-user"] = userHeader;
    }

    // Thử qua API Gateway trước
    try {
      const response = await axios.get(
        `${apiGatewayUrl}/api/v1/orders/${orderId}`,
        {
          headers,
          timeout: 10000,
        }
      );

      if (
        response.data &&
        response.data.status === "success" &&
        response.data.data?.order
      ) {
        return response.data.data.order;
      }
    } catch (gatewayError) {
      console.log(
        "[getOrderFromService] API Gateway failed, trying direct connection..."
      );
    }

    // Fallback về direct order service
    const response = await axios.get(
      `${orderServiceUrl}/api/v1/orders/${orderId}`,
      {
        headers,
        timeout: 10000,
      }
    );

    if (
      response.data &&
      response.data.status === "success" &&
      response.data.data?.order
    ) {
      return response.data.data.order;
    }

    throw new Error("Order not found or invalid response");
  } catch (error) {
    console.error("[getOrderFromService] Error:", error.message);
    if (error.response) {
      throw new Error(
        `Không thể lấy thông tin đơn hàng: ${
          error.response.data?.message || error.message
        }`
      );
    }
    throw new Error(`Không thể lấy thông tin đơn hàng: ${error.message}`);
  }
};

// Tạo review cho sản phẩm trong order
exports.createReview = catchAsync(async (req, res, next) => {
  const { productId, orderId, rating, review } = req.body;

  if (!productId || !rating) {
    return next(new AppError("Product ID và rating là bắt buộc", 400));
  }

  // Lấy user từ request (từ middleware authentication)
  const userId = req.user?.id || req.user?._id || req.user?.userId;
  if (!userId) {
    return next(new AppError("Người dùng chưa đăng nhập", 401));
  }

  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    return next(new AppError("Rating phải từ 1 đến 5", 400));
  }

  // Validate review text (không bắt buộc nhưng nếu có thì không được rỗng)
  if (review !== undefined && review !== null && review.trim() === "") {
    return next(new AppError("Đánh giá không được để trống", 400));
  }

  // Kiểm tra sản phẩm có tồn tại không
  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError("Không tìm thấy sản phẩm", 404));
  }

  // Nếu có orderId, kiểm tra order có tồn tại và user có quyền review không
  if (orderId) {
    try {
      // Lấy auth token và user header từ request headers (forward từ API Gateway)
      const authToken =
        req.headers.authorization || req.headers.Authorization || null;
      const userHeader = req.headers["x-user"] || null;
      const order = await getOrderFromService(orderId, authToken, userHeader);

      if (!order) {
        return next(new AppError("Không tìm thấy đơn hàng", 404));
      }

      // Kiểm tra user có phải chủ đơn hàng không
      const orderUserId =
        order.user?.toString() || order.user?._id?.toString() || order.user;
      if (orderUserId !== userId && orderUserId !== userId.toString()) {
        return next(
          new AppError("Bạn không có quyền đánh giá đơn hàng này", 403)
        );
      }

      // Kiểm tra đơn hàng đã thành công chưa
      if (order.status !== "Success") {
        return next(
          new AppError(
            "Chỉ có thể đánh giá sản phẩm trong đơn hàng đã hoàn thành",
            400
          )
        );
      }

      // Kiểm tra sản phẩm có trong order không
      const productInOrder = (order.cart || []).find((item) => {
        const itemProductId =
          item.product?._id?.toString() ||
          item.product?._id ||
          item.product?.toString();
        return (
          itemProductId === productId ||
          itemProductId?.toString() === productId?.toString()
        );
      });
      if (!productInOrder) {
        return next(new AppError("Sản phẩm không có trong đơn hàng này", 400));
      }
    } catch (error) {
      return next(
        new AppError(error.message || "Không thể lấy thông tin đơn hàng", 500)
      );
    }

    // Kiểm tra đã review sản phẩm này trong order này chưa
    const existingReview = await Review.findOne({
      product: productId,
      user: userId.toString(), // Convert to string for query
      order: orderId,
    });

    if (existingReview) {
      return next(
        new AppError("Bạn đã đánh giá sản phẩm này trong đơn hàng này rồi", 400)
      );
    }
  } else {
    // Nếu không có orderId, kiểm tra đã review sản phẩm này chưa (backward compatibility)
    const existingReview = await Review.findOne({
      product: productId,
      user: userId.toString(), // Convert to string for query
      order: { $exists: false },
    });

    if (existingReview) {
      return next(new AppError("Bạn đã đánh giá sản phẩm này rồi", 400));
    }
  }

  // Tạo review - đảm bảo userId là string
  const newReview = await Review.create({
    product: productId,
    user: userId.toString(), // Convert to string for consistency
    order: orderId || null,
    rating,
    review: review || "",
  });

  res.status(201).json({
    status: "success",
    data: {
      review: newReview,
    },
  });
});

// Lấy danh sách reviews của sản phẩm
exports.getProductReviews = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const skip = (page - 1) * limit;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return next(new AppError("ID sản phẩm không hợp lệ", 400));
  }

  const reviews = await Review.find({ product: productId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalReviews = await Review.countDocuments({ product: productId });

  res.status(200).json({
    status: "success",
    results: reviews.length,
    data: {
      reviews,
      pagination: {
        page,
        limit,
        total: totalReviews,
        totalPages: Math.ceil(totalReviews / limit),
      },
    },
  });
});

// Lấy danh sách sản phẩm trong order cần review (chỉ order đã thành công)
exports.getProductsToReviewInOrder = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;

  // Lấy user từ request
  const userId = req.user?.id || req.user?._id || req.user?.userId;
  if (!userId) {
    return next(new AppError("Người dùng chưa đăng nhập", 401));
  }

  try {
    // Lấy auth token và user header từ request headers (forward từ API Gateway)
    const authToken =
      req.headers.authorization || req.headers.Authorization || null;
    const userHeader = req.headers["x-user"] || null;
    const order = await getOrderFromService(orderId, authToken, userHeader);

    if (!order) {
      return next(new AppError("Không tìm thấy đơn hàng", 404));
    }

    // Kiểm tra user có phải chủ đơn hàng không
    const orderUserId =
      order.user?.toString() || order.user?._id?.toString() || order.user;
    if (
      orderUserId !== userId &&
      orderUserId !== userId.toString() &&
      req.user?.role !== "admin"
    ) {
      return next(new AppError("Bạn không có quyền xem đơn hàng này", 403));
    }

    // Chỉ cho phép review khi order đã thành công
    if (order.status !== "Success") {
      return next(
        new AppError(
          "Chỉ có thể đánh giá sản phẩm trong đơn hàng đã hoàn thành",
          400
        )
      );
    }

    // Lấy tất cả reviews của user cho các sản phẩm trong order này
    const productIds = (order.cart || [])
      .map((item) => item.product?._id?.toString() || item.product?._id)
      .filter(Boolean);

    const reviewedProducts = await Review.find({
      product: { $in: productIds },
      user: userId.toString(), // Convert to string for query
      order: orderId,
    }).select("product");

    const reviewedProductIds = reviewedProducts.map((r) =>
      r.product.toString()
    );

    // Lọc ra các sản phẩm chưa được review
    const productsToReview = (order.cart || [])
      .filter((item) => {
        const productId = item.product?._id?.toString() || item.product?._id;
        return productId && !reviewedProductIds.includes(productId);
      })
      .map((item) => ({
        product: item.product,
        quantity: item.quantity,
        orderId: orderId,
      }));

    // Lấy thông tin reviews đã có (nếu có)
    const allReviewsInOrder = await Review.find({
      user: userId.toString(), // Convert to string for query
      order: orderId,
    }).lean();

    res.status(200).json({
      status: "success",
      data: {
        orderId: orderId,
        productsToReview: productsToReview,
        reviewedProducts: allReviewsInOrder,
        canReview: productsToReview.length > 0,
      },
    });
  } catch (error) {
    return next(
      new AppError(error.message || "Không thể lấy thông tin đơn hàng", 500)
    );
  }
});

// Cập nhật review
exports.updateReview = catchAsync(async (req, res, next) => {
  const { reviewId } = req.params;
  const { rating, review } = req.body;

  const userId = req.user?.id || req.user?._id || req.user?.userId;
  if (!userId) {
    return next(new AppError("Người dùng chưa đăng nhập", 401));
  }

  const existingReview = await Review.findById(reviewId);
  if (!existingReview) {
    return next(new AppError("Không tìm thấy đánh giá", 404));
  }

  // Kiểm tra user có phải chủ review không
  if (existingReview.user.toString() !== userId.toString()) {
    return next(new AppError("Bạn không có quyền chỉnh sửa đánh giá này", 403));
  }

  // Cập nhật
  if (rating !== undefined) {
    if (rating < 1 || rating > 5) {
      return next(new AppError("Rating phải từ 1 đến 5", 400));
    }
    existingReview.rating = rating;
  }

  if (review !== undefined) {
    existingReview.review = review;
  }

  await existingReview.save();

  res.status(200).json({
    status: "success",
    data: {
      review: existingReview,
    },
  });
});

// Xóa review
exports.deleteReview = catchAsync(async (req, res, next) => {
  const { reviewId } = req.params;

  const userId = req.user?.id || req.user?._id || req.user?.userId;
  if (!userId) {
    return next(new AppError("Người dùng chưa đăng nhập", 401));
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    return next(new AppError("Không tìm thấy đánh giá", 404));
  }

  // Kiểm tra user có phải chủ review không hoặc là admin
  const userRole = req.user?.role;
  if (review.user.toString() !== userId.toString() && userRole !== "admin") {
    return next(new AppError("Bạn không có quyền xóa đánh giá này", 403));
  }

  await Review.findByIdAndDelete(reviewId);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// Lấy review của user cho sản phẩm trong order
exports.getUserReviewForProductInOrder = catchAsync(async (req, res, next) => {
  const { productId, orderId } = req.params;

  const userId = req.user?.id || req.user?._id || req.user?.userId;
  if (!userId) {
    return next(new AppError("Người dùng chưa đăng nhập", 401));
  }

  const review = await Review.findOne({
    product: productId,
    user: userId.toString(), // Convert to string for query
    order: orderId,
  });

  if (!review) {
    return res.status(200).json({
      status: "success",
      data: {
        review: null,
      },
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      review: review,
    },
  });
});
