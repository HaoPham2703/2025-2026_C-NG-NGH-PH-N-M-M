const { sendEvent } = require("../config/kafka");

// Send payment created event
const sendPaymentCreated = async (payment) => {
  await sendEvent("payment-created", {
    id: payment._id,
    userId: payment.user,
    amount: payment.amount,
    paymentMethod: payment.payments,
    status: payment.status,
    orderId: payment.order,
    timestamp: new Date().toISOString(),
  });
};

// Send payment success event
const sendPaymentSuccess = async (payment) => {
  await sendEvent("payment-success", {
    id: payment._id,
    userId: payment.user,
    amount: payment.amount,
    paymentMethod: payment.payments,
    orderId: payment.order,
    timestamp: new Date().toISOString(),
  });
};

// Send payment failed event
const sendPaymentFailed = async (payment, reason) => {
  await sendEvent("payment-failed", {
    id: payment._id,
    userId: payment.user,
    amount: payment.amount,
    paymentMethod: payment.payments,
    orderId: payment.order,
    reason,
    timestamp: new Date().toISOString(),
  });
};

// Send refund created event
const sendRefundCreated = async (payment) => {
  await sendEvent("refund-created", {
    id: payment._id,
    userId: payment.user,
    amount: payment.amount,
    orderId: payment.order,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  sendPaymentCreated,
  sendPaymentSuccess,
  sendPaymentFailed,
  sendRefundCreated,
};
