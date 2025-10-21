# 🚀 FoodFast Microservices - Management Scripts

Scripts để quản lý tất cả services và frontend một cách dễ dàng.

## 📋 Danh sách Scripts

### 1. `start-all.ps1` - Khởi động tất cả services
Khởi động tất cả 5 backend services và frontend trong các terminal riêng biệt.

**Cách chạy:**
```powershell
.\start-all.ps1
```

**Services được khởi động:**
- API Gateway (port 5001)
- User Service (port 4001)
- Product Service (port 4002)
- Order Service (port 4003)
- Payment Service (port 4004)
- Frontend (port 3475+)

### 2. `stop-all.ps1` - Dừng tất cả services
Dừng tất cả Node.js processes đang chạy.

**Cách chạy:**
```powershell
.\stop-all.ps1
```

### 3. `restart-all.ps1` - Khởi động lại tất cả services
Dừng và khởi động lại tất cả services.

**Cách chạy:**
```powershell
.\restart-all.ps1
```

### 4. `check-status.ps1` - Kiểm tra trạng thái services
Kiểm tra xem services nào đang chạy, services nào chưa.

**Cách chạy:**
```powershell
.\check-status.ps1
```

## 🔧 Yêu cầu

- **Windows PowerShell** (đã có sẵn trong Windows)
- **Node.js** đã được cài đặt
- **npm** đã được cài đặt
- Tất cả dependencies đã được install (`npm install` trong mỗi service)

## 📝 Lưu ý

### Quyền Execution Policy
Nếu gặp lỗi không thể chạy script, bạn cần cho phép PowerShell chạy scripts:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Cổng đang được sử dụng
Nếu cổng bị chiếm, frontend sẽ tự động tìm cổng khác (3476, 3477, ...).

Backend services cần đảm bảo cổng mặc định:
- API Gateway: 5001
- User Service: 4001
- Product Service: 4002
- Order Service: 4003
- Payment Service: 4004

### MongoDB
Đảm bảo MongoDB đang chạy trước khi start services:
```powershell
# Kiểm tra MongoDB
mongosh
```

## 🎯 Workflow thường dùng

### Bắt đầu làm việc
```powershell
# 1. Kiểm tra MongoDB có chạy chưa
mongosh

# 2. Khởi động tất cả services
.\start-all.ps1

# 3. Kiểm tra status
.\check-status.ps1
```

### Kết thúc làm việc
```powershell
# Dừng tất cả services
.\stop-all.ps1
```

### Khi có lỗi cần restart
```powershell
# Restart toàn bộ
.\restart-all.ps1
```

## 🐛 Troubleshooting

### Script không chạy được
```powershell
# Cho phép chạy scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Services không start
1. Kiểm tra MongoDB đã chạy chưa
2. Kiểm tra port có bị chiếm không:
   ```powershell
   netstat -ano | findstr :5001
   ```
3. Kill process nếu cần:
   ```powershell
   taskkill /PID <PID> /F
   ```

### Frontend không hiển thị
1. Kiểm tra console trong terminal
2. Kiểm tra port trong browser (có thể đổi sang 3476, 3477)
3. Clear cache và hard reload (Ctrl + Shift + R)

## 📞 Support

Nếu gặp vấn đề, kiểm tra logs trong từng terminal window của services.

---

**Happy Coding! 🎉**

