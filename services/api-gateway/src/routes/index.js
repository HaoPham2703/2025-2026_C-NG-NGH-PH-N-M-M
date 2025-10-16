const express = require('express');
const { proxies } = require('../middleware/proxy');
const { verifyToken, optionalAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'API Gateway is running',
    timestamp: new Date().toISOString(),
    services: {
      user: process.env.USER_SERVICE_URL || 'http://localhost:3001',
      product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
      order: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
      payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004'
    }
  });
});

// Authentication routes (no auth required)
router.use('/api/v1/auth', proxies.userProxy);

// User routes (require authentication)
router.use('/api/v1/users', verifyToken, proxies.userProxy);

// Product routes (optional authentication for public access)
router.use('/api/v1/products', optionalAuth, proxies.productProxy);
router.use('/api/v1/categories', optionalAuth, proxies.productProxy);
router.use('/api/v1/brands', optionalAuth, proxies.productProxy);

// Order routes (require authentication)
router.use('/api/v1/orders', verifyToken, proxies.orderProxy);

// Payment routes (require authentication)
router.use('/api/v1/payments', verifyToken, proxies.paymentProxy);
router.use('/api/v1/transactions', verifyToken, proxies.paymentProxy);

// Admin routes (require admin role)
router.use('/api/v1/admin/users', verifyToken, requireAdmin, proxies.userProxy);
router.use('/api/v1/admin/products', verifyToken, requireAdmin, proxies.productProxy);
router.use('/api/v1/admin/orders', verifyToken, requireAdmin, proxies.orderProxy);
router.use('/api/v1/admin/payments', verifyToken, requireAdmin, proxies.paymentProxy);

// Catch all for undefined routes
router.all('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      '/api/v1/auth/*',
      '/api/v1/users/*',
      '/api/v1/products/*',
      '/api/v1/orders/*',
      '/api/v1/payments/*',
      '/health'
    ]
  });
});

module.exports = router;
