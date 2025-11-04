# Debug: Drone không hiển thị trong Drone Tracking Page

## Vấn đề

Khi vào `http://localhost:3475/drone-tracking/690863a9c35779c8bdd0774c`, drone không hiển thị.

## Nguyên nhân có thể

### 1. **Route Conflict (ĐÃ FIX)**

- Route `/order/:orderId` phải đứng trước `/:id` để tránh conflict
- ✅ Đã sửa: `/order/:orderId` đứng trước `/:id` trong `droneRoutes.js`

### 2. **Drone chưa được assign cho order**

- Order `690863a9c35779c8bdd0774c` có thể chưa có drone được assign
- Cần kiểm tra trong database hoặc assign drone

### 3. **API Call không đúng format**

- ✅ Đã sửa: `droneApi.getDroneByOrderId` để xử lý 404 và return đúng format

## Cách kiểm tra

### Bước 1: Kiểm tra Drone có được assign không

```bash
# Query MongoDB để kiểm tra
# Connect to MongoDB
mongosh

# Switch to drone database
use fastfood_drones

# Tìm drone có orderId = "690863a9c35779c8bdd0774c"
db.drones.find({ orderId: "690863a9c35779c8bdd0774c" })
```

### Bước 2: Test API endpoint trực tiếp

```bash
# Test endpoint
curl http://localhost:5001/api/v1/drones/order/690863a9c35779c8bdd0774c

# Hoặc trực tiếp từ Drone Service (bypass API Gateway)
curl http://localhost:4007/api/v1/drones/order/690863a9c35779c8bdd0774c
```

### Bước 3: Assign drone cho order (nếu chưa có)

#### Cách 1: Qua Drone Hub

1. Vào `http://localhost:3475/drone-hub`
2. Chọn một drone available
3. Assign cho order `690863a9c35779c8bdd0774c`

#### Cách 2: Qua API

```bash
curl -X POST http://localhost:5001/api/v1/drones/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "droneId": "<drone-id>",
    "orderId": "690863a9c35779c8bdd0774c"
  }'
```

#### Cách 3: Dùng script

```javascript
// Tạo file assign-drone.js
const axios = require("axios");

async function assignDrone() {
  try {
    const response = await axios.post(
      "http://localhost:5001/api/v1/drones/assign",
      {
        droneId: "DRONE-001", // Thay bằng drone ID thật
        orderId: "690863a9c35779c8bdd0774c",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.TOKEN}`, // Nếu cần
        },
      }
    );
    console.log("Drone assigned:", response.data);
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

assignDrone();
```

## Fixes đã apply

### 1. Route order (droneRoutes.js)

- ✅ Route `/order/:orderId` được đặt trước `/:id` để tránh conflict

### 2. Error handling (droneApi.js)

- ✅ Xử lý 404 error để return `{ status: "error", data: null }` thay vì throw

### 3. UI error handling (DroneTrackingPage.jsx)

- ✅ Hiển thị message "Chưa có drone được gán" khi drone không tồn tại

## Next Steps

1. **Kiểm tra database**: Xem order có drone chưa
2. **Assign drone**: Nếu chưa có, assign một drone cho order
3. **Restart Drone Service**: Nếu đã sửa route, restart service
4. **Test lại**: Refresh trang và kiểm tra

## Expected Behavior sau khi fix

1. ✅ Nếu có drone: Hiển thị map với drone marker và destination
2. ✅ Nếu chưa có drone: Hiển thị message "Chưa có drone được gán"
3. ✅ Route `/drones/order/:orderId` hoạt động đúng

