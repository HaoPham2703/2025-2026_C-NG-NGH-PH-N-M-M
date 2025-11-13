// Script để kiểm tra cấu hình VNPay
require("dotenv").config();

console.log("=== Kiểm tra cấu hình VNPay ===\n");

const requiredVars = [
  "vnp_TmnCode",
  "vnp_HashSecret",
  "vnp_Url",
  "vnp_ReturnUrl",
  "vnp_Locale",
];

let allValid = true;

requiredVars.forEach((varName) => {
  const value = process.env[varName];
  if (!value) {
    console.error(`❌ ${varName}: KHÔNG ĐƯỢC CẤU HÌNH`);
    allValid = false;
  } else {
    // Ẩn secret key
    if (varName === "vnp_HashSecret") {
      const masked =
        value.substring(0, 4) + "..." + value.substring(value.length - 4);
      console.log(`✅ ${varName}: ${masked}`);
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
  }
});

console.log("\n=== Kết quả ===");
if (allValid) {
  console.log("✅ Tất cả biến môi trường đã được cấu hình đúng!");
  console.log("\nBạn có thể test tạo payment URL với:");
  console.log("POST http://localhost:4004/api/v1/payments/create_payment_url");
  console.log('Body: { "amount": 100000 }');
} else {
  console.error("❌ Có biến môi trường chưa được cấu hình!");
  console.log("\nVui lòng:");
  console.log("1. Copy file env.example thành .env");
  console.log("2. Điền đầy đủ các giá trị VNPay vào file .env");
  console.log("3. Khởi động lại Payment Service");
}
