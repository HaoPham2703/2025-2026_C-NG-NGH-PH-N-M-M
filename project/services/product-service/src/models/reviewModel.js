const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review can not be empty!"],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, "Rating is required"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    product: {
      type: mongoose.Schema.ObjectId,
      ref: "Product",
      required: [true, "Review must belong to a product."],
    },
    user: {
      type: String, // User ID as string (in microservices, we don't reference User model)
      required: [true, "Review must belong to a user."],
    },
    order: {
      type: String, // Order ID as string (can be ObjectId string)
      // Optional: cho phép review không gắn với order (backward compatibility)
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Prevent duplicate reviews from same user on same product in same order
// Cho phép review cùng sản phẩm trong các order khác nhau
// Nếu order là null/undefined, vẫn unique theo product+user (backward compatibility)
reviewSchema.index({ product: 1, user: 1, order: 1 }, { unique: true });

// Note: Không populate user vì trong microservices architecture, User model không có trong product service
// User info sẽ được fetch từ user service khi cần thiết

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
