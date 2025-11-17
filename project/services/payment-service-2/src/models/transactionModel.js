const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Không thể để trống người nhận"],
    },
    amount: {
      type: Number,
      required: [true, "Không thể trống mục tiền nhận"],
      min: [1, "Tiền nhận phải lớn hơn 0"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    payments: {
      type: String,
      required: [true, "Phải có phương thức thanh toán"],
      enum: {
        values: ["vnpay", "paypal", "refund", "stripe"],
        message: "Phải có phương thức nhận tiền",
      },
      default: "refund",
    },
    order: String,
    invoicePayment: Object,
    paymentUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["credit_card", "bank_transfer", "ewallet", "cash"],
      default: "credit_card",
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

transactionSchema.pre(/^find/, function (next) {
  // Skip populate nếu query có option skipPopulate hoặc đang dùng lean()
  // Kiểm tra xem có option skipPopulate không
  if (this.getOptions().skipPopulate || this.getOptions().lean) {
    return next();
  }

  // Chỉ populate nếu không có option skipPopulate
  try {
    this.populate({
      path: "user",
      select: "name email",
    });
  } catch (error) {
    // Nếu populate fail (ví dụ: model User chưa được đăng ký), bỏ qua
    console.warn(
      "[Transaction Model] Populate failed, skipping:",
      error.message
    );
  }

  next();
});

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
