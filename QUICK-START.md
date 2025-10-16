# ⚡ Quick Start Guide - FoodFast Microservices

## 🚀 **Cách nhanh nhất để chạy hệ thống**

### **Option 1: Docker (Recommended)**

```bash
# Clone repository
git clone <your-repo>
cd CNPM

# Chạy với Docker
docker-compose up --build
```

### **Option 2: Local Development**

```bash
# 1. Cài đặt dependencies
cd services/api-gateway && npm install
cd ../user-service && npm install
cd ../product-service && npm install
cd ../order-service && npm install
cd ../payment-service && npm install

# 2. Khởi động MongoDB
mongod --dbpath ./data/db

# 3. Chạy hệ thống
# Windows:
start-local.bat

# macOS/Linux:
chmod +x start-local.sh
./start-local.sh

# PowerShell:
./start-local.ps1
```

## 🧪 **Test hệ thống**

```bash
# Chạy test script
node test-services.js

# Hoặc trên Windows
test-system.bat
```

## 📊 **Health Checks**

- **Frontend**: http://localhost:5175
- **API Gateway**: http://localhost:3000/health
- **User Service**: http://localhost:3001/health
- **Product Service**: http://localhost:3002/health
- **Order Service**: http://localhost:3003/health
- **Payment Service**: http://localhost:3004/health

## 🔧 **Troubleshooting**

### **Port đã được sử dụng:**

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### **MongoDB không chạy:**

```bash
# Khởi động MongoDB
mongod --dbpath ./data/db
```

### **Docker issues:**

```bash
# Rebuild containers
docker-compose down
docker-compose up --build
```

## 📝 **API Endpoints**

### **Authentication:**

- `POST /api/v1/auth/signup` - Đăng ký
- `POST /api/v1/auth/login` - Đăng nhập

### **Products:**

- `GET /api/v1/products` - Lấy danh sách sản phẩm
- `GET /api/v1/products/:id` - Lấy chi tiết sản phẩm

### **Orders:**

- `GET /api/v1/orders` - Lấy danh sách đơn hàng
- `POST /api/v1/orders` - Tạo đơn hàng

### **Payments:**

- `POST /api/v1/payments/create_payment_url` - Tạo VNPay URL

## 🎯 **Next Steps**

1. Đọc `LOCAL-SETUP.md` cho hướng dẫn chi tiết
2. Đọc `README-MICROSERVICES.md` cho kiến trúc hệ thống
3. Test API endpoints với Postman hoặc curl
4. Deploy lên production với Docker
