const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Example JWT auth middleware
app.use((req, res, next) => {
  if (req.headers.authorization) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, 'secret');
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }
  next();
});

// Proxy routes
app.use('/users', createProxyMiddleware({ target: 'http://user-service:8001', changeOrigin: true }));
app.use('/products', createProxyMiddleware({ target: 'http://product-service:8002', changeOrigin: true }));
app.use('/cart', createProxyMiddleware({ target: 'http://cart-service:8003', changeOrigin: true }));
app.use('/orders', createProxyMiddleware({ target: 'http://order-service:8004', changeOrigin: true }));
app.use('/payments', createProxyMiddleware({ target: 'http://payment-service:8005', changeOrigin: true }));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
