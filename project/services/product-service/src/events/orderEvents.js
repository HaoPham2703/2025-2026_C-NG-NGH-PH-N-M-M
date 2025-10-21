const { sendEvent } = require("../config/kafka");

// Send order created event
const sendOrderCreated = async (order) => {
  await sendEvent("order-created", {
    id: order._id,
    userId: order.user,
    totalAmount: order.totalPrice,
    items: order.cart,
    status: order.status,
    paymentMethod: order.payments,
    timestamp: new Date().toISOString(),
  });
};

// Send order status changed event
const sendOrderStatusChanged = async (order, oldStatus, newStatus) => {
  await sendEvent("order-status-changed", {
    id: order._id,
    userId: order.user,
    oldStatus,
    newStatus,
    totalAmount: order.totalPrice,
    timestamp: new Date().toISOString(),
  });
};

// Send order cancelled event
const sendOrderCancelled = async (order) => {
  await sendEvent("order-cancelled", {
    id: order._id,
    userId: order.user,
    totalAmount: order.totalPrice,
    items: order.cart,
    timestamp: new Date().toISOString(),
  });
};

// Send order completed event
const sendOrderCompleted = async (order) => {
  await sendEvent("order-completed", {
    id: order._id,
    userId: order.user,
    totalAmount: order.totalPrice,
    items: order.cart,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  sendOrderCreated,
  sendOrderStatusChanged,
  sendOrderCancelled,
  sendOrderCompleted,
};
