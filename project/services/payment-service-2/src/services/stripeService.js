// Mock Stripe service for development
// In production, you would use the actual Stripe SDK

const createPaymentIntent = async (amount, currency = "vnd") => {
  try {
    // Mock payment intent creation
    const paymentIntent = {
      id: `pi_${Date.now()}`,
      amount: amount * 100, // Stripe uses cents
      currency: currency,
      status: "requires_payment_method",
      client_secret: `pi_${Date.now()}_secret_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
    };

    return {
      success: true,
      paymentIntent,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

const confirmPayment = async (paymentIntentId) => {
  try {
    // Mock payment confirmation
    const paymentIntent = {
      id: paymentIntentId,
      status: "succeeded",
      amount_received: 100000, // Mock amount
      created: Date.now(),
    };

    return {
      success: true,
      paymentIntent,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

const createRefund = async (paymentIntentId, amount) => {
  try {
    // Mock refund creation
    const refund = {
      id: `re_${Date.now()}`,
      amount: amount * 100,
      status: "succeeded",
      payment_intent: paymentIntentId,
    };

    return {
      success: true,
      refund,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  createRefund,
};
