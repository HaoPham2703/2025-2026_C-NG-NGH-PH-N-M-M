import { paymentClient } from "./axiosClients";

export const paymentApi = {
  // VNPay
  createVNPayUrl: (data) =>
    paymentClient.post("/payments/create_payment_url", data),
  returnVNPayStatus: (data) =>
    paymentClient.post("/payments/return_payment_status", data),

  // PayPal
  returnPayPalStatus: (data) =>
    paymentClient.post("/payments/return_paypal_status", data),

  // Stripe
  createStripePayment: (data) =>
    paymentClient.post("/payments/stripe/create-payment-intent", data),
  confirmStripePayment: (data) =>
    paymentClient.post("/payments/stripe/confirm-payment", data),

  // Refunds
  createRefund: (data) => paymentClient.post("/payments/refund", data),

  // Transaction history
  getPayments: (params) =>
    paymentClient.get("/payments/get-all-payments", { params }),
  getPayment: (id) => paymentClient.get(`/payments/${id}`),
};
