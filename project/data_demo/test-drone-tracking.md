# Hướng dẫn Test Trang Drone Tracking

## Bước 1: Đảm bảo các services đang chạy

```bash
# Start tất cả services
.\start-all.ps1

# Hoặc start từng service:
# - API Gateway (port 5001)
# - User Service (port 4001)
# - Product Service (port 4002)
# - Order Service (port 4003)
# - Drone Service (port 4007)
# - Frontend (port 5173 hoặc 5174)
```

## Bước 2: Tạo drones mẫu trong database

Chạy script để tạo drones:

```bash
cd services/drone-service
node test/create-drones.js
```

Hoặc tạo thủ công qua API:

```bash
# Get available drones (nếu có)
curl http://localhost:5001/api/v1/drones/available

# Nếu chưa có, tạo drone mới (cần token)
POST http://localhost:5001/api/v1/drones
Headers: Authorization: Bearer <token>
Body:
{
  "droneId": "DRONE_001",
  "name": "Drone Giao Hàng 1",
  "currentLocation": {
    "latitude": 10.7769,
    "longitude": 106.7009,
    "altitude": 50
  },
  "speed": 40,
  "batteryLevel": 100
}
```

## Bước 3: Tạo đơn hàng

1. Login vào frontend: `http://localhost:5173/login`
2. Thêm sản phẩm vào giỏ hàng
3. Checkout và tạo đơn hàng
4. Lưu lại `orderId` từ đơn hàng vừa tạo

## Bước 4: Assign drone cho đơn hàng

Có 2 cách:

### Cách 1: Qua API (dùng Postman/curl)

```bash
POST http://localhost:5001/api/v1/drones/assign
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json
Body:
{
  "droneId": "DRONE_001",
  "orderId": "<orderId_vừa_tạo>"
}

# Hoặc với destination tùy chỉnh:
{
  "droneId": "DRONE_001",
  "orderId": "<orderId_vừa_tạo>",
  "destination": {
    "latitude": 10.8231,
    "longitude": 106.6297,
    "address": "123 Đường ABC, Quận 1, TP.HCM"
  }
}
```

### Cách 2: Qua Script (sẽ tạo script)

Chạy script test:

```bash
node test/assign-drone-to-order.js <orderId>
```

## Bước 5: Truy cập trang Tracking

1. Vào trang đơn hàng: `http://localhost:5173/orders`
2. Click vào đơn hàng đã được assign drone
3. Click button "Theo dõi Drone" (hiển thị khi order status = "Delivery" hoặc "Waiting Goods")
4. Hoặc truy cập trực tiếp: `http://localhost:5173/drone-tracking/<orderId>`

## Bước 6: Xem kết quả

Trang tracking sẽ hiển thị:

- ✅ Bản đồ với marker drone (màu xanh) và điểm đến (màu đỏ)
- ✅ Đường bay (flight path)
- ✅ Thông tin drone: tên, trạng thái, pin, tốc độ
- ✅ Vị trí hiện tại và điểm đến
- ✅ Khoảng cách và thời gian ước tính
- ✅ Cập nhật real-time qua Socket.IO (hoặc polling mỗi 5 giây)

## Kiểm tra Logs

Để xem drone simulation đang chạy:

```bash
# Xem logs của drone service
# Console sẽ hiển thị:
# - Drone simulation đang chạy
# - Location updates
# - Status changes
```

## Troubleshooting

### Không thấy drone trên map

- ✅ Kiểm tra drone đã được assign chưa: `GET /api/v1/drones/order/<orderId>`
- ✅ Kiểm tra drone có `currentLocation` và `destination` không
- ✅ Mở Console (F12) xem có lỗi không

### Map không load

- ✅ Kiểm tra internet (Leaflet CDN cần internet)
- ✅ Xem Console có lỗi về Leaflet không

### Drone không di chuyển

- ✅ Kiểm tra drone service logs - simulation có đang chạy không
- ✅ Kiểm tra drone status - phải là "assigned" hoặc "flying"
- ✅ Refresh trang để reload

### Socket.IO không kết nối

- ✅ Kiểm tra drone service có đang chạy không (port 4007)
- ✅ Xem Console có lỗi kết nối không
- ✅ Nếu Socket.IO fail, trang vẫn dùng polling mỗi 5 giây

## Test với nhiều drones

1. Tạo nhiều drones:

```bash
DRONE_001, DRONE_002, DRONE_003, ...
```

2. Assign cho nhiều orders khác nhau

3. Mở nhiều tab để track nhiều drones cùng lúc

## API Endpoints hữu ích

```bash
# Get all drones
GET /api/v1/drones

# Get available drones
GET /api/v1/drones/available

# Get drone by order ID
GET /api/v1/drones/order/:orderId

# Get drone by ID
GET /api/v1/drones/:id

# Assign drone to order
POST /api/v1/drones/assign

# Update drone status
PATCH /api/v1/drones/:id/status

# Update drone location
PATCH /api/v1/drones/:id/location
```
