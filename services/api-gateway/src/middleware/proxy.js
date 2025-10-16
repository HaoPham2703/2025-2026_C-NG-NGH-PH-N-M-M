const { createProxyMiddleware } = require('http-proxy-middleware');
const { serviceRoutes } = require('../config/services');

// Create proxy middleware for each service
const createServiceProxy = (target, pathRewrite = {}) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    onError: (err, req, res) => {
      console.error(`Proxy error for ${req.url}:`, err.message);
      res.status(503).json({
        status: 'error',
        message: 'Service temporarily unavailable',
        service: target
      });
    },
    onProxyReq: (proxyReq, req, res) => {
      // Add correlation ID for tracing
      const correlationId = req.headers['x-correlation-id'] || 
                           `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      proxyReq.setHeader('x-correlation-id', correlationId);
      proxyReq.setHeader('x-forwarded-for', req.ip);
      proxyReq.setHeader('x-user-agent', req.get('User-Agent'));
      
      console.log(`[${correlationId}] Proxying ${req.method} ${req.url} to ${target}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      const correlationId = req.headers['x-correlation-id'];
      console.log(`[${correlationId}] Response ${proxyRes.statusCode} from ${target}`);
    }
  });
};

// Specific proxy configurations
const proxies = {
  // User service proxy
  userProxy: createServiceProxy(serviceRoutes['/api/v1/users']),
  
  // Product service proxy
  productProxy: createServiceProxy(serviceRoutes['/api/v1/products']),
  
  // Order service proxy
  orderProxy: createServiceProxy(serviceRoutes['/api/v1/orders']),
  
  // Payment service proxy
  paymentProxy: createServiceProxy(serviceRoutes['/api/v1/payments'])
};

// Health check proxy
const healthCheckProxy = createServiceProxy('http://localhost:3001', {
  '^/health': '/health'
});

module.exports = {
  proxies,
  healthCheckProxy,
  createServiceProxy
};
