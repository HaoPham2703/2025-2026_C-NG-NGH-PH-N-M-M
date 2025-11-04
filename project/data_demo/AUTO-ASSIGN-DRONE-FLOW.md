# Auto-Assign Drone Flow - Tự động gán Drone cho đơn hàng

## ✅ Cách hoạt động (Đã implement)

### Flow tự động

1. **Order được tạo** hoặc **Order status thay đổi**:

   - Order status = `"Delivery"` hoặc `"Waiting Goods"`

2. **Order Service tự động**:

   - Gọi Drone Service API: `GET /api/v1/drones/available`
   - Lấy danh sách drone có status = `"available"`
   - Chọn drone đầu tiên available
   - Gọi `POST /api/v1/drones/assign` với:
     ```json
     {
       "droneId": "DRONE-001",
       "orderId": "690863a9c35779c8bdd0774c"
     }
     ```

3. **Drone Service xử lý**:

   - Kiểm tra drone có available không
   - Lấy địa chỉ order từ Order Service
   - Geocode địa chỉ → coordinates
   - Update drone:
     - `status` = `"assigned"` → `"flying"` → `"delivering"`
     - `orderId` = order ID
     - `destination` = địa chỉ giao hàng
   - Bắt đầu simulation di chuyển

4. **Người dùng xem tracking**:
   - Vào `/drone-tracking/{orderId}`
   - Frontend gọi: `GET /api/v1/drones/order/{orderId}`
   - Hiển thị drone trên map với real-time updates

---

## 🔧 Implementation Details

### 1. Order Service (`orderController.js`)

#### Auto-assign function:

```javascript
const autoAssignDroneToOrder = async (orderId) => {
  // 1. Get available drones via API Gateway
  // 2. Select first available
  // 3. Assign to order via API Gateway
};
```

**Important**: All service-to-service calls go through API Gateway (`http://localhost:5001`) for consistent routing and authentication.

#### Trigger points:

- ✅ Khi tạo order với status "Delivery" hoặc "Waiting Goods"
- ✅ Khi update order status sang "Delivery" hoặc "Waiting Goods"

### 2. Drone Service (`droneController.js`)

#### `assignDroneToOrder`:

- Kiểm tra drone available
- Tự động lấy địa chỉ order và geocode
- Update drone status và location
- Tính toán estimated arrival time
- Bắt đầu simulation

### 3. Frontend

#### `DroneTrackingPage`:

- Query drone theo orderId
- Hiển thị map với Leaflet
- Real-time updates via Socket.IO hoặc polling
- Hiển thị thông tin: location, battery, speed, ETA

---

## 📋 Workflow Example

### Scenario: User đặt đơn hàng

1. **User checkout** → Order được tạo với status `"Processed"`
2. **Restaurant xác nhận** → Order status → `"Waiting Goods"`
3. **Order Service auto-trigger**:
   ```
   Status changed to "Waiting Goods"
   → Call autoAssignDroneToOrder(orderId)
   → Get available drones
   → Assign DRONE-001 to order
   ```
4. **Drone Service**:
   ```
   Receive assign request
   → Fetch order address
   → Geocode address
   → Update drone: assigned → flying
   → Start simulation
   ```
5. **User vào tracking page**:
   ```
   /drone-tracking/690863a9c35779c8bdd0774c
   → Frontend calls: GET /api/v1/drones/order/690863a9c35779c8bdd0774c
   → Display drone on map
   → Real-time updates every 5 seconds
   ```

---

## ⚙️ Configuration

### Order Service `.env`:

```
API_GATEWAY_URL=http://localhost:5001
```

**Note**: Order Service calls Drone Service via API Gateway, not directly.

### Drone Service `.env`:

```
ORDER_SERVICE_URL=http://localhost:4003
API_GATEWAY_URL=http://localhost:5001
```

---

## 🔍 Kiểm tra

### Test auto-assign:

1. **Tạo order với status "Delivery"**:

   ```bash
   POST /api/v1/orders
   {
     "status": "Delivery",
     ...
   }
   ```

2. **Update order status sang "Delivery"**:

   ```bash
   PATCH /api/v1/orders/{orderId}/status
   {
     "status": "Delivery"
   }
   ```

3. **Kiểm tra drone được assign**:
   ```bash
   GET /api/v1/drones/order/{orderId}
   ```

### Expected Result:

- ✅ Drone có `orderId` = order ID
- ✅ Drone status = "assigned", "flying", hoặc "delivering"
- ✅ Drone có `destination` với coordinates
- ✅ Tracking page hiển thị drone trên map

---

## ⚠️ Lưu ý

1. **Nếu không có drone available**:

   - Order vẫn được tạo/update thành công
   - Không có drone được assign
   - User sẽ thấy "Chưa có drone được gán" khi vào tracking

2. **Nếu assignment fail**:

   - Order vẫn được tạo/update thành công
   - Error được log nhưng không block order flow
   - Có thể retry manual qua Drone Hub

3. **Manual override**:
   - Admin/Staff vẫn có thể assign drone manual qua:
     - Drone Hub UI: `/drone-hub`
     - API: `POST /api/v1/drones/assign`

---

## 🎯 Benefits

- ✅ **Automatic**: Không cần manual assign
- ✅ **Seamless**: User chỉ cần đặt hàng, drone tự động được gán
- ✅ **Real-time**: Tracking updates ngay khi có drone
- ✅ **Fault-tolerant**: Nếu assignment fail, order vẫn hoạt động
