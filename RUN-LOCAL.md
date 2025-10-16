# 🚀 Hướng dẫn chạy FoodFast Local (không dùng Docker)

## 📋 **Yêu cầu hệ thống**

### **Phần mềm cần cài đặt:**

- **Node.js** v16+ - [Download](https://nodejs.org/)
- **MongoDB** v4.4+ - [Download](https://www.mongodb.com/try/download/community)
- **Git** (optional) - [Download](https://git-scm.com/)

## 🔧 **Bước 1: Cài đặt MongoDB**

### **Windows:**

```bash
# Với Chocolatey
choco install mongodb

# Hoặc download từ MongoDB website
# https://www.mongodb.com/try/download/community
```

### **macOS:**

```bash
# Với Homebrew
brew tap mongodb/brew
brew install mongodb-community
```

### **Ubuntu/Debian:**

```bash
# Import public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org
```

## 🗄️ **Bước 2: Khởi động MongoDB**

### **Windows:**

```bash
# Tạo thư mục data
mkdir data
mkdir data\db

# Khởi động MongoDB
mongod --dbpath ./data/db
```

### **macOS/Linux:**

```bash
# Tạo thư mục data
mkdir -p data/db

# Khởi động MongoDB
sudo mongod --dbpath ./data/db
```

## 📦 **Bước 3: Cài đặt Dependencies**

### **Backend Services:**

```bash
# API Gateway
cd services/api-gateway
npm install

# User Service
cd ../user-service
npm install

# Product Service
cd ../product-service
npm install

# Order Service
cd ../order-service
npm install

# Payment Service
cd ../payment-service
npm install
```

### **Frontend:**

```bash
# Frontend Microservices
cd frontend-microservices
npm install
```

## ⚙️ **Bước 4: Tạo file Environment**

### **services/api-gateway/.env**

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

### **services/user-service/.env**

```env
PORT=3001
NODE_ENV=development
DB_URL=mongodb://localhost:27017/fastfood_users
JWT_SECRET=dev-jwt-secret-key-here
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7
```

### **services/product-service/.env**

```env
PORT=3002
NODE_ENV=development
DB_URL=mongodb://localhost:27017/fastfood_products
CLOUDINARY_NAME=dev-cloudinary-name
CLOUDINARY_API_KEY=dev-cloudinary-api-key
CLOUDINARY_API_SECRET=dev-cloudinary-api-secret
```

### **services/order-service/.env**

```env
PORT=3003
NODE_ENV=development
DB_URL=mongodb://localhost:27017/fastfood_orders
PRODUCT_SERVICE_URL=http://localhost:3002
PAYMENT_SERVICE_URL=http://localhost:3004
KAFKA_URL=localhost:9092
```

### **services/payment-service/.env**

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

### **frontend-microservices/.env**

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_NAME=FoodFast Microservices
```

## 🚀 **Bước 5: Chạy hệ thống**

### **Cách 1: Chạy từng service riêng lẻ**

Mở **5 terminal windows** và chạy:

#### **Terminal 1 - User Service:**

```bash
cd services/user-service
npm run dev
```

#### **Terminal 2 - Product Service:**

```bash
cd services/product-service
npm run dev
```

#### **Terminal 3 - Order Service:**

```bash
cd services/order-service
npm run dev
```

#### **Terminal 4 - Payment Service:**

```bash
cd services/payment-service
npm run dev
```

#### **Terminal 5 - API Gateway:**

```bash
cd services/api-gateway
npm run dev
```

#### **Terminal 6 - Frontend:**

```bash
cd frontend-microservices
npm run dev
```

### **Cách 2: Sử dụng script tự động**

#### **Windows:**

```bash
# Chạy script batch
start-local.bat
```

#### **macOS/Linux:**

```bash
# Cấp quyền thực thi
chmod +x start-local.sh

# Chạy script
./start-local.sh
```

#### **PowerShell:**

```bash
# Chạy PowerShell script
./start-local.ps1
```

## 🧪 **Bước 6: Kiểm tra hệ thống**

### **Health Checks:**

- **Frontend**: http://localhost:5175
- **API Gateway**: http://localhost:3000/health
- **User Service**: http://localhost:3001/health
- **Product Service**: http://localhost:3002/health
- **Order Service**: http://localhost:3003/health
- **Payment Service**: http://localhost:3004/health

### **Test script:**

```bash
# Chạy test script
node test-services.js

# Hoặc trên Windows
test-system.bat
```

## 🔧 **Troubleshooting**

### **1. Port đã được sử dụng:**

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### **2. MongoDB không chạy:**

```bash
# Kiểm tra MongoDB
mongosh

# Khởi động lại MongoDB
# Windows
mongod --dbpath ./data/db

# macOS/Linux
sudo mongod --dbpath ./data/db
```

### **3. Dependencies lỗi:**

```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install
```

### **4. Environment variables:**

```bash
# Kiểm tra file .env có tồn tại không
ls -la .env

# Kiểm tra nội dung file .env
cat .env
```

## 📊 **Thứ tự khởi động (Recommended):**

1. **MongoDB** (port 27017)
2. **User Service** (port 3001)
3. **Product Service** (port 3002)
4. **Order Service** (port 3003)
5. **Payment Service** (port 3004)
6. **API Gateway** (port 3000)
7. **Frontend** (port 5175)

## 🎯 **Quick Commands:**

### **Khởi động nhanh:**

```bash
# 1. Start MongoDB
mongod --dbpath ./data/db

# 2. Start all services (Windows)
start-local.bat

# 3. Start frontend
cd frontend-microservices
npm run dev
```

### **Kiểm tra nhanh:**

```bash
# Test all services
node test-services.js

# Check MongoDB
mongosh
```

## 📝 **Notes:**

- **MongoDB** phải chạy trước khi start các services
- **API Gateway** phải chạy sau các services khác
- **Frontend** có thể chạy song song với backend
- **Kafka** là optional cho development (có thể bỏ qua)
- **Environment variables** phải được set đúng

## 🚀 **Sau khi chạy thành công:**

1. **Frontend**: http://localhost:5175
2. **API Documentation**: http://localhost:3000/health
3. **Test API**: Sử dụng Postman hoặc curl
4. **Database**: Kết nối MongoDB với các databases riêng biệt

## 🔄 **Development Workflow:**

1. **Start MongoDB** → `mongod --dbpath ./data/db`
2. **Start Backend Services** → `start-local.bat` hoặc chạy từng service
3. **Start Frontend** → `cd frontend-microservices && npm run dev`
4. **Test System** → `node test-services.js`
5. **Access Web** → http://localhost:5175
