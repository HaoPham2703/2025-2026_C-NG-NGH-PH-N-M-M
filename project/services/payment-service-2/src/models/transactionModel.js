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
  this.populate({
    path: "user",
    select: "name email",
  });

  next();
});

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
