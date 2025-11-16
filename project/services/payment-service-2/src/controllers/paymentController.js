const Transaction = require("../models/transactionModel");
const { createPaymentUrl, verifyPayment } = require("../services/vnpayService");
const {
  createPaymentIntent,
  confirmPayment,
  createRefund,
} = require("../services/stripeService");
const {
  sendPaymentCreated,
  sendPaymentSuccess,
  sendPaymentFailed,
  sendRefundCreated,
} = require("../events/paymentEvents");
const moment = require("moment");

// Helper function for async error handling
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Helper to safely extract userId from req.user
const getUserIdFromRequest = (req) => {
  if (!req || !req.user) return null;
  return req.user._id || req.user.id || req.user.userId || null;
};

// Helper function for creating errors
const AppError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
  return error;
};

exports.createPaymentUrl = catchAsync(async (req, res, next) => {
  try {
    // Validate required fields
    if (!req.body.amount) {
      return res.status(400).json({
        status: "error",
        message: "Amount is required",
      });
    }

    // Use orderId from request body if provided, otherwise generate one
    const orderId = req.body.orderId || moment(new Date()).format("DDHHmmss");

    // Check if VNPay config is available
    if (
      !process.env.vnp_TmnCode ||
      !process.env.vnp_HashSecret ||
      !process.env.vnp_Url
    ) {
      return res.status(500).json({
        status: "error",
        message:
          "VNPay configuration is missing. Please check environment variables.",
      });
    }

    const vnpUrl = createPaymentUrl(req, orderId);

    res.status(201).json({
      status: "success",
      vnpUrl,
      orderId,
    });
  } catch (error) {
    console.error("Error creating payment URL:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to create payment URL",
    });
  }
});

exports.returnPaymentStatus = catchAsync(async (req, res, next) => {
  const vnp_Params = req.body.invoice;
  const verification = verifyPayment(vnp_Params);

  if (verification.isValid) {
    const userId = getUserIdFromRequest(req);
    if (verification.responseCode === "00") {
      const newRecord = {
        user: userId,
        amount: verification.amount,
        payments: "vnpay",
        invoicePayment: verification.params,
        status: "completed",
        order: vnp_Params.vnp_TxnRef || vnp_Params.orderId || null,
      };

      const transaction = await Transaction.create(newRecord);
      await sendPaymentSuccess(transaction);
    }

    res.status(201).json({
      message: "success",
      code: verification.responseCode,
      invoice: verification.params,
    });
  } else {
    res.status(201).json({ message: "success", code: "97" });
  }
});

exports.returnPaypalStatus = catchAsync(async (req, res, next) => {
  const userId = getUserIdFromRequest(req);
  const newRecord = {
    user: userId,
    amount: req.body.amount,
    payments: "paypal",
    invoicePayment: req.body.invoicePayment,
    status: "completed",
  };

  const transaction = await Transaction.create(newRecord);
  await sendPaymentSuccess(transaction);

  res.status(201).json({ message: "success" });
});

exports.createStripePayment = catchAsync(async (req, res, next) => {
  const { amount, currency = "vnd" } = req.body;

  const result = await createPaymentIntent(amount, currency);

  if (result.success) {
    const userId = getUserIdFromRequest(req);
    const newRecord = {
      user: userId,
      amount: amount,
      payments: "stripe",
      invoicePayment: result.paymentIntent,
      status: "pending",
    };

    const transaction = await Transaction.create(newRecord);
    await sendPaymentCreated(transaction);

    res.status(201).json({
      status: "success",
      clientSecret: result.paymentIntent.client_secret,
      paymentIntentId: result.paymentIntent.id,
    });
  } else {
    res.status(400).json({
      status: "error",
      message: result.error,
    });
  }
});

exports.confirmStripePayment = catchAsync(async (req, res, next) => {
  const { paymentIntentId } = req.body;

  const result = await confirmPayment(paymentIntentId);

  if (result.success) {
    const transaction = await Transaction.findOneAndUpdate(
      { "invoicePayment.id": paymentIntentId },
      { status: "completed" },
      { new: true }
    );

    if (transaction) {
      await sendPaymentSuccess(transaction);
    }

    res.status(200).json({
      status: "success",
      paymentIntent: result.paymentIntent,
    });
  } else {
    res.status(400).json({
      status: "error",
      message: result.error,
    });
  }
});

exports.createRefund = catchAsync(async (req, res, next) => {
  const { paymentIntentId, amount } = req.body;

  const result = await createRefund(paymentIntentId, amount);

  if (result.success) {
    const userId = getUserIdFromRequest(req);
    const newRecord = {
      user: userId,
      amount: -amount, // Negative for refund
      payments: "refund",
      invoicePayment: result.refund,
      status: "completed",
    };

    const transaction = await Transaction.create(newRecord);
    await sendRefundCreated(transaction);

    res.status(201).json({
      status: "success",
      refund: result.refund,
    });
  } else {
    res.status(400).json({
      status: "error",
      message: result.error,
    });
  }
});

exports.getAllPayments = catchAsync(async (req, res, next) => {
  // Build query
  const queryObj = { ...req.query };
  const excludedFields = ["page", "sort", "limit", "fields"];
  excludedFields.forEach((el) => delete queryObj[el]);

  // Advanced filtering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

  let query = Transaction.find(JSON.parse(queryStr));

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  // Field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(",").join(" ");
    query = query.select(fields);
  }

  // Pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 100;
  const skip = (page - 1) * limit;

  query = query.skip(skip).limit(limit);

  const transactions = await query;

  res.status(200).json({
    status: "success",
    results: transactions.length,
    data: {
      transactions,
    },
  });
});

exports.getPayment = catchAsync(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id);

  if (!transaction) {
    return next(new AppError("Không tìm thấy giao dịch với ID này", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      transaction,
    },
  });
});

exports.setUser = catchAsync(async (req, res, next) => {
  if (req.user.role !== "admin") req.query.user = req.user.id;
  next();
});
