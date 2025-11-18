const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Hóa đơn phải có người mua"],
    },
    address: {
      type: String,
      required: [true, "Hóa đơn mua hàng phải có địa chỉ vận chuyển"],
    },
    receiver: {
      type: String,
      required: [true, "Hóa đơn mua hàng phải có thông tin người nhận"],
    },
    phone: {
      type: String,
      required: [true, "Hóa đơn mua hàng phải có số điện thoại người nhận"],
    },
    cart: [
      {
        product: Object,
        quantity: Number,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    totalPrice: Number,
    payments: {
      type: String,
      required: [true, "Phải có phương thức thanh toán"],
      enum: {
        values: ["tiền mặt", "paypal", "vnpay", "momo", "số dư"],
        message: "Phương thức thanh toán là tiền mặt, vnpay, momo hoặc số dư",
      },
    },
    status: {
      type: String,
      enum: {
        values: [
          "Cancelled",
          "Processed",
          "Waiting Goods",
          "Delivery",
          "Success",
        ],
      },
      default: "Processed",
    },
    restaurant: {
      type: mongoose.Schema.ObjectId,
      ref: "Restaurant",
      index: true,
    },
    invoicePayment: Object,
    isReviewed: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field to check if order can be reviewed
orderSchema.virtual("canReview").get(function () {
  return this.status === "Success" && !this.isReviewed;
});

orderSchema.index({ "$**": "text" });

// Note: In microservices architecture, we don't populate user from User Service
// User data should be fetched separately via API if needed
// orderSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: "user",
//     select: "name email",
//   });
//   next();
// });

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
