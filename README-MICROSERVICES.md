# 🍔 FoodFast - Microservices Architecture

**FoodFast** đã được chuyển đổi thành kiến trúc microservices với 4 core services giao tiếp với nhau thông qua API Gateway và Kafka message broker.

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway    │    │   Services      │
│   (React)       │◄──►│   (Port 3000)    │◄──►│   (3001-3004)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Kafka Broker   │
                       │   (Port 9092)    │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   MongoDB        │
                       │   (Port 27017)   │
                       └──────────────────┘
```

## 🚀 Services

### 1. **API Gateway** (Port 3000)
- Điểm vào duy nhất cho tất cả requests
- Authentication & Authorization
- Rate limiting
- Request routing và load balancing
- Health checks

### 2. **User Service** (Port 3001)
- Quản lý người dùng (đăng ký, đăng nhập)
- JWT token management
- User profile và address management
- Authentication verification

### 3. **Product Service** (Port 3002)
- Quản lý sản phẩm, categories, brands
- Image upload với Cloudinary
- Inventory management
- Product search và filtering

### 4. **Order Service** (Port 3003)
- Quản lý đơn hàng (tạo, cập nhật, hủy)
- Inventory integration với Product Service
- Order analytics và reporting
- Event-driven với Kafka

### 5. **Payment Service** (Port 3004)
- Xử lý thanh toán (VNPay, PayPal, Stripe)
- Transaction management
- Refund processing
- Payment status tracking

## 🛠️ Công nghệ sử dụng

- **Backend**: Node.js + Express.js
- **Database**: MongoDB (mỗi service có DB riêng)
- **Message Broker**: Kafka
- **Containerization**: Docker + Docker Compose
- **API Gateway**: Express.js với http-proxy-middleware
- **Authentication**: JWT tokens
- **File Upload**: Cloudinary
- **Payment**: VNPay, PayPal, Stripe

## 🚀 Cách chạy hệ thống

### 1. Clone repository
```bash
git clone <repository-url>
cd CNPM
```

### 2. Chạy với Docker Compose (Recommended)
```bash
# Development mode với hot reload
docker-compose -f docker-compose.dev.yml up --build

# Production mode
docker-compose up --build
```

### 3. Chạy từng service riêng lẻ
```bash
# Install dependencies cho từng service
cd services/api-gateway && npm install
cd services/user-service && npm install
cd services/product-service && npm install
cd services/order-service && npm install
cd services/payment-service && npm install

# Chạy từng service
cd services/api-gateway && npm run dev
cd services/user-service && npm run dev
cd services/product-service && npm run dev
cd services/order-service && npm run dev
cd services/payment-service && npm run dev
```

## 📊 Health Checks

- **API Gateway**: http://localhost:3000/health
- **User Service**: http://localhost:3001/health
- **Product Service**: http://localhost:3002/health
- **Order Service**: http://localhost:3003/health
- **Payment Service**: http://localhost:3004/health

## 🔗 API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - Đăng ký
- `POST /api/v1/auth/login` - Đăng nhập
- `GET /api/v1/auth/verify` - Verify token

### Users
- `GET /api/v1/users/me` - Lấy thông tin user
- `PATCH /api/v1/users/updateMe` - Cập nhật profile
- `GET /api/v1/users/me/address` - Lấy địa chỉ

### Products
- `GET /api/v1/products` - Lấy danh sách sản phẩm
- `GET /api/v1/products/:id` - Lấy chi tiết sản phẩm
- `POST /api/v1/products` - Tạo sản phẩm (Admin)

### Orders
- `GET /api/v1/orders` - Lấy danh sách đơn hàng
- `POST /api/v1/orders` - Tạo đơn hàng
- `GET /api/v1/orders/:id` - Lấy chi tiết đơn hàng
- `PATCH /api/v1/orders/:id` - Cập nhật đơn hàng

### Payments
- `POST /api/v1/payments/create_payment_url` - Tạo VNPay URL
- `POST /api/v1/payments/stripe/create-payment-intent` - Tạo Stripe payment
- `GET /api/v1/payments/get-all-payments` - Lấy lịch sử thanh toán

## 🔄 Event-Driven Communication

### Kafka Topics
- `order-created` - Khi tạo đơn hàng mới
- `order-status-changed` - Khi thay đổi trạng thái đơn hàng
- `order-cancelled` - Khi hủy đơn hàng
- `order-completed` - Khi hoàn thành đơn hàng
- `payment-created` - Khi tạo payment
- `payment-success` - Khi thanh toán thành công
- `payment-failed` - Khi thanh toán thất bại
- `refund-created` - Khi tạo refund

## 🗄️ Database Schema

### User Service Database
- **Collection**: users
- **Fields**: name, email, password, role, address, balance, etc.

### Product Service Database
- **Collection**: products, categories, brands
- **Fields**: title, price, promotion, inventory, images, etc.

### Order Service Database
- **Collection**: orders
- **Fields**: user, cart, totalPrice, status, payments, etc.

### Payment Service Database
- **Collection**: transactions
- **Fields**: user, amount, payments, status, invoicePayment, etc.

## 🔧 Environment Variables

Mỗi service có file `env.example` với các biến môi trường cần thiết:

- **API Gateway**: Service URLs, JWT secret
- **User Service**: Database URL, JWT configuration
- **Product Service**: Database URL, Cloudinary config
- **Order Service**: Database URL, Service URLs, Kafka URL
- **Payment Service**: Database URL, Payment gateway configs, Kafka URL

## 🐳 Docker Commands

```bash
# Build và chạy tất cả services
docker-compose up --build

# Chạy chỉ một service
docker-compose up api-gateway

# Xem logs
docker-compose logs -f api-gateway

# Stop tất cả services
docker-compose down

# Stop và xóa volumes
docker-compose down -v
```

## 🧪 Testing

```bash
# Test API Gateway
curl http://localhost:3000/health

# Test User Service
curl http://localhost:3001/health

# Test Product Service
curl http://localhost:3002/health

# Test Order Service
curl http://localhost:3003/health

# Test Payment Service
curl http://localhost:3004/health
```

## 📈 Monitoring

- **Health Checks**: Mỗi service có endpoint `/health`
- **Logging**: Structured logging với request IDs
- **Error Handling**: Centralized error handling
- **Rate Limiting**: API Gateway có rate limiting

## 🔒 Security

- **JWT Authentication**: Tất cả protected routes
- **CORS**: Configured cho frontend domains
- **Helmet**: Security headers
- **Input Validation**: Request validation
- **Rate Limiting**: Prevent abuse

## 🚀 Deployment

### Production Deployment
1. Set environment variables
2. Build Docker images
3. Deploy với Docker Compose hoặc Kubernetes
4. Configure load balancer
5. Set up monitoring và logging

### Development
1. Use `docker-compose.dev.yml` cho hot reload
2. Mount source code volumes
3. Enable debug logging
4. Use development databases

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📝 Notes

- Mỗi service có thể scale độc lập
- Database được tách riêng cho từng service
- Event-driven architecture với Kafka
- API Gateway làm single entry point
- Health checks cho monitoring
- Docker containerization cho easy deployment
