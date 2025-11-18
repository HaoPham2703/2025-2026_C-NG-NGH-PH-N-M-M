const Review = require("../models/reviewModel");
const axios = require("axios");

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || "http://localhost:4003";
const RESTAURANT_SERVICE_URL = process.env.RESTAURANT_SERVICE_URL || "http://localhost:4006";

// @desc    Create new review for an order
// @route   POST /api/v1/reviews
// @access  Private
exports.createReview = async (req, res) => {
  try {
    const { orderId, restaurantId, orderRating, orderComment, items } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!orderId || !restaurantId || !orderRating) {
      return res.status(400).json({
        status: "error",
        message: "Order ID, Restaurant ID, and Order Rating are required",
      });
    }

    // Check if order exists and belongs to user
    try {
      const orderResponse = await axios.get(
        `${ORDER_SERVICE_URL}/api/v1/orders/${orderId}`,
        {
          headers: {
            Authorization: req.headers.authorization,
          },
        }
      );

      const order = orderResponse.data.data.order;

      // Verify order belongs to user
      if (order.user.toString() !== userId.toString()) {
        return res.status(403).json({
          status: "error",
          message: "You can only review your own orders",
        });
      }

      // Check if order is completed
      if (order.status !== "Success") {
        return res.status(400).json({
          status: "error",
          message: "You can only review completed orders",
        });
      }

      // Check if already reviewed
      if (order.isReviewed) {
        return res.status(400).json({
          status: "error",
          message: "You have already reviewed this order",
        });
      }
    } catch (error) {
      console.error("Error fetching order:", error.message);
      return res.status(400).json({
        status: "error",
        message: "Invalid order or order not found",
      });
    }

    // Create review
    const review = await Review.create({
      order: orderId,
      restaurant: restaurantId,
      user: userId,
      orderRating,
      orderComment,
      items: items || [],
    });

    // Mark order as reviewed
    try {
      await axios.patch(
        `${ORDER_SERVICE_URL}/api/v1/orders/${orderId}/mark-reviewed`,
        {},
        {
          headers: {
            Authorization: req.headers.authorization,
          },
        }
      );
    } catch (error) {
      console.error("Error marking order as reviewed:", error.message);
    }

    // Update restaurant ratings
    try {
      const stats = await Review.calcRestaurantRatings(restaurantId);
      await axios.patch(
        `${RESTAURANT_SERVICE_URL}/api/restaurant/${restaurantId}/ratings`,
        {
          ratingsAverage: stats.avgRating || 0,
          ratingsQuantity: stats.nRating || 0,
        },
        {
          headers: {
            Authorization: req.headers.authorization,
          },
        }
      );
    } catch (error) {
      console.error("Error updating restaurant ratings:", error.message);
    }

    res.status(201).json({
      status: "success",
      data: {
        review,
      },
    });
  } catch (error) {
    console.error("Create review error:", error);
    
    // Handle duplicate review error
    if (error.code === 11000) {
      return res.status(400).json({
        status: "error",
        message: "You have already reviewed this order",
      });
    }

    res.status(500).json({
      status: "error",
      message: error.message || "Error creating review",
    });
  }
};

// @desc    Get review by ID
// @route   GET /api/v1/reviews/:id
// @access  Public
exports.getReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        status: "error",
        message: "Review not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        review,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Error fetching review",
    });
  }
};

// @desc    Get review by order ID
// @route   GET /api/v1/reviews/order/:orderId
// @access  Public
exports.getReviewByOrder = async (req, res) => {
  try {
    const review = await Review.findOne({ order: req.params.orderId });

    if (!review) {
      return res.status(404).json({
        status: "error",
        message: "No review found for this order",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        review,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Error fetching review",
    });
  }
};

// @desc    Get reviews by restaurant ID
// @route   GET /api/v1/reviews/restaurant/:restaurantId
// @access  Public
exports.getReviewsByRestaurant = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filter by rating if provided
    const filter = { restaurant: req.params.restaurantId };
    if (req.query.rating) {
      filter.orderRating = parseInt(req.query.rating);
    }

    // Sort options
    let sort = { createdAt: -1 }; // Default: newest first
    if (req.query.sort === "oldest") {
      sort = { createdAt: 1 };
    } else if (req.query.sort === "highest") {
      sort = { orderRating: -1 };
    } else if (req.query.sort === "lowest") {
      sort = { orderRating: 1 };
    }

    const reviews = await Review.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments(filter);

    res.status(200).json({
      status: "success",
      results: reviews.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: {
        reviews,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Error fetching reviews",
    });
  }
};

