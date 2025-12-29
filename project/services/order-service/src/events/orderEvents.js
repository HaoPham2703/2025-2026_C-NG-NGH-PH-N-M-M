// Simple event logging - no Kafka dependency like User/Product Service

// Send order created event
const sendOrderCreated = async (order) => {
  console.log("📤 Order created:", {
    id: order._id,
    userId: order.user,
    totalAmount: order.totalPrice,
    status: order.status,
    timestamp: new Date().toISOString(),
  });
};

// Send order status changed event
const sendOrderStatusChanged = async (order, oldStatus, newStatus) => {
  console.log("📤 Order status changed:", {
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
  console.log("📤 Order cancelled:", {
    id: order._id,
    userId: order.user,
    totalAmount: order.totalPrice,
    timestamp: new Date().toISOString(),
  });
};

// Send order completed event
const sendOrderCompleted = async (order) => {
  console.log("📤 Order completed:", {
    id: order._id,
    userId: order.user,
    totalAmount: order.totalPrice,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  sendOrderCreated,
  sendOrderStatusChanged,
  sendOrderCancelled,
  sendOrderCompleted,
};
