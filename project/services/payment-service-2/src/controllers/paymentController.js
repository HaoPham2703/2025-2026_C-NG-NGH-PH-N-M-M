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
const mongoose = require("mongoose");

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

    // Tạo Transaction để lưu paymentUrl vào database
    // Ưu tiên lấy userId từ request body, sau đó từ req.user
    let userId = req.body.userId || getUserIdFromRequest(req);
    console.log("[Payment Service 2] createPaymentUrl - userId:", userId);
    console.log(
      "[Payment Service 2] createPaymentUrl - orderId:",
      req.body.orderId
    );
    console.log("[Payment Service 2] createPaymentUrl - req.user:", req.user);
    console.log(
      "[Payment Service 2] createPaymentUrl - req.body.userId:",
      req.body.userId
    );

    let transactionCreated = false;
    let transactionError = null;

    if (userId && req.body.orderId) {
      try {
        // Tạo transaction với status pending để lưu paymentUrl
        const transactionData = {
          user: userId,
          amount: req.body.amount,
          payments: "vnpay",
          order: orderId,
          paymentUrl: vnpUrl,
          status: "pending",
        };

        console.log("[Payment Service 2] Creating transaction with data:", {
          user: userId,
          order: orderId,
          amount: req.body.amount,
          hasPaymentUrl: !!vnpUrl,
        });

        // Kiểm tra xem đã có transaction nào với orderId này chưa
        const existingTransaction = await Transaction.findOne({
          order: orderId,
          payments: "vnpay",
          status: "pending",
        });

        if (existingTransaction) {
          // Update transaction hiện có với paymentUrl mới
          console.log(
            "[Payment Service 2] Updating existing transaction:",
            existingTransaction._id
          );
          existingTransaction.paymentUrl = vnpUrl;
          await existingTransaction.save();
          transactionCreated = true;
          console.log("[Payment Service 2] Transaction updated successfully");
        } else {
          // Tạo transaction mới
          const newTransaction = await Transaction.create(transactionData);
          transactionCreated = true;
          console.log(
            "[Payment Service 2] Transaction created successfully:",
            newTransaction._id
          );
        }
      } catch (error) {
        console.error(
          "[Payment Service 2] Error creating/updating transaction:",
          error
        );
        transactionError = error.message;
        // Không throw error để không làm gián đoạn việc trả về payment URL
        // Nhưng log để debug
      }
    } else {
      console.warn(
        "[Payment Service 2] Cannot create transaction - missing userId or orderId",
        {
          userId: !!userId,
          orderId: !!req.body.orderId,
        }
      );
    }

    res.status(201).json({
      status: "success",
      vnpUrl,
      orderId,
      transactionCreated,
      ...(transactionError && { transactionError }),
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

  console.log("[Payment Service 2] returnPaymentStatus - VNPay params:", {
    orderId: vnp_Params.vnp_TxnRef || vnp_Params.orderId,
    responseCode: vnp_Params.vnp_ResponseCode,
    isValid: verification.isValid,
  });

  if (verification.isValid) {
    const orderId = vnp_Params.vnp_TxnRef || vnp_Params.orderId || null;
    const userId = getUserIdFromRequest(req);

    if (verification.responseCode === "00") {
      // Tìm transaction hiện có với orderId này
      let transaction = await Transaction.findOne({
        order: orderId,
        payments: "vnpay",
      })
        .setOptions({ skipPopulate: true })
        .lean();

      console.log(
        "[Payment Service 2] returnPaymentStatus - Found existing transaction:",
        transaction ? "YES" : "NO",
        transaction
          ? { order: transaction.order, status: transaction.status }
          : null
      );

      if (transaction) {
        // Update transaction hiện có
        const updatedTransaction = await Transaction.findByIdAndUpdate(
          transaction._id,
          {
            status: "completed",
            invoicePayment: verification.params,
          },
          { new: true }
        ).setOptions({ skipPopulate: true });

        console.log(
          "[Payment Service 2] returnPaymentStatus - Transaction updated:",
          {
            _id: updatedTransaction._id,
            order: updatedTransaction.order,
            status: updatedTransaction.status,
          }
        );

        await sendPaymentSuccess(updatedTransaction);
      } else {
        // Nếu không tìm thấy transaction, tạo mới
        console.log(
          "[Payment Service 2] returnPaymentStatus - No existing transaction found, creating new one"
        );
        const newRecord = {
          user: userId,
          amount: verification.amount,
          payments: "vnpay",
          invoicePayment: verification.params,
          status: "completed",
          order: orderId,
        };

        const newTransaction = await Transaction.create(newRecord);
        console.log(
          "[Payment Service 2] returnPaymentStatus - New transaction created:",
          {
            _id: newTransaction._id,
            order: newTransaction.order,
            status: newTransaction.status,
          }
        );
        await sendPaymentSuccess(newTransaction);
      }
    } else {
      // Nếu thanh toán thất bại, update status thành "failed"
      if (orderId) {
        const transaction = await Transaction.findOne({
          order: orderId,
          payments: "vnpay",
        })
          .setOptions({ skipPopulate: true })
          .lean();

        if (transaction) {
          await Transaction.findByIdAndUpdate(
            transaction._id,
            {
              status: "failed",
              invoicePayment: verification.params,
            },
            { new: true }
          ).setOptions({ skipPopulate: true });

          console.log(
            "[Payment Service 2] returnPaymentStatus - Transaction marked as failed:",
            {
              order: transaction.order,
              responseCode: verification.responseCode,
            }
          );
        }
      }
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

exports.getTransactionByOrderId = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;

  console.log(
    "[Payment Service 2] getTransactionByOrderId - orderId:",
    orderId,
    "type:",
    typeof orderId
  );

  // Query transaction - thử nhiều cách để tìm
  // Sử dụng .lean() và skipPopulate option để tránh populate
  // 1. Tìm với orderId chính xác
  let transaction = await Transaction.findOne({
    order: orderId,
    payments: "vnpay",
  })
    .sort("-createdAt")
    .select("order paymentUrl status amount createdAt")
    .setOptions({ skipPopulate: true }) // Skip populate từ pre hook
    .lean();

  console.log(
    "[Payment Service 2] Query 1 result:",
    transaction
      ? {
          found: true,
          order: transaction.order,
          hasPaymentUrl: !!transaction.paymentUrl,
          status: transaction.status,
        }
      : "NOT FOUND"
  );

  // 2. Nếu không tìm thấy, thử tìm tất cả transactions với orderId này (không filter payments)
  if (!transaction) {
    console.log(
      "[Payment Service 2] No transaction found with payments filter, trying without filter..."
    );
    transaction = await Transaction.findOne({
      order: orderId,
    })
      .sort("-createdAt")
      .select("order paymentUrl status amount createdAt payments")
      .setOptions({ skipPopulate: true }) // Skip populate từ pre hook
      .lean();
    console.log(
      "[Payment Service 2] Query 2 result:",
      transaction
        ? {
            found: true,
            order: transaction.order,
            hasPaymentUrl: !!transaction.paymentUrl,
            status: transaction.status,
            payments: transaction.payments,
          }
        : "NOT FOUND"
    );
  }

  // 3. Nếu vẫn không tìm thấy, thử tìm với orderId như string
  if (!transaction) {
    console.log("[Payment Service 2] Trying to find with orderId as string...");
    transaction = await Transaction.findOne({
      order: String(orderId),
    })
      .sort("-createdAt")
      .select("order paymentUrl status amount createdAt payments")
      .setOptions({ skipPopulate: true }) // Skip populate từ pre hook
      .lean();
    console.log(
      "[Payment Service 2] Query 3 result:",
      transaction
        ? {
            found: true,
            order: transaction.order,
            hasPaymentUrl: !!transaction.paymentUrl,
            status: transaction.status,
          }
        : "NOT FOUND"
    );
  }

  // Debug: Tìm tất cả transactions có order chứa orderId để xem có gì
  const debugTransactions = await Transaction.find({
    order: { $regex: orderId, $options: "i" },
  })
    .select("order paymentUrl status payments")
    .setOptions({ skipPopulate: true })
    .limit(5)
    .lean();
  console.log(
    "[Payment Service 2] Debug - All transactions matching orderId:",
    debugTransactions.map((t) => ({
      order: t.order,
      orderType: typeof t.order,
      hasPaymentUrl: !!t.paymentUrl,
      status: t.status,
    }))
  );

  // 4. Nếu vẫn không tìm thấy, thử tìm trong database fastfood_payments
  if (!transaction) {
    console.log(
      "[Payment Service 2] No transaction found in current database, trying fastfood_payments database..."
    );
    let fastfoodPaymentsConnection = null;
    try {
      // Tạo connection đến database fastfood_payments
      let fastfoodPaymentsDbUrl;
      if (process.env.DB_URL || process.env.MONGODB_URI) {
        const dbUrl = process.env.DB_URL || process.env.MONGODB_URI;
        console.log(
          "[Payment Service 2] Original DB URL:",
          dbUrl.replace(/\/\/[^:]+:[^@]+@/, "//***:***@") // Ẩn password trong log
        );

        // Xử lý MongoDB connection string có query parameters
        // Format: mongodb://host:port/dbname?params hoặc mongodb+srv://host/dbname?params
        // Tìm và thay thế tên database (sau dấu / cuối cùng, trước ? hoặc cuối string)
        // Ví dụ: mongodb+srv://.../fastfood_payments_2?retryWrites=true -> mongodb+srv://.../fastfood_payments?retryWrites=true
        fastfoodPaymentsDbUrl = dbUrl.replace(
          /\/([^\/\?]+)(\?.*)?$/,
          (match, dbName, queryParams) => {
            return `/fastfood_payments${queryParams || ""}`;
          }
        );
        console.log(
          "[Payment Service 2] Fastfood payments DB URL:",
          fastfoodPaymentsDbUrl.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")
        );
      } else {
        // Tạo từ các tham số riêng lẻ
        const host = process.env.DB_HOST || "127.0.0.1";
        const port = process.env.DB_PORT || "27017";
        const user = process.env.DB_USER;
        const password = process.env.DB_PASSWORD;
        if (user && password) {
          fastfoodPaymentsDbUrl = `mongodb://${user}:${password}@${host}:${port}/fastfood_payments`;
        } else {
          fastfoodPaymentsDbUrl = `mongodb://${host}:${port}/fastfood_payments`;
        }
      }

      console.log(
        "[Payment Service 2] Attempting to connect to fastfood_payments database..."
      );
      fastfoodPaymentsConnection = mongoose.createConnection(
        fastfoodPaymentsDbUrl,
        {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 10000, // 10 seconds timeout
        }
      );

      // Đợi connection ready - kiểm tra readyState
      const maxWaitTime = 10000; // 10 seconds
      const startTime = Date.now();
      while (
        fastfoodPaymentsConnection.readyState !== 1 &&
        Date.now() - startTime < maxWaitTime
      ) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (fastfoodPaymentsConnection.readyState === 1) {
        console.log(
          "[Payment Service 2] Successfully connected to fastfood_payments database"
        );
      } else {
        throw new Error(
          `Connection timeout. ReadyState: ${fastfoodPaymentsConnection.readyState}`
        );
      }

      // Tạo model Transaction cho database fastfood_payments
      // Không dùng ref để tránh lỗi populate với model chưa đăng ký
      const fastfoodPaymentsTransactionSchema = new mongoose.Schema(
        {
          user: mongoose.Schema.Types.Mixed, // Dùng Mixed thay vì ObjectId với ref
          amount: Number,
          createdAt: Date,
          payments: String,
          order: String,
          invoicePayment: Object,
          paymentUrl: String,
          status: String,
          paymentMethod: String,
        },
        { collection: "transactions", strict: false }
      );

      const FastfoodPaymentsTransaction = fastfoodPaymentsConnection.model(
        "Transaction",
        fastfoodPaymentsTransactionSchema
      );

      // Debug: Đếm tổng số transactions trong database
      const totalCount = await FastfoodPaymentsTransaction.countDocuments({});
      console.log(
        `[Payment Service 2] Total transactions in fastfood_payments: ${totalCount}`
      );

      // Debug: Tìm tất cả transactions có order chứa orderId (một phần)
      const allMatchingTransactions = await FastfoodPaymentsTransaction.find({
        order: { $regex: orderId, $options: "i" },
      })
        .select("order paymentUrl status payments createdAt")
        .sort("-createdAt")
        .limit(10)
        .lean();
      console.log(
        `[Payment Service 2] Found ${allMatchingTransactions.length} transactions matching orderId pattern:`,
        allMatchingTransactions.map((t) => ({
          order: t.order,
          orderType: typeof t.order,
          hasPaymentUrl: !!t.paymentUrl,
          status: t.status,
          payments: t.payments,
        }))
      );

      // Tìm transaction trong database fastfood_payments
      // Sử dụng .lean() để trả về plain object, tránh populate
      console.log(
        `[Payment Service 2] Searching for transaction with orderId: "${orderId}" (type: ${typeof orderId})`
      );

      let altTransaction = await FastfoodPaymentsTransaction.findOne({
        order: orderId,
        payments: "vnpay",
      })
        .sort("-createdAt")
        .select("order paymentUrl status amount createdAt")
        .lean();

      console.log(
        `[Payment Service 2] Query 1 (order=${orderId}, payments=vnpay):`,
        altTransaction ? "FOUND" : "NOT FOUND"
      );

      if (!altTransaction) {
        altTransaction = await FastfoodPaymentsTransaction.findOne({
          order: orderId,
        })
          .sort("-createdAt")
          .select("order paymentUrl status amount createdAt payments")
          .lean();
        console.log(
          `[Payment Service 2] Query 2 (order=${orderId}, no payments filter):`,
          altTransaction ? "FOUND" : "NOT FOUND"
        );
      }

      if (!altTransaction) {
        altTransaction = await FastfoodPaymentsTransaction.findOne({
          order: String(orderId),
        })
          .sort("-createdAt")
          .select("order paymentUrl status amount createdAt payments")
          .lean();
        console.log(
          `[Payment Service 2] Query 3 (order="${String(orderId)}" as string):`,
          altTransaction ? "FOUND" : "NOT FOUND"
        );
      }

      // Thử tìm với ObjectId nếu orderId là ObjectId
      if (!altTransaction && orderId.length === 24) {
        try {
          const mongoose = require("mongoose");
          const objectId = new mongoose.Types.ObjectId(orderId);
          altTransaction = await FastfoodPaymentsTransaction.findOne({
            order: objectId,
          })
            .sort("-createdAt")
            .select("order paymentUrl status amount createdAt payments")
            .lean();
          console.log(
            `[Payment Service 2] Query 4 (order as ObjectId):`,
            altTransaction ? "FOUND" : "NOT FOUND"
          );
        } catch (e) {
          console.log(
            `[Payment Service 2] Query 4 failed (not a valid ObjectId):`,
            e.message
          );
        }
      }

      if (altTransaction) {
        console.log(
          "[Payment Service 2] ✅ Found transaction in fastfood_payments database:",
          {
            _id: altTransaction._id,
            order: altTransaction.order,
            orderType: typeof altTransaction.order,
            hasPaymentUrl: !!altTransaction.paymentUrl,
            paymentUrl: altTransaction.paymentUrl
              ? altTransaction.paymentUrl.substring(0, 50) + "..."
              : "missing",
            status: altTransaction.status,
            payments: altTransaction.payments,
          }
        );
        // altTransaction đã là plain object nhờ .lean()
        transaction = altTransaction;
      } else {
        console.log(
          "[Payment Service 2] ❌ No transaction found in fastfood_payments database for orderId:",
          orderId
        );
      }
    } catch (error) {
      console.error(
        "[Payment Service 2] Error querying fastfood_payments database:",
        error.message
      );
    } finally {
      // Đảm bảo connection luôn được đóng
      if (fastfoodPaymentsConnection) {
        try {
          await fastfoodPaymentsConnection.close();
        } catch (closeError) {
          console.error(
            "[Payment Service 2] Error closing fastfood_payments connection:",
            closeError.message
          );
        }
      }
    }
  }

  // 5. Debug: Tìm tất cả transactions với orderId này để xem có gì (đã có ở trên trong debugTransactions)

  console.log("[Payment Service 2] getTransactionByOrderId - Final result:", {
    found: !!transaction,
    transactionId: transaction?._id?.toString(),
    order: transaction?.order,
    orderType: typeof transaction?.order,
    hasPaymentUrl: !!transaction?.paymentUrl,
    paymentUrlLength: transaction?.paymentUrl?.length || 0,
    paymentUrlPreview: transaction?.paymentUrl
      ? transaction.paymentUrl.substring(0, 80) + "..."
      : "missing",
    status: transaction?.status,
    payments: transaction?.payments,
    transactionKeys: transaction ? Object.keys(transaction) : [],
  });

  if (!transaction) {
    console.log(
      "[Payment Service 2] ❌ No transaction found for orderId:",
      orderId,
      "- Returning null"
    );
    return res.status(200).json({
      status: "success",
      data: {
        transaction: null,
      },
    });
  }

  console.log(
    "[Payment Service 2] ✅ Returning transaction with paymentUrl:",
    transaction.paymentUrl ? "YES" : "NO",
    transaction.paymentUrl ? `(${transaction.paymentUrl.length} chars)` : ""
  );

  // Đảm bảo response có đúng format với tất cả fields cần thiết
  const response = {
    status: "success",
    data: {
      transaction: {
        _id: transaction._id,
        order: transaction.order,
        paymentUrl: transaction.paymentUrl,
        status: transaction.status,
        amount: transaction.amount,
        payments: transaction.payments,
        createdAt: transaction.createdAt,
      },
    },
  };

  console.log(
    "[Payment Service 2] Response payload preview:",
    JSON.stringify(
      {
        ...response,
        data: {
          transaction: {
            ...response.data.transaction,
            paymentUrl: response.data.transaction.paymentUrl
              ? response.data.transaction.paymentUrl.substring(0, 80) + "..."
              : null,
          },
        },
      },
      null,
      2
    )
  );

  res.status(200).json(response);
});

exports.getTransactionsByOrderIds = catchAsync(async (req, res, next) => {
  const { orderIds } = req.body; // Array of orderIds

  if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
    return res.status(400).json({
      status: "error",
      message: "orderIds must be an array with at least one orderId",
    });
  }

  // Lấy tất cả transactions cho các orderIds, chỉ lấy VNPay và status pending
  const transactions = await Transaction.find({
    order: { $in: orderIds },
    payments: "vnpay",
    status: "pending", // Chỉ lấy các transaction chưa thanh toán
  })
    .sort("-createdAt")
    .select("order paymentUrl status") // Chỉ lấy các field cần thiết
    .setOptions({ skipPopulate: true }) // Skip populate từ pre hook
    .lean();

  // Tạo map để dễ lookup: orderId -> transaction
  const transactionMap = {};
  transactions.forEach((transaction) => {
    if (transaction.order && transaction.paymentUrl) {
      transactionMap[transaction.order] = {
        paymentUrl: transaction.paymentUrl,
        status: transaction.status,
      };
    }
  });

  res.status(200).json({
    status: "success",
    data: {
      transactions: transactionMap,
    },
  });
});

exports.setUser = catchAsync(async (req, res, next) => {
  if (req.user.role !== "admin") req.query.user = req.user.id;
  next();
});
