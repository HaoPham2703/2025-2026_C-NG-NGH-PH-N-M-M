# Quick Fix: Auto-Assign Drone không hoạt động

## ⚡ Cách nhanh nhất để fix

### Bước 1: Kiểm tra và tạo drone (nếu chưa có)

```powershell
# Vào folder drone-service
cd services/drone-service

# Chạy script tạo test drones
npm run test:create-drones
```

Hoặc vào `/drone-hub` và tạo drone bằng UI.

### Bước 2: Update order status để trigger auto-assign

**Cách 1: Qua Frontend (Restaurant Dashboard)**

1. Vào `/restaurant/dashboard/orders`
2. Tìm order cần assign drone
3. Click "Xác nhận đơn" hoặc "Món đã sẵn sàng"
4. Order status sẽ đổi → auto-assign sẽ chạy

**Cách 2: Qua API**

```bash
# Lấy token từ browser localStorage (token)
TOKEN="your-token-here"
ORDER_ID="690863a9c35779c8bdd0774c"

# Update order status
curl -X PATCH http://localhost:5001/api/v1/orders/$ORDER_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status": "Delivery"}'
```

### Bước 3: Kiểm tra drone đã được assign

```bash
# Kiểm tra qua API
curl http://localhost:5001/api/v1/drones/order/$ORDER_ID

# Hoặc refresh trang tracking: /drone-tracking/{orderId}
```

---

## 🔍 Debug nhanh

### 1. Order status là gì?

```bash
# Check order status
curl http://localhost:5001/api/v1/orders/690863a9c35779c8bdd0774c \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Nếu status ≠ "Delivery" và ≠ "Waiting Goods"**: Auto-assign không chạy!

### 2. Có drone available không?

```bash
# Check available drones
curl http://localhost:5001/api/v1/drones/available
```

**Nếu kết quả rỗng**: Cần tạo thêm drone!

### 3. Check Order Service logs

Mở terminal chạy Order Service, tìm dòng:

- `[autoAssignDrone] Successfully assigned...` ✅
- `[autoAssignDrone] No available drones...` ❌
- `[autoAssignDrone] Error assigning...` ❌

---

## ✅ Giải pháp tạm thời: Manual Assign

Nếu auto-assign không hoạt động, assign manual:

### Qua Drone Hub UI:

1. Vào `http://localhost:3475/drone-hub`
2. Chọn một drone available
3. Click "Assign to Order"
4. Nhập order ID

### Qua API:

```bash
curl -X POST http://localhost:5001/api/v1/drones/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "droneId": "DRONE-001",
    "orderId": "690863a9c35779c8bdd0774c"
  }'
```

---

## 🚨 Common Issues

### Issue 1: "No available drones"

**Fix**: Tạo thêm drone hoặc đợi drone về (status = "available")

### Issue 2: "Order status không đúng"

**Fix**: Update order status sang "Delivery" hoặc "Waiting Goods"

### Issue 3: "Order Service chưa restart"

**Fix**: Restart Order Service để load code mới:

```powershell
cd services/order-service
npm run dev
```

### Issue 4: "API Gateway không chạy"

**Fix**: Start API Gateway:

```powershell
cd services/api-gateway
npm run dev
```

