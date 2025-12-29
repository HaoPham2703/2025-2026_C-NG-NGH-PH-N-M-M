require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Services configured:`);
  console.log(
    `   - User Service: ${
      process.env.USER_SERVICE_URL || "http://localhost:4001"
    }`
  );
  console.log(
    `   - Product Service: ${
      process.env.PRODUCT_SERVICE_URL || "http://localhost:4002"
    }`
  );
  console.log(
    `   - Order Service: ${
      process.env.ORDER_SERVICE_URL || "http://localhost:4003"
    }`
  );
  console.log(
    `   - Payment Service: ${
      process.env.PAYMENT_SERVICE_URL || "http://localhost:4004"
    }`
  );
});
