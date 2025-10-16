const axios = require("axios");

// Configuration
const services = [
  { name: "API Gateway", url: "http://localhost:3000/health" },
  { name: "User Service", url: "http://localhost:3001/health" },
  { name: "Product Service", url: "http://localhost:3002/health" },
  { name: "Order Service", url: "http://localhost:3003/health" },
  { name: "Payment Service", url: "http://localhost:3004/health" },
];

// Test function
async function testServices() {
  console.log("🧪 Testing FoodFast Microservices...\n");

  const results = [];

  for (const service of services) {
    try {
      console.log(`Testing ${service.name}...`);
      const response = await axios.get(service.url, { timeout: 5000 });

      if (response.status === 200) {
        console.log(`✅ ${service.name}: OK`);
        results.push({ name: service.name, status: "OK", data: response.data });
      } else {
        console.log(`❌ ${service.name}: HTTP ${response.status}`);
        results.push({
          name: service.name,
          status: "ERROR",
          error: `HTTP ${response.status}`,
        });
      }
    } catch (error) {
      console.log(`❌ ${service.name}: ${error.message}`);
      results.push({
        name: service.name,
        status: "ERROR",
        error: error.message,
      });
    }
  }

  console.log("\n📊 Test Results:");
  console.log("================");

  const okCount = results.filter((r) => r.status === "OK").length;
  const errorCount = results.filter((r) => r.status === "ERROR").length;

  results.forEach((result) => {
    const status = result.status === "OK" ? "✅" : "❌";
    console.log(`${status} ${result.name}: ${result.status}`);
  });

  console.log(`\nSummary: ${okCount}/${results.length} services running`);

  if (errorCount > 0) {
    console.log("\n❌ Some services are not running. Please check:");
    results
      .filter((r) => r.status === "ERROR")
      .forEach((result) => {
        console.log(`- ${result.name}: ${result.error}`);
      });
  } else {
    console.log("\n🎉 All services are running successfully!");
  }
}

// Run tests
testServices().catch(console.error);
