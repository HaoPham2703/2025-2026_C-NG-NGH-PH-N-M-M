# 🚁 Cách Vào Trang Drone Tracking

## 3 Cách Đơn Giản

### ✅ Cách 1: Từ Trang Danh Sách Đơn Hàng (Dễ Nhất)

1. **Login vào website**: `http://localhost:5173/login`
2. **Vào trang đơn hàng**: Click "Đơn Hàng Của Tôi" hoặc truy cập `/orders`
3. **Tìm đơn hàng** có status:
   - ✅ **"Đang giao"** (Delivery)
   - ✅ **"Chờ hàng"** (Waiting Goods)
4. **Click button "Theo dõi Drone"** màu xanh lá (mới thêm)

### ✅ Cách 2: Từ Trang Chi Tiết Đơn Hàng

1. Vào trang `/orders`
2. Click **"Xem chi tiết"** của đơn hàng
3. Nếu đơn hàng có status **"Đang giao"** hoặc **"Chờ hàng"**
4. Sẽ thấy button **"Theo dõi Drone"** ở dưới cùng
5. Click vào button đó

### ✅ Cách 3: Truy Cập Trực Tiếp (Nếu biết OrderID)

Mở trình duyệt và gõ:

```
http://localhost:5173/drone-tracking/<orderId>
```

**Ví dụ:**

```
http://localhost:5173/drone-tracking/507f1f77bcf86cd799439011
```

**Làm sao lấy OrderID?**

- Xem trong URL khi vào trang chi tiết đơn hàng: `/orders/507f1f77bcf86cd799439011`
- Hoặc mở Developer Tools (F12) → Console → gõ `localStorage.getItem('user')` để xem thông tin user

## 📝 Lưu Ý

- Button "Theo dõi Drone" **CHỈ HIỂN THỊ** khi:
  - Order status = **"Delivery"** (Đang giao)
  - Order status = **"Waiting Goods"** (Chờ hàng)
- Nếu order chưa có drone được assign, trang sẽ hiển thị thông báo "Chưa có drone được gán"

- Để test, cần:
  1. Tạo đơn hàng
  2. Assign drone cho đơn hàng đó (xem file `test-drone-tracking.md`)
  3. Sau đó vào trang tracking

## 🎯 Quick Test

```bash
# 1. Tạo drones
cd services/drone-service
npm run test:create-drones

# 2. Tạo đơn hàng qua frontend, lấy orderId

# 3. Assign drone
node test/assign-drone-to-order.js <orderId>

# 4. Vào trang: http://localhost:5173/orders
# 5. Click button "Theo dõi Drone" màu xanh lá
```

## 🐛 Troubleshooting

**Không thấy button?**

- ✅ Kiểm tra order status có phải "Delivery" hoặc "Waiting Goods" không
- ✅ Refresh trang
- ✅ Kiểm tra đã assign drone chưa

**Button có nhưng không vào được?**

- ✅ Kiểm tra drone service có đang chạy không (port 4007)
- ✅ Kiểm tra console (F12) xem có lỗi không

**Trang drone hiển thị "Chưa có drone"?**

- ✅ Chưa assign drone cho order đó
- ✅ Chạy: `node test/assign-drone-to-order.js <orderId>`

