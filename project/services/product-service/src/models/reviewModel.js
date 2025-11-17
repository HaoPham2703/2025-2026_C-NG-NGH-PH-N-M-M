const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    // Order and Restaurant info (for order-based reviews)
    order: {
      type: mongoose.Schema.ObjectId,
      ref: "Order",
      required: [true, "Review must belong to an order."],
    },
    restaurant: {
      type: mongoose.Schema.ObjectId,
      ref: "Restaurant",
      required: [true, "Review must belong to a restaurant."],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user."],
    },
    
    // Order/Restaurant review
    orderRating: {
      type: Number,
      required: [true, "Order rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating must not exceed 5"],
    },
    orderComment: {
      type: String,
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },
    
    // Individual product reviews (optional - for detailed item reviews)
    items: [
      {
        product: {
          type: mongoose.Schema.ObjectId,
          ref: "Product",
        },
        productName: String,
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: {
          type: String,
          trim: true,
          maxlength: 300,
        },
      },
    ],
    
    // Legacy fields (kept for backward compatibility)
    product: {
      type: mongoose.Schema.ObjectId,
      ref: "Product",
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
    },
    
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

// Prevent duplicate reviews from same user on same order
reviewSchema.index({ order: 1, user: 1 }, { unique: true });
// Keep old index for product-based reviews
reviewSchema.index({ product: 1, user: 1 });

// Populate user data when querying reviews
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name photo email",
  });
  next();
});

// Calculate average rating for a restaurant from order reviews
reviewSchema.statics.calcRestaurantRatings = async function (restaurantId) {
  const stats = await this.aggregate([
    {
      $match: { 
        restaurant: restaurantId,
        orderRating: { $exists: true }
      },
    },
    {
      $group: {
        _id: "$restaurant",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$orderRating" },
      },
    },
  ]);

  return stats.length > 0 ? stats[0] : { nRating: 0, avgRating: 0 };
};

// Calculate average rating for a product
reviewSchema.statics.calcAverageRatings = async function (productId) {
  const stats = await this.aggregate([
    {
      $match: { product: productId },
    },
    {
      $group: {
        _id: "$product",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    await mongoose.model("Product").findByIdAndUpdate(productId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await mongoose.model("Product").findByIdAndUpdate(productId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// Update product ratings after creating a review
reviewSchema.post("save", function () {
  this.constructor.calcAverageRatings(this.product);
});

// Update product ratings after updating/deleting a review
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calcAverageRatings(this.r.product);
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
