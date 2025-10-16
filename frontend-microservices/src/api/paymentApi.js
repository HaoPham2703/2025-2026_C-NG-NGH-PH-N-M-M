import axiosClient from './axiosClient';

export const paymentApi = {
  // VNPay
  createVNPayUrl: (data) => axiosClient.post('/payments/create_payment_url', data),
  returnVNPayStatus: (data) => axiosClient.post('/payments/return_payment_status', data),
  
  // PayPal
  returnPayPalStatus: (data) => axiosClient.post('/payments/return_paypal_status', data),
  
  // Stripe
  createStripePayment: (data) => axiosClient.post('/payments/stripe/create-payment-intent', data),
  confirmStripePayment: (data) => axiosClient.post('/payments/stripe/confirm-payment', data),
  
  // Refunds
  createRefund: (data) => axiosClient.post('/payments/refund', data),
  
  // Transaction history
  getPayments: (params) => axiosClient.get('/payments/get-all-payments', { params }),
  getPayment: (id) => axiosClient.get(`/payments/${id}`),
};
