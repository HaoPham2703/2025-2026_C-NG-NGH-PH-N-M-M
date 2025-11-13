# Quick Fix Guide - Payment Service 2 Connection Issue

## Vấn đề

Frontend không thể kết nối đến Payment Service 2 (port 3005) với lỗi "Cannot connect".

## Giải pháp đã áp dụng

### 1. Thêm Vite Proxy

Đã thêm proxy trong `vite.config.js` để frontend gọi qua proxy thay vì trực tiếp:

```javascript
"/payment-service-2": {
  target: "http://localhost:3005",
  changeOrigin: true,
  secure: false,
  rewrite: (path) => path.replace(/^\/payment-service-2/, ""),
}
```

### 2. Cập nhật paymentApi2.js

Đã cập nhật để sử dụng proxy path trong development:

```javascript
baseURL: isDevelopment
  ? "/payment-service-2/api/v1" // Use Vite proxy
  : "http://localhost:3005/api/v1"; // Direct connection
```

### 3. Cải thiện CORS và Helmet

- Đã tắt CSP trong helmet cho development
- Đã thêm debug logging để theo dõi requests

## Các bước để fix

1. **Restart Frontend (Vite Dev Server)**

   ```bash
   cd Frontend-mirco
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Đảm bảo Payment Service 2 đang chạy**

   ```bash
   cd services/payment-service-2
   npm start
   ```

3. **Kiểm tra service**

   - Health check: http://localhost:3005/health
   - Nên thấy: `{"status":"success","message":"Payment Service 2 (VNPay Sandbox) is running",...}`

4. **Test từ browser**
   - Mở http://localhost:3475
   - Mở Developer Tools (F12)
   - Vào tab Network
   - Thử thanh toán với VNPay
   - Kiểm tra request có được gửi đến `/payment-service-2/api/v1/payments/create_payment_url` không

## Nếu vẫn không hoạt động

1. **Kiểm tra console logs trong browser**

   - Xem có lỗi CORS không
   - Xem có lỗi network không

2. **Kiểm tra terminal của Payment Service 2**

   - Xem có request nào đến không
   - Xem có lỗi gì không

3. **Kiểm tra port 3005**

   ```powershell
   netstat -ano | findstr :3005
   ```

   - Nên thấy process đang LISTENING

4. **Test trực tiếp API**
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:3005/health" -Method GET
   ```

## Alternative: Sử dụng API Gateway

Nếu vẫn gặp vấn đề, có thể route Payment Service 2 qua API Gateway:

1. Thêm route trong API Gateway
2. Cập nhật paymentApi2.js để gọi qua API Gateway











