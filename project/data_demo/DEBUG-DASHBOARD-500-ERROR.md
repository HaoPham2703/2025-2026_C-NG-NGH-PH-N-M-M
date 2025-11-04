# Debug Dashboard 500 Error

## Vấn đề
Dashboard báo lỗi: **"Request failed with status code 500"**

## Nguyên nhân có thể

### 1. **Order Service hoặc Product Service không chạy**
- Restaurant Service đang gọi trực tiếp Order Service (`http://localhost:4003`)
- Nếu Order Service không chạy → 500 error

### 2. **Order Service route không đúng**
- Route `/api/v1/orders/restaurant/:restaurantId` cần được verify
- Có thể route này không tồn tại hoặc cần authentication

### 3. **Product Service không trả về đúng format**
- Response format có thể khác với expected format

### 4. **Axios chưa được install**
- Restaurant Service cần `axios` dependency

---

## Cách debug

### Bước 1: Kiểm tra services đang chạy
```powershell
# Check if Order Service is running
curl http://localhost:4003/health

# Check if Product Service is running  
curl http://localhost:4002/health

# Check if Restaurant Service is running
curl http://localhost:4006/health
```

### Bước 2: Kiểm tra logs của Restaurant Service
Xem console output của Restaurant Service khi call `/restaurant/stats`:
- Nếu có error về Order Service → Order Service không chạy hoặc route sai
- Nếu có error về Product Service → Product Service không chạy

### Bước 3: Test API trực tiếp

#### Test Order Service:
```bash
# Direct call to Order Service
curl http://localhost:4003/api/v1/orders/restaurant/<restaurantId>
```

#### Test Product Service:
```bash
# Direct call to Product Service
curl "http://localhost:4002/api/v1/products?restaurant=<restaurantId>"
```

### Bước 4: Kiểm tra Restaurant Service logs
Restaurant Service sẽ log chi tiết error:
```javascript
console.error("Error fetching restaurant stats:", error);
console.error("Error details:", {
  message: error.message,
  response: error.response?.data,
  status: error.response?.status,
  url: error.config?.url,
});
```

---

## Solutions đã implement

### 1. **Error Handling**
- ✅ Thêm try-catch riêng cho Product Service (non-critical)
- ✅ Thêm validation cho orders/products arrays
- ✅ Return default values nếu services unavailable

### 2. **Direct Service Calls**
- ✅ Gọi trực tiếp Order Service thay vì qua API Gateway
- ✅ Thêm timeout (5s) để tránh hang
- ✅ Xóa Authorization header (không cần cho internal calls)

### 3. **Logging**
- ✅ Log chi tiết error để debug

---

## Quick Fix

### Nếu Order Service không chạy:
```powershell
cd services/order-service
npm run dev
```

### Nếu Product Service không chạy:
```powershell
cd services/product-service
npm run dev
```

### Nếu Restaurant Service chưa có axios:
```powershell
cd services/restaurant-service
npm install
```

### Restart tất cả services:
```powershell
cd D:\Project\CNPM\chodomixi\CNPM\project
.\restart-services.ps1
```

---

## Expected Behavior

Sau khi fix, Dashboard sẽ:
- ✅ Hiển thị số liệu từ database (có thể là 0 nếu chưa có orders)
- ✅ Không báo lỗi 500
- ✅ Logs sẽ hiển thị successful API calls

---

## Next Steps

1. **Check Restaurant Service console logs** khi vào Dashboard
2. **Verify services đang chạy** (Order, Product, Restaurant)
3. **Check .env file** có đúng service URLs không
4. **Verify restaurant ID** trong localStorage có đúng format không

