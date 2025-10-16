# ⚡ Quick Start - Chạy Tất Cả Một Lần

## 🚀 **Cách nhanh nhất - Chỉ 1 lệnh:**

### **Windows:**

```bash
./run-everything.ps1
```

### **macOS/Linux:**

```bash
chmod +x run-everything.sh
./run-everything.sh
```

## 📋 **Script này sẽ làm gì:**

### **✅ Tự động kiểm tra:**

- Node.js đã cài chưa
- npm đã cài chưa
- MongoDB đã cài chưa

### **✅ Tự động setup:**

1. **Tạo thư mục** `data-micro/db`
2. **Cài đặt dependencies** cho tất cả services
3. **Tạo file .env** cho tất cả services
4. **Khởi động MongoDB** trên port 27017
5. **Tạo databases** (optional)
6. **Khởi động tất cả services** (5 services + frontend)

### **✅ Tự động chạy:**

- **User Service** (port 3001)
- **Product Service** (port 3002)
- **Order Service** (port 3003)
- **Payment Service** (port 3004)
- **API Gateway** (port 3000)
- **Frontend** (port 5175)

## 📊 **Sau khi chạy xong:**

### **🌐 Truy cập web:**

- **Frontend**: http://localhost:5175
- **API Gateway**: http://localhost:3000/health

### **🗄️ MongoDB Compass:**

- **Connection**: `mongodb://localhost:27017`
- **Databases**: 4 databases tự động tạo

### **🧪 Test hệ thống:**

```bash
node test-services.js
```

## 🔧 **Các script khác có sẵn:**

### **Setup riêng lẻ:**

```bash
# Tạo thư mục MongoDB
./setup-mongodb.ps1

# Cài đặt dependencies
./install-dependencies.ps1

# Tạo file environment
./create-env-files.ps1

# Tạo databases manual
./create-databases.ps1
```

### **Chạy services:**

```bash
# Khởi động tất cả services
./start-all-local.ps1

# Dừng tất cả services
./stop-all-local.ps1
```

## ⚠️ **Lưu ý:**

### **Yêu cầu hệ thống:**

- **Node.js** v16+ đã cài
- **MongoDB** đã cài
- **npm** đã cài

### **Lần đầu chạy:**

- Script sẽ mất **5-10 phút** để cài đặt dependencies
- **MongoDB** sẽ tạo databases tự động
- **Services** sẽ khởi động tuần tự

### **Lần sau chạy:**

- Chỉ mất **1-2 phút** để khởi động
- **Dependencies** đã có sẵn
- **Databases** đã tồn tại

## 🎯 **Workflow hàng ngày:**

### **Khởi động:**

```bash
# Chỉ cần 1 lệnh
./run-everything.ps1
```

### **Dừng:**

```bash
# Dừng tất cả services
./stop-all-local.ps1

# Dừng MongoDB (Ctrl+C trong terminal MongoDB)
```

### **Restart:**

```bash
# Dừng và khởi động lại
./stop-all-local.ps1
./run-everything.ps1
```

## 🔍 **Troubleshooting:**

### **Lỗi "Node.js not found":**

- Cài đặt Node.js từ [nodejs.org](https://nodejs.org/)

### **Lỗi "MongoDB not found":**

- Cài đặt MongoDB từ [mongodb.com](https://www.mongodb.com/try/download/community)

### **Lỗi "Port already in use":**

```bash
# Dừng tất cả services
./stop-all-local.ps1

# Chạy lại
./run-everything.ps1
```

### **Lỗi "Permission denied":**

```bash
# macOS/Linux - cấp quyền thực thi
chmod +x *.sh

# Windows - chạy PowerShell as Administrator
```

## 📝 **Checklist sau khi chạy:**

- [ ] **Frontend** accessible tại http://localhost:5175
- [ ] **API Gateway** accessible tại http://localhost:3000/health
- [ ] **MongoDB Compass** kết nối được với mongodb://localhost:27017
- [ ] **4 databases** hiển thị trong Compass
- [ ] **Test script** chạy thành công: `node test-services.js`

## 🎉 **Thành công!**

Nếu tất cả checklist đều ✅, bạn đã có:

- **Hệ thống microservices** hoàn chỉnh
- **Frontend React** với Vite
- **4 backend services** độc lập
- **API Gateway** làm entry point
- **MongoDB** với 4 databases
- **Real-time monitoring** với Compass

**Chúc mừng! Hệ thống FoodFast Microservices đã sẵn sàng!** 🚀

