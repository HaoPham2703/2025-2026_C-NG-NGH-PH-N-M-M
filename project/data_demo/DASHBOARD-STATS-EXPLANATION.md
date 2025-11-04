# Giải thích số liệu Dashboard Restaurant

## ⚠️ Hiện trạng

**Số liệu đang là HARDCODED (fake data), không lấy từ database!**

### Trong `DashboardContent.jsx` (dòng 14-28):

```javascript
// TODO: Replace with actual API calls
const { data: stats } = useQuery("restaurantStats", async () => {
  // Placeholder data - FAKE DATA!
  return {
    totalRevenue: 45000000, // Hardcoded
    totalOrders: 234, // Hardcoded
    pendingOrders: 12, // Hardcoded
    completedOrders: 210, // Hardcoded
    totalProducts: 48, // Hardcoded
    activeProducts: 42, // Hardcoded
    revenueGrowth: 15.3, // Hardcoded
    ordersGrowth: 8.5, // Hardcoded
  };
});
```

**Kết luận:** Tất cả số liệu hiển thị đều là **giả**, không phải từ database thật.

---

## 💡 Cần làm gì để lấy data thật?

### 1. **Doanh thu (totalRevenue)**

- Query từ Order Service: Tổng `totalPrice` của các orders có status "Success" và `restaurant` = restaurantId
- Hoặc tính từ Payment Service (nếu có)

### 2. **Tổng đơn hàng (totalOrders)**

- Query từ Order Service: Count orders có `restaurant` = restaurantId

### 3. **Đơn chờ xử lý (pendingOrders)**

- Query từ Order Service: Count orders có status "Pending" và `restaurant` = restaurantId

### 4. **Món ăn (totalProducts/activeProducts)**

- Query từ Product Service: Count products có `restaurant` = restaurantId
- `totalProducts`: Tổng số products
- `activeProducts`: Products có `inventory > 0` hoặc status active

### 5. **Growth Rate (revenueGrowth, ordersGrowth)**

- So sánh tháng hiện tại vs tháng trước
- Hoặc so sánh tuần hiện tại vs tuần trước

---

## 🔧 Cách implement

### Option 1: Tạo API endpoint trong Restaurant Service

Sửa `restaurantController.getStats` để query thật từ:

- Order Service (orders, revenue)
- Product Service (products count)

### Option 2: Query trực tiếp từ Frontend

Frontend query từ nhiều services:

- Order Service: `/api/v1/orders?restaurant=restaurantId`
- Product Service: `/api/v1/products?restaurant=restaurantId`

### Option 3: Tạo Dashboard API riêng

Tạo endpoint `/api/restaurant/dashboard` để aggregate data từ nhiều services.

---

## 📝 Recommendation

**Nên implement Option 1** - Sửa `restaurantController.getStats`:

1. Query orders từ Order Service (via HTTP hoặc shared DB)
2. Query products từ Product Service
3. Calculate statistics
4. Return real data

**Lợi ích:**

- Centralized logic
- Frontend chỉ cần gọi 1 API
- Dễ maintain và cache

