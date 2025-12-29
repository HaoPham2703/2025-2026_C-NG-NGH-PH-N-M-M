# Debug: Auto-Assign Drone không hoạt động

## Vấn đề

Khi vào trang drone tracking, hiển thị: "Chưa có drone được gán cho đơn hàng này"

## Nguyên nhân có thể

### 1. **Order status chưa đúng**

Auto-assign chỉ chạy khi:

- Order được tạo với status = `"Delivery"` hoặc `"Waiting Goods"`
- HOẶC Order status được update sang `"Delivery"` hoặc `"Waiting Goods"`

### 2. **Không có drone available**

- Tất cả drone đang busy (status ≠ "available")
- Cần tạo thêm drone hoặc đợi drone về

### 3. **Auto-assign bị fail nhưng không thấy error**

- Order Service chưa restart
- API Gateway chưa chạy
- Network issue giữa Order Service và Drone Service

### 4. **Order Service chưa có code mới**

- Code auto-assign mới chưa được load
- Cần restart Order Service

---

## Cách debug

### Bước 1: Kiểm tra Order status

```javascript
// Trong browser console hoặc Postman
GET http://localhost:5001/api/v1/orders/{orderId}

// Kiểm tra response:
{
  "status": "success",
  "data": {
    "order": {
      "_id": "...",
      "status": "Processed" // ← Cần phải là "Delivery" hoặc "Waiting Goods"
    }
  }
}
```

### Bước 2: Kiểm tra drone available

```bash
# Test API Gateway
curl http://localhost:5001/api/v1/drones/available

# Hoặc trực tiếp Drone Service
curl http://localhost:4007/api/v1/drones/available
```

**Expected response:**

```json
{
  "status": "success",
  "results": 1,
  "data": [
    {
      "droneId": "DRONE-001",
      "status": "available",
      ...
    }
  ]
}
```

### Bước 3: Kiểm tra Order Service logs

Mở terminal chạy Order Service và xem logs:

```
[autoAssignDrone] No available drones for order 690863a9c35779c8bdd0774c
// Hoặc
[autoAssignDrone] Successfully assigned drone DRONE-001 to order 690863a9c35779c8bdd0774c
// Hoặc
[autoAssignDrone] Error assigning drone to order 690863a9c35779c8bdd0774c: ...
```

### Bước 4: Test manual trigger auto-assign

#### Cách 1: Update order status

```bash
# Update order status sang "Delivery" hoặc "Waiting Goods"
PATCH http://localhost:5001/api/v1/orders/{orderId}/status
Content-Type: application/json
Authorization: Bearer {token}

{
  "status": "Delivery"
}
```

Sau đó kiểm tra xem drone có được assign không:

```bash
GET http://localhost:5001/api/v1/drones/order/{orderId}
```

#### Cách 2: Tạo order mới với status "Delivery"

```bash
POST http://localhost:5001/api/v1/orders
Content-Type: application/json
Authorization: Bearer {token}

{
  "status": "Delivery",
  "cart": [...],
  ...
}
```

### Bước 5: Kiểm tra API Gateway route

```bash
# Test API Gateway health
curl http://localhost:5001/health

# Test drone available endpoint qua API Gateway
curl http://localhost:5001/api/v1/drones/available
```

---

## Giải pháp

### Giải pháp 1: Update order status

1. Vào trang đơn hàng: `/orders/{orderId}`
2. Update status sang "Delivery" hoặc "Waiting Goods"
3. Auto-assign sẽ tự động chạy
4. Refresh trang tracking: `/drone-tracking/{orderId}`

### Giải pháp 2: Manual assign qua Drone Hub

1. Vào `/drone-hub`
2. Chọn một drone available
3. Assign cho order bằng cách:
   - Click vào drone
   - Hoặc dùng API:
     ```bash
     POST http://localhost:5001/api/v1/drones/assign
     {
       "droneId": "DRONE-001",
       "orderId": "690863a9c35779c8bdd0774c"
     }
     ```

### Giải pháp 3: Tạo thêm drone

1. Vào `/drone-hub`
2. Click "Tạo Drone Mới"
3. Điền thông tin và tạo
4. Drone mới sẽ có status = "available"
5. Auto-assign sẽ tự động dùng drone này

### Giải pháp 4: Restart services

```powershell
# Restart Order Service
cd services/order-service
npm run dev

# Restart API Gateway (nếu cần)
cd services/api-gateway
npm run dev

# Restart Drone Service (nếu cần)
cd services/drone-service
npm run dev
```

---

## Expected Flow

### Khi order status = "Delivery" hoặc "Waiting Goods":

1. **Order Service** detect status change
2. Gọi `autoAssignDroneToOrder(orderId)`
3. **Order Service** → **API Gateway** (`GET /api/v1/drones/available`)
4. **API Gateway** → **Drone Service**
5. **Drone Service** return available drones
6. **Order Service** chọn drone đầu tiên
7. **Order Service** → **API Gateway** (`POST /api/v1/drones/assign`)
8. **API Gateway** → **Drone Service**
9. **Drone Service** assign drone và bắt đầu simulation
10. User vào `/drone-tracking/{orderId}` → thấy drone

---

## Checklist

- [ ] Order status là "Delivery" hoặc "Waiting Goods"?
- [ ] Có drone available không?
- [ ] Order Service đã restart sau khi update code?
- [ ] API Gateway đang chạy?
- [ ] Drone Service đang chạy?
- [ ] Kiểm tra Order Service logs có error không?
- [ ] Test manual assign có hoạt động không?

---

## Test nhanh

```bash
# 1. Kiểm tra có drone available
curl http://localhost:5001/api/v1/drones/available

# 2. Nếu có, manual assign
curl -X POST http://localhost:5001/api/v1/drones/assign \
  -H "Content-Type: application/json" \
  -d '{
    "droneId": "DRONE-001",
    "orderId": "690863a9c35779c8bdd0774c"
  }'

# 3. Kiểm tra drone đã được assign
curl http://localhost:5001/api/v1/drones/order/690863a9c35779c8bdd0774c
```

