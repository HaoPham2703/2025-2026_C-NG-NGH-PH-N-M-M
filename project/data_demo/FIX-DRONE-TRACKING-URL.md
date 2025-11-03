# 🔧 Sửa Lỗi: Không Vào Được Trang Drone Tracking

## ❌ Vấn Đề

Bạn đang truy cập:

```
http://localhost:3475/drone-tracking
```

**Lỗi:** Route này **KHÔNG TỒN TẠI** vì thiếu `orderId`!

## ✅ Cách Sửa

### Cách 1: Truy Cập Đúng URL (Có OrderID)

URL đúng phải có `orderId`:

```
http://localhost:3475/drone-tracking/<orderId>
```

**Ví dụ:**

```
http://localhost:3475/drone-tracking/507f1f77bcf86cd799439011
```

### Cách 2: Vào Từ Trang Đơn Hàng (Dễ Nhất) ✅

1. **Mở**: `http://localhost:3475/orders`
2. **Login** (nếu chưa login)
3. **Tìm đơn hàng** có status:
   - "Đang giao" (Delivery)
   - "Chờ hàng" (Waiting Goods)
4. **Click button "Theo dõi Drone"** (màu xanh lá)
5. Sẽ tự động redirect đến đúng URL với orderId

### Cách 3: Lấy OrderID Từ Trang Đơn Hàng

1. Vào `http://localhost:3475/orders`
2. Click "Xem chi tiết" của một đơn hàng
3. Xem URL: `/orders/507f1f77bcf86cd799439011`
4. Copy phần ID (sau `/orders/`)
5. Truy cập: `http://localhost:3475/drone-tracking/507f1f77bcf86cd799439011`

## 📋 Checklist

- ✅ Port đúng: **3475** (không phải 5173)
- ✅ URL đúng: `/drone-tracking/<orderId>` (cần có orderId)
- ✅ Đã login chưa? (Route yêu cầu login)
- ✅ Order đã có drone chưa? (Nếu chưa sẽ hiển thị "Chưa có drone")

## 🎯 Quick Test

```bash
# 1. Tạo drones
cd services/drone-service
npm run test:create-drones

# 2. Tạo đơn hàng qua frontend
# http://localhost:3475 -> Login -> Thêm vào giỏ -> Checkout

# 3. Lấy orderId từ URL hoặc từ trang /orders

# 4. Assign drone
cd services/drone-service
node test/assign-drone-to-order.js <orderId>

# 5. Vào trang tracking
# http://localhost:3475/orders -> Click "Theo dõi Drone"
# HOẶC
# http://localhost:3475/drone-tracking/<orderId>
```

## 🔍 Kiểm Tra

**Nếu vẫn không vào được, kiểm tra:**

1. ✅ Frontend có đang chạy không?

   ```bash
   # Check process trên port 3475
   ```

2. ✅ Có lỗi trong Console không? (F12 → Console)

3. ✅ Có đang login không?

   - Nếu chưa login sẽ redirect về `/login`

4. ✅ OrderID có đúng không?

   - OrderID là ObjectId MongoDB (24 ký tự hex)
   - Ví dụ: `507f1f77bcf86cd799439011`

5. ✅ Drone đã được assign chưa?
   - Nếu chưa, trang sẽ hiển thị "Chưa có drone được gán"

## 🐛 Common Errors

### Error 404: Not Found

- ✅ Kiểm tra URL có đúng format: `/drone-tracking/<orderId>`
- ✅ Kiểm tra orderId có tồn tại không

### Redirect to /login

- ✅ Cần login trước
- ✅ Token có thể đã hết hạn

### "Chưa có drone được gán"

- ✅ Chưa assign drone cho order
- ✅ Chạy: `node test/assign-drone-to-order.js <orderId>`

### Map không load

- ✅ Cần internet để load Leaflet CDN
- ✅ Kiểm tra Console có lỗi không

## 💡 Tip

**Cách dễ nhất:** Luôn vào từ trang `/orders` và click button "Theo dõi Drone" thay vì gõ URL thủ công!
