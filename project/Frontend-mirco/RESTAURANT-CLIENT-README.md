# Restaurant Client - Giao diện Nhà hàng

Giao diện quản lý dành cho nhà hàng trong mô hình C2C (Consumer-to-Consumer)

## 📁 Cấu trúc thư mục

```
src/pages-restaurant-client/
├── RestaurantLoginPage.jsx          # Trang đăng nhập
├── RestaurantSignupPage.jsx         # Trang đăng ký nhà hàng
├── RestaurantDashboard.jsx          # Layout dashboard với sidebar
├── DashboardContent.jsx             # Trang tổng quan/dashboard
├── ProductsManagementPage.jsx       # Quản lý món ăn
├── OrdersManagementPage.jsx         # Quản lý đơn hàng
├── OrderDetailPage.jsx              # Chi tiết đơn hàng
├── AnalyticsPage.jsx                # Thống kê & báo cáo
├── SettingsPage.jsx                 # Cài đặt nhà hàng
├── components/
│   ├── ProductModal.jsx             # Modal thêm/sửa món ăn
│   └── DeleteConfirmModal.jsx       # Modal xác nhận xóa
└── index.js                         # Export tất cả components
```

## 🚀 Tính năng

### 1. Xác thực (Authentication)

- ✅ Đăng nhập nhà hàng
- ✅ Đăng ký nhà hàng mới (3 bước)
- ✅ Quên mật khẩu
- ✅ Đổi mật khẩu

### 2. Dashboard

- ✅ Tổng quan doanh thu
- ✅ Thống kê đơn hàng
- ✅ Đơn hàng chờ xử lý
- ✅ Số lượng món ăn
- ✅ Đơn hàng gần đây
- ✅ Quick actions

### 3. Quản lý món ăn

- ✅ Danh sách món ăn (grid view)
- ✅ Tìm kiếm món ăn
- ✅ Lọc theo danh mục
- ✅ Lọc theo trạng thái
- ✅ Thêm món ăn mới
- ✅ Sửa món ăn
- ✅ Xóa món ăn
- ✅ Upload hình ảnh
- ✅ Quản lý giá & khuyến mãi
- ✅ Quản lý tồn kho

### 4. Quản lý đơn hàng

- ✅ Danh sách đơn hàng
- ✅ Tìm kiếm đơn hàng
- ✅ Lọc theo trạng thái
- ✅ Chi tiết đơn hàng
- ✅ Xác nhận đơn hàng
- ✅ Cập nhật trạng thái
- ✅ Hủy đơn hàng
- ✅ Lịch sử trạng thái
- ✅ Phân trang

### 5. Thống kê & Báo cáo

- ✅ Doanh thu theo thời gian
- ✅ Số lượng đơn hàng
- ✅ Khách hàng mới
- ✅ Giá trị trung bình đơn hàng
- ✅ Biểu đồ doanh thu theo ngày
- ✅ Top món ăn bán chạy
- ✅ Phân tích đơn hàng (hoàn thành/hủy/hoàn tiền)
- ✅ Xuất báo cáo

### 6. Cài đặt

- ✅ Thông tin nhà hàng
- ✅ Địa chỉ
- ✅ Giờ mở cửa (theo từng ngày)
- ✅ Đổi mật khẩu
- ✅ Cài đặt thông báo
- ✅ Upload logo

## 🎨 UI/UX Features

- ✅ Responsive design (Mobile, Tablet, Desktop)
- ✅ Modern gradient design
- ✅ Smooth animations & transitions
- ✅ Toast notifications
- ✅ Loading states
- ✅ Empty states
- ✅ Error handling
- ✅ Form validation
- ✅ Confirmation modals
- ✅ Status badges với màu sắc
- ✅ Icon system (Lucide React)

## 🔗 Routes

```javascript
/restaurant/login                    // Đăng nhập
/restaurant/signup                   // Đăng ký
/restaurant/dashboard                // Tổng quan
/restaurant/dashboard/products       // Quản lý món ăn
/restaurant/dashboard/orders         // Quản lý đơn hàng
/restaurant/dashboard/orders/:id     // Chi tiết đơn hàng
/restaurant/dashboard/analytics      // Thống kê
/restaurant/dashboard/settings       // Cài đặt
```

## 📊 Trạng thái đơn hàng

1. **pending** - Chờ xác nhận
2. **preparing** - Đang chuẩn bị
3. **ready** - Sẵn sàng giao
4. **delivering** - Đang giao
5. **completed** - Hoàn thành
6. **cancelled** - Đã hủy

## 🎯 API Integration

File: `src/api/restaurantApi.js`

```javascript
// Authentication
restaurantApi.login(credentials);
restaurantApi.signup(data);

// Profile
restaurantApi.getProfile();
restaurantApi.updateProfile(data);

// Products
restaurantApi.getProducts(params);
restaurantApi.createProduct(data);
restaurantApi.updateProduct(id, data);
restaurantApi.deleteProduct(id);

// Orders
restaurantApi.getOrders(params);
restaurantApi.getOrder(id);
restaurantApi.updateOrderStatus(id, status);

// Analytics
restaurantApi.getAnalytics(params);
restaurantApi.getStats();
```

## 🔐 Authentication Flow

1. Nhà hàng đăng ký tài khoản
2. Đăng nhập → nhận token
3. Token được lưu trong `localStorage`
   - Key: `restaurant_token`
   - Key: `restaurant_data`
4. Sử dụng token cho các API calls

## 🎨 Color Scheme

- Primary: Orange (#EA580C)
- Success: Green
- Warning: Yellow
- Danger: Red
- Info: Blue

## 📱 Responsive Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## 🚧 TODO Backend Integration

Các endpoint cần phát triển ở backend:

```
POST   /api/restaurant/login
POST   /api/restaurant/signup
GET    /api/restaurant/profile
PUT    /api/restaurant/profile
POST   /api/restaurant/change-password

GET    /api/restaurant/products
POST   /api/restaurant/products
PUT    /api/restaurant/products/:id
DELETE /api/restaurant/products/:id

GET    /api/restaurant/orders
GET    /api/restaurant/orders/:id
PATCH  /api/restaurant/orders/:id/status

GET    /api/restaurant/analytics
GET    /api/restaurant/stats
GET    /api/restaurant/revenue-by-day
GET    /api/restaurant/top-products
```

## 🔄 State Management

- React Query cho server state
- useState cho local state
- localStorage cho persistent data

## 📦 Dependencies

```json
{
  "react": "^18.x",
  "react-router-dom": "^6.x",
  "react-query": "^3.x",
  "lucide-react": "latest",
  "react-hot-toast": "^2.x"
}
```

## 🎯 Các bước tiếp theo

1. ✅ Tạo giao diện Restaurant Client (DONE)
2. ⏳ Tạo backend API cho Restaurant service
3. ⏳ Tạo Shipper/Drone Client
4. ⏳ Tích hợp real-time notifications
5. ⏳ Tích hợp GPS tracking cho shipper

## 👨‍💻 Development

```bash
# Chạy development server
npm run dev

# Build production
npm run build
```

## 📝 Notes

- Tất cả các API calls hiện đang sử dụng placeholder data
- Cần cập nhật URLs khi backend service sẵn sàng
- Form validation đã được implement
- Error handling đã được setup
- Loading states đã có sẵn

---

**Mô hình C2C hoàn chỉnh cần:**

1. ✅ Customer Client (Website hiện tại)
2. ✅ Restaurant Client (Vừa tạo)
3. ⏳ Shipper/Drone Client (Chưa tạo)
4. ✅ Admin Panel (Đã có)

