# 🚀 Hướng dẫn chạy FoodFast Microservices trên Local

## 📋 Yêu cầu hệ thống

### **Phần mềm cần cài đặt:**

- **Node.js** (v16 trở lên)
- **MongoDB** (v4.4 trở lên)
- **Kafka** (optional, có thể bỏ qua cho development)
- **Git**

### **Cài đặt MongoDB:**

```bash
# Windows (với Chocolatey)
choco install mongodb

# macOS (với Homebrew)
brew install mongodb/brew/mongodb-community

# Ubuntu/Debian
sudo apt-get install mongodb
```

## 🔧 **Cách 1: Chạy không dùng Docker**

### **Bước 1: Cài đặt dependencies**

```bash
# Cài đặt dependencies cho tất cả services
cd services/api-gateway && npm install
cd ../user-service && npm install
cd ../product-service && npm install
cd ../order-service && npm install
cd ../payment-service && npm install
```

### **Bước 2: Tạo file environment**

Tạo file `.env` trong mỗi service:

#### **services/api-gateway/.env**

```env
PORT=3000
NODE_ENV=development
USER_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
ORDER_SERVICE_URL=http://localhost:3003
PAYMENT_SERVICE_URL=http://localhost:3004
JWT_SECRET=dev-jwt-secret-key-here
JWT_EXPIRES_IN=7d
```

#### **services/user-service/.env**

```env
PORT=3001
NODE_ENV=development
DB_URL=mongodb://localhost:27017/fastfood_users
JWT_SECRET=dev-jwt-secret-key-here
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7
```

#### **services/product-service/.env**

```env
PORT=3002
NODE_ENV=development
DB_URL=mongodb://localhost:27017/fastfood_products
CLOUDINARY_NAME=dev-cloudinary-name
CLOUDINARY_API_KEY=dev-cloudinary-api-key
CLOUDINARY_API_SECRET=dev-cloudinary-api-secret
```

#### **services/order-service/.env**

```env
PORT=3003
NODE_ENV=development
DB_URL=mongodb://localhost:27017/fastfood_orders
PRODUCT_SERVICE_URL=http://localhost:3002
PAYMENT_SERVICE_URL=http://localhost:3004
KAFKA_URL=localhost:9092
```

#### **services/payment-service/.env**

```env
PORT=3004
NODE_ENV=development
DB_URL=mongodb://localhost:27017/fastfood_payments
KAFKA_URL=localhost:9092
vnp_TmnCode=dev-vnpay-tmn-code
vnp_HashSecret=dev-vnpay-hash-secret
vnp_Url=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
vnp_ReturnUrl=http://localhost:3000/payment/return
vnp_Locale=vn
```

### **Bước 3: Khởi động MongoDB**

```bash
# Windows
mongod --dbpath ./data/db

# macOS/Linux
sudo mongod --dbpath ./data/db
```

### **Bước 4: Chạy services**

#### **Cách 1: Chạy từng service riêng lẻ**

Mở 5 terminal windows và chạy:

```bash
# Terminal 1 - User Service
cd services/user-service
npm run dev

# Terminal 2 - Product Service
cd services/product-service
npm run dev

# Terminal 3 - Order Service
cd services/order-service
npm run dev

# Terminal 4 - Payment Service
cd services/payment-service
npm run dev

# Terminal 5 - API Gateway
cd services/api-gateway
npm run dev
```

#### **Cách 2: Sử dụng script tự động**

**Windows:**

```bash
# Chạy script batch
start-local.bat
```

**macOS/Linux:**

```bash
# Cấp quyền thực thi
chmod +x start-local.sh

# Chạy script
./start-local.sh
```

### **Bước 5: Kiểm tra hệ thống**

Mở browser và kiểm tra health checks:

- **API Gateway**: http://localhost:3000/health
- **User Service**: http://localhost:3001/health
- **Product Service**: http://localhost:3002/health
- **Order Service**: http://localhost:3003/health
- **Payment Service**: http://localhost:3004/health

## 🐳 **Cách 2: Chạy với Docker**

### **Bước 1: Cài đặt Docker**

- Tải và cài đặt [Docker Desktop](https://www.docker.com/products/docker-desktop)

### **Bước 2: Chạy hệ thống**

#### **Development mode (với hot reload):**

```bash
docker-compose -f docker-compose.dev.yml up --build
```

#### **Production mode:**

```bash
docker-compose up --build
```

### **Bước 3: Kiểm tra hệ thống**

```bash
# Xem logs
docker-compose logs -f api-gateway

# Xem tất cả containers
docker-compose ps

# Stop hệ thống
docker-compose down

# Stop và xóa volumes
docker-compose down -v
```

## 🧪 **Testing API**

### **1. Test Authentication**

```bash
# Đăng ký user mới
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "passwordConfirm": "password123"
  }'

# Đăng nhập
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### **2. Test Products**

```bash
# Lấy danh sách sản phẩm
curl http://localhost:3000/api/v1/products

# Lấy chi tiết sản phẩm
curl http://localhost:3000/api/v1/products/PRODUCT_ID
```

### **3. Test Orders**

```bash
# Tạo đơn hàng (cần token)
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "address": "123 Test Street",
    "receiver": "Test User",
    "phone": "0123456789",
    "cart": [
      {
        "product": {
          "_id": "PRODUCT_ID",
          "title": "Test Product",
          "price": 100000
        },
        "quantity": 2
      }
    ],
    "totalPrice": 200000,
    "payments": "tiền mặt"
  }'
```

## 🔧 **Troubleshooting**

### **Lỗi thường gặp:**

#### **1. Port đã được sử dụng**

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

#### **2. MongoDB connection error**

```bash
# Kiểm tra MongoDB có chạy không
mongosh

# Khởi động lại MongoDB
sudo systemctl restart mongod
```

#### **3. Service không start**

```bash
# Kiểm tra logs
npm run dev

# Kiểm tra port
netstat -tulpn | grep :3001
```

#### **4. Docker issues**

```bash
# Xóa tất cả containers
docker system prune -a

# Rebuild images
docker-compose build --no-cache
```

## 📊 **Monitoring**

### **Health Checks:**

- Tất cả services có endpoint `/health`
- Kiểm tra status và thông tin service

### **Logs:**

- Mỗi service có structured logging
- Request ID để trace requests
- Error handling với stack traces

### **Performance:**

- Rate limiting trên API Gateway
- Compression middleware
- Caching với Redis (optional)

## 🚀 **Production Deployment**

### **Environment Variables:**

- Sử dụng production values
- Secure JWT secrets
- Production database URLs
- Payment gateway credentials

### **Security:**

- HTTPS certificates
- CORS configuration
- Rate limiting
- Input validation

### **Scaling:**

- Load balancer
- Multiple service instances
- Database clustering
- Message queue clustering

## 📝 **Notes**

- **Development**: Sử dụng `npm run dev` cho hot reload
- **Production**: Sử dụng `npm start` cho performance
- **Docker**: Recommended cho production deployment
- **Local**: Tốt cho development và testing
- **Kafka**: Optional cho development, required cho production
