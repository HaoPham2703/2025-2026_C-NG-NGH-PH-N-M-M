# 🔧 Hướng dẫn chạy Manual (không dùng script)

## 📋 **Chuẩn bị**

### **1. Kiểm tra đã cài đặt:**

- ✅ Node.js (v16+)
- ✅ npm
- ✅ MongoDB (có Compass)

### **2. Mở nhiều terminal windows:**

- **Terminal 1**: MongoDB
- **Terminal 2**: User Service
- **Terminal 3**: Product Service
- **Terminal 4**: Order Service
- **Terminal 5**: Payment Service
- **Terminal 6**: API Gateway
- **Terminal 7**: Frontend

## 🗄️ **Bước 1: Khởi động MongoDB**

### **Terminal 1 - MongoDB:**

```bash
# Tạo thư mục data
mkdir data-micro
mkdir data-micro\db

# Khởi động MongoDB
mongod --dbpath ./data-micro/db
```

**Hoặc mở MongoDB Compass và kết nối với:**

- **Connection String**: `mongodb://localhost:27017`

## ⚙️ **Bước 2: Tạo file .env**

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
STRIPE_PUBLISHABLE_KEY=dev-stripe-publishable-key
STRIPE_SECRET_KEY=dev-stripe-secret-key
```

### **frontend-microservices/.env**

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_NAME=FoodFast Microservices
```

## 📦 **Bước 3: Cài đặt Dependencies**

### **Terminal 2 - User Service:**

```bash
cd services/user-service
npm install
```

### **Terminal 3 - Product Service:**

```bash
cd services/product-service
npm install
```

### **Terminal 4 - Order Service:**

```bash
cd services/order-service
npm install
```

### **Terminal 5 - Payment Service:**

```bash
cd services/payment-service
npm install
```

### **Terminal 6 - API Gateway:**

```bash
cd services/api-gateway
npm install
```

### **Terminal 7 - Frontend:**

```bash
cd frontend-microservices
npm install
```

## 🚀 **Bước 4: Khởi động Services**

### **Thứ tự khởi động (QUAN TRỌNG):**

#### **1. User Service (Terminal 2):**

```bash
cd services/user-service
npm run dev
```

**Chờ thấy:** `🚀 User Service running on port 3001`

#### **2. Product Service (Terminal 3):**

```bash
cd services/product-service
npm run dev
```

**Chờ thấy:** `🚀 Product Service running on port 3002`

#### **3. Order Service (Terminal 4):**

```bash
cd services/order-service
npm run dev
```

**Chờ thấy:** `🚀 Order Service running on port 3003`

#### **4. Payment Service (Terminal 5):**

```bash
cd services/payment-service
npm run dev
```

**Chờ thấy:** `🚀 Payment Service running on port 3004`

#### **5. API Gateway (Terminal 6):**

```bash
cd services/api-gateway
npm run dev
```

**Chờ thấy:** `🚀 API Gateway running on port 3000`

#### **6. Frontend (Terminal 7):**

```bash
cd frontend-microservices
npm run dev
```

**Chờ thấy:** `Local: http://localhost:5175/`

## 🧪 **Bước 5: Kiểm tra hệ thống**

### **Health Checks:**

- **Frontend**: http://localhost:5175
- **API Gateway**: http://localhost:3000/health
- **User Service**: http://localhost:3001/health
- **Product Service**: http://localhost:3002/health
- **Order Service**: http://localhost:3003/health
- **Payment Service**: http://localhost:3004/health

### **MongoDB Compass:**

- **Connection**: `mongodb://localhost:27017`
- **Databases**: Sẽ thấy 4 databases tự động tạo

## 🔍 **Troubleshooting**

### **Lỗi "Port already in use":**

```bash
# Tìm process đang dùng port
netstat -ano | findstr :3001

# Kill process (thay <PID> bằng PID thực tế)
taskkill /PID <PID> /F
```

### **Lỗi "MongoDB connection error":**

```bash
# Kiểm tra MongoDB có chạy không
mongosh

# Nếu lỗi, khởi động lại MongoDB
mongod --dbpath ./data-micro/db
```

### **Lỗi "Module not found":**

```bash
# Cài lại dependencies
cd services/user-service
rm -rf node_modules package-lock.json
npm install
```

### **Lỗi "Environment variables":**

- Kiểm tra file `.env` có tồn tại không
- Kiểm tra nội dung file `.env` có đúng không
- Restart service sau khi sửa `.env`

## ⏹️ **Dừng hệ thống**

### **Dừng tất cả services:**

- **Ctrl+C** trong từng terminal
- Hoặc đóng tất cả terminal windows

### **Dừng MongoDB:**

- **Ctrl+C** trong terminal MongoDB
- Hoặc đóng MongoDB Compass

## 📊 **Monitoring**

### **Trong MongoDB Compass:**

1. Kết nối với `mongodb://localhost:27017`
2. Sẽ thấy databases:
   - `fastfood_users`
   - `fastfood_products`
   - `fastfood_orders`
   - `fastfood_payments`

### **Trong Terminal:**

- Xem logs của từng service
- Kiểm tra lỗi nếu có
- Monitor performance

## 🎯 **Workflow hàng ngày**

### **Khởi động:**

1. **Terminal 1**: `mongod --dbpath ./data-micro/db`
2. **Terminal 2-7**: Chạy từng service theo thứ tự
3. **Browser**: Truy cập http://localhost:5175

### **Dừng:**

1. **Ctrl+C** trong tất cả terminals
2. **Đóng MongoDB**

### **Restart:**

1. **Dừng tất cả**
2. **Khởi động lại theo thứ tự**

## 📝 **Checklist**

- [ ] MongoDB chạy trên port 27017
- [ ] User Service chạy trên port 3001
- [ ] Product Service chạy trên port 3002
- [ ] Order Service chạy trên port 3003
- [ ] Payment Service chạy trên port 3004
- [ ] API Gateway chạy trên port 3000
- [ ] Frontend chạy trên port 5175
- [ ] MongoDB Compass kết nối được
- [ ] Health checks trả về success
- [ ] Frontend load được

## 🎉 **Thành công!**

Nếu tất cả checklist đều ✅, bạn đã có:

- **Hệ thống microservices** hoàn chỉnh
- **Frontend React** với Vite
- **4 backend services** độc lập
- **API Gateway** làm entry point
- **MongoDB** với 4 databases
- **Real-time monitoring** với Compass

**Chúc mừng! Hệ thống FoodFast Microservices đã sẵn sàng!** 🚀