// @desc    Get reviews by user ID
// @route   GET /api/v1/reviews/user/:userId
// @access  Public
exports.getReviewsByUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ user: req.params.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ user: req.params.userId });

    res.status(200).json({
      status: "success",
      results: reviews.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: {
        reviews,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Error fetching reviews",
    });
  }
};

// @desc    Update review
// @route   PATCH /api/v1/reviews/:id
// @access  Private
exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        status: "error",
        message: "Review not found",
      });
    }

    // Check if user owns the review
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: "error",
        message: "You can only update your own reviews",
      });
    }

    // Update allowed fields
    const { orderRating, orderComment, items } = req.body;
    
    if (orderRating !== undefined) review.orderRating = orderRating;
    if (orderComment !== undefined) review.orderComment = orderComment;
    if (items !== undefined) review.items = items;

    await review.save();

    // Update restaurant ratings
    try {
      const stats = await Review.calcRestaurantRatings(review.restaurant);
      await axios.patch(
        `${RESTAURANT_SERVICE_URL}/api/restaurant/${review.restaurant}/ratings`,
        {
          ratingsAverage: stats.avgRating || 0,
          ratingsQuantity: stats.nRating || 0,
        },
        {
          headers: {
            Authorization: req.headers.authorization,
          },
        }
      );
    } catch (error) {
      console.error("Error updating restaurant ratings:", error.message);
    }

    res.status(200).json({
      status: "success",
      data: {
        review,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Error updating review",
    });
  }
};

// @desc    Delete review
// @route   DELETE /api/v1/reviews/:id
// @access  Private
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        status: "error",
        message: "Review not found",
      });
    }

    // Check if user owns the review or is admin
    if (
      review.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        status: "error",
        message: "You can only delete your own reviews",
      });
    }

    const restaurantId = review.restaurant;
    const orderId = review.order;

    await review.deleteOne();

    // Unmark order as reviewed
    try {
      await axios.patch(
        `${ORDER_SERVICE_URL}/api/v1/orders/${orderId}/unmark-reviewed`,
        {},
        {
          headers: {
            Authorization: req.headers.authorization,
          },
        }
      );
    } catch (error) {
      console.error("Error unmarking order:", error.message);
    }

    // Update restaurant ratings
    try {
      const stats = await Review.calcRestaurantRatings(restaurantId);
      await axios.patch(
        `${RESTAURANT_SERVICE_URL}/api/restaurant/${restaurantId}/ratings`,
        {
          ratingsAverage: stats.avgRating || 0,
          ratingsQuantity: stats.nRating || 0,
        },
        {
          headers: {
            Authorization: req.headers.authorization,
          },
        }
      );
    } catch (error) {
      console.error("Error updating restaurant ratings:", error.message);
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Error deleting review",
    });
  }
};

// @desc    Get restaurant rating statistics
// @route   GET /api/v1/reviews/stats/restaurant/:restaurantId
// @access  Public
exports.getRestaurantStats = async (req, res) => {
  try {
    const restaurantId = req.params.restaurantId;

    // Get overall stats
    const stats = await Review.calcRestaurantRatings(restaurantId);

    // Get rating distribution
    const distribution = await Review.aggregate([
      {
        $match: { 
          restaurant: require("mongoose").Types.ObjectId(restaurantId),
          orderRating: { $exists: true }
        },
      },
      {
        $group: {
          _id: "$orderRating",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: -1 },
      },
    ]);

    // Format distribution
    const ratingDistribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    distribution.forEach((item) => {
      ratingDistribution[item._id] = item.count;
    });

    res.status(200).json({
      status: "success",
      data: {
        averageRating: stats.avgRating || 0,
        totalReviews: stats.nRating || 0,
        distribution: ratingDistribution,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Error fetching statistics",
    });
  }
};
