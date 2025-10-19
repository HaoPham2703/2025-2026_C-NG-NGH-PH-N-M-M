# 🍔 FoodFast Frontend - Microservices

Frontend React cho hệ thống FoodFast với kiến trúc microservices.

## 🚀 Tính năng

- **Authentication**: Đăng ký, đăng nhập, quản lý profile
- **Products**: Xem danh sách, chi tiết sản phẩm, tìm kiếm
- **Orders**: Quản lý đơn hàng, theo dõi trạng thái
- **Cart**: Giỏ hàng, thanh toán
- **Admin Panel**: Dashboard quản lý (cho admin)
- **Responsive**: Tương thích mobile và desktop

## 🛠️ Công nghệ

- **React 18** với hooks
- **React Router** cho routing
- **React Query** cho data fetching
- **React Hook Form** cho form handling
- **Tailwind CSS** cho styling
- **Axios** cho API calls
- **React Hot Toast** cho notifications
- **Lucide React** cho icons

## 📦 Cài đặt

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Build cho production
npm run build

# Preview build
npm run preview
```

## 🔧 Cấu hình

### Environment Variables

Tạo file `.env` trong thư mục root:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_NAME=FoodFast Microservices
```

### API Configuration

Frontend kết nối với API Gateway tại `http://localhost:3000`:

- **API Gateway**: http://localhost:3000
- **User Service**: http://localhost:3001
- **Product Service**: http://localhost:3002
- **Order Service**: http://localhost:3003
- **Payment Service**: http://localhost:3004

## 📁 Cấu trúc thư mục

```
src/
├── api/                 # API clients
│   ├── authApi.js      # Authentication API
│   ├── productApi.js   # Product API
│   ├── orderApi.js     # Order API
│   ├── paymentApi.js   # Payment API
│   ├── axiosClient.js  # Axios configuration
│   └── index.js        # API exports
├── components/         # Reusable components
│   ├── Layout.jsx      # Main layout
│   ├── Header.jsx      # Navigation header
│   └── Footer.jsx      # Footer
├── hooks/              # Custom hooks
│   └── useAuth.js      # Authentication hook
├── pages/              # Page components
│   ├── HomePage.jsx    # Homepage
│   ├── LoginPage.jsx   # Login
│   ├── SignupPage.jsx  # Signup
│   ├── ProductsPage.jsx # Product listing
│   ├── ProductDetailPage.jsx # Product detail
│   ├── OrdersPage.jsx  # Order listing
│   ├── OrderDetailPage.jsx # Order detail
│   ├── ProfilePage.jsx # User profile
│   ├── CartPage.jsx    # Shopping cart
│   ├── CheckoutPage.jsx # Checkout
│   ├── AdminPage.jsx   # Admin panel
│   └── NotFoundPage.jsx # 404 page
├── App.jsx             # Main app component
├── main.jsx            # App entry point
└── index.css           # Global styles
```

## 🔄 API Integration

### Authentication Flow

1. User đăng nhập qua `/api/v1/auth/login`
2. JWT token được lưu trong localStorage
3. Token được gửi trong header cho các request tiếp theo
4. API Gateway verify token với User Service

### Data Flow

```
Frontend → API Gateway → Microservices
    ↓
React Query Cache
    ↓
UI Components
```

## 🎨 UI Components

### Buttons

- `btn-primary`: Primary button (blue)
- `btn-secondary`: Secondary button (gray)

### Forms

- `input-field`: Standard input field
- Form validation với React Hook Form

### Cards

- `card`: Standard card container

## 🔐 Authentication

### Protected Routes

- `/orders/*` - Cần đăng nhập
- `/profile` - Cần đăng nhập
- `/checkout` - Cần đăng nhập
- `/admin` - Cần role admin

### Public Routes

- `/` - Homepage
- `/products/*` - Product pages
- `/login` - Login page
- `/signup` - Signup page

## 📱 Responsive Design

- **Mobile First**: Thiết kế ưu tiên mobile
- **Breakpoints**:
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px
  - `xl`: 1280px

## 🚀 Deployment

### Development

```bash
npm run dev
# Chạy trên http://localhost:5175
```

### Production

```bash
npm run build
# Build files trong dist/
```

### Docker

```bash
# Build image
docker build -t foodfast-frontend .

# Run container
docker run -p 5175:5175 foodfast-frontend
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests với coverage
npm run test:coverage
```

## 📊 Performance

- **Code Splitting**: Lazy loading cho các routes
- **Image Optimization**: Optimized images
- **Caching**: React Query cache
- **Bundle Size**: Tree shaking với Vite

## 🔧 Development

### Hot Reload

Vite cung cấp hot reload nhanh cho development.

### Proxy Configuration

Vite proxy API requests đến API Gateway:

```js
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    }
  }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **CORS Error**: Đảm bảo API Gateway có CORS config đúng
2. **Token Expired**: Token sẽ tự động refresh hoặc redirect login
3. **API Connection**: Kiểm tra các services đang chạy

### Debug Mode

```bash
# Enable debug logs
VITE_DEBUG=true npm run dev
```

## 📝 Notes

- Frontend chạy trên port 5175 để tránh conflict
- Sử dụng React Query cho caching và synchronization
- Tailwind CSS cho styling nhanh và responsive
- TypeScript có thể được thêm vào sau
