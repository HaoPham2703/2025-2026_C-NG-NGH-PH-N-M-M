const express = require("express");
const paymentController = require("../controllers/paymentController");

const router = express.Router();

// VNPay routes
router.route("/create_payment_url").post(paymentController.createPaymentUrl);
router
  .route("/return_payment_status")
  .post(paymentController.returnPaymentStatus);

// PayPal routes
router
  .route("/return_paypal_status")
  .post(paymentController.returnPaypalStatus);

// Stripe routes
router
  .route("/stripe/create-payment-intent")
  .post(paymentController.createStripePayment);
router
  .route("/stripe/confirm-payment")
  .post(paymentController.confirmStripePayment);

// Refund routes
router.route("/refund").post(paymentController.createRefund);

// Transaction routes
router
  .route("/get-all-payments")
  .get(paymentController.setUser, paymentController.getAllPayments);

router.route("/:id").get(paymentController.getPayment);

module.exports = router;
