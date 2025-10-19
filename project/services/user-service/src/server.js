const app = require("./app");
require("dotenv").config();

const PORT = process.env.PORT || 4001;

app.listen(PORT, () => {
  console.log(`🚀 User Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(
    `🔗 Database: ${
      process.env.DB_URL || "mongodb://localhost:27017/fastfood_users"
    }`
  );
});
