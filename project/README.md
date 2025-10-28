## FoodFast Microservices - Hướng dẫn chạy dự án và cấu hình

Repo gồm các service backend (Node.js/Express), một API Gateway và frontend (Vite + React). Tài liệu này hướng dẫn cách cài đặt, chạy, kiểm tra trạng thái và cách đổi port/URL khi cần.

### 1) Yêu cầu hệ thống

- Node.js LTS (18+ khuyến nghị)
- npm (theo Node)
- Windows PowerShell (đã kèm các script hỗ trợ)

### 2) Cài đặt dependencies

Chạy một lần cho từng service và frontend:

```powershell
cd services\api-gateway && npm i
cd ..\user-service && npm i
cd ..\product-service && npm i
cd ..\order-service && npm i
cd ..\payment-service && npm i
cd ..\restaurant-service && npm i
cd ..\..\Frontend-mirco && npm i
```

Mẹo: Bạn có thể mở nhiều tab PowerShell hoặc dùng script cài đặt hàng loạt tuỳ chọn riêng.

### 3) Biến môi trường (.env)

Một số service có `env.example`. Sao chép thành `.env` và điều chỉnh giá trị cần thiết (DB URI, secret, CORS, cổng nếu override...):

- `services/order-service/env.example`
- `services/payment-service/env.example`
- `services/restaurant-service/env.example`

Ví dụ nhanh (Restaurant Service):

```env
# services/restaurant-service/.env
PORT=4006
CORS_ORIGIN=http://localhost:3475
MONGODB_URI=...
JWT_SECRET=...
```

Nếu không đặt `PORT`, các service dùng port mặc định (liệt kê ở mục 5).

### 4) Chạy dự án

- Cách đơn giản nhất (Windows): dùng script PowerShell tại thư mục gốc dự án.

```powershell
# Chạy tất cả backend + frontend (mỗi tiến trình mở ở một cửa sổ riêng)
./start-all.ps1

# Kiểm tra trạng thái cổng dịch vụ đang chạy
./check-status.ps1

# Dừng toàn bộ (kill các tiến trình Node)
./stop-all.ps1

# Khởi động lại tất cả
./restart-all.ps1
```

- Chạy thủ công (tuỳ chọn):

```powershell
cd services/api-gateway && npm run dev
cd ../user-service && npm run dev
cd ../product-service && npm run dev
cd ../order-service && npm run dev
cd ../payment-service && npm run dev
cd ../restaurant-service && npm run dev
cd ../../Frontend-mirco && npm run dev
```

Frontend mặc định chạy ở `http://localhost:3475` và đã cấu hình proxy `/api` → API Gateway.

### 5) Danh sách port mặc định

- API Gateway: `5001`
- User Service: `4001`
- Product Service: `4002`
- Order Service: `4003`
- Payment Service: `4004`
- Restaurant Service: `4006`
- Frontend (Vite): `3475`

Bạn có thể đổi port bằng biến môi trường `PORT` ở từng service hoặc sửa file cấu hình (mục 6).

### 6) Đổi port/URL ở đâu?

1. API Gateway

- Cổng gateway:
  - `services/api-gateway/src/server.js` (mặc định `process.env.PORT || 5001`)
- URL mapping tới các service backend:
  - `services/api-gateway/src/config/services.js`
  - Có thể override qua biến môi trường: `USER_SERVICE_URL`, `PRODUCT_SERVICE_URL`, `ORDER_SERVICE_URL`, `PAYMENT_SERVICE_URL`, `RESTAURANT_SERVICE_URL`.

2. Backend services (cổng service)

- Mỗi service có PORT mặc định trong `src/app.js` hoặc `src/server.js`:
  - User: `services/user-service/src/app.js` (`4001`) và `src/server.js`
  - Product: `services/product-service/src/app.js` (`4002`)
  - Order: `services/order-service/src/app.js` (`4003`)
  - Payment: `services/payment-service/src/app.js` (`4004`)
  - Restaurant: `services/restaurant-service/src/app.js` và `src/server.js` (`4006`)
- Đặt `PORT` trong `.env` của từng service để override.
- CORS Origins: xem mảng `origin` trong `src/app.js` mỗi service. Nếu đổi cổng frontend, thêm/điều chỉnh `http://localhost:<port-frontend>` ở đây.

3. Frontend (Vite + React)

- Cổng dev server của Vite:
  - `Frontend-mirco/vite.config.js` → `server.port` (mặc định `3475`)
- Proxy tới API Gateway (đường dẫn `/api`):
  - `Frontend-mirco/vite.config.js` → `server.proxy["/api"].target` (mặc định `http://localhost:5001`)
- Axios base URL dùng qua API Gateway (nếu gọi trực tiếp qua client chung):
  - `Frontend-mirco/src/api/axiosClients.js` → `API_GATEWAY_URL` (mặc định `http://localhost:5001`)
- Axios client trực tiếp tới User Service (nếu trang/đoạn nào dùng file này):
  - `Frontend-mirco/src/api/axiosClient.js` → `baseURL` (mặc định `http://localhost:4001`)

4. Các URL hard-code còn lại (nên chuyển qua Gateway hoặc config nếu có thời gian):

- `Frontend-mirco/src/pages-restaurant-client/components/ProductModal.jsx` → `http://localhost:3002/...`
- `Frontend-mirco/src/pages-restaurant-client/SettingsPage.jsx` → `http://localhost:3001/...`
- `Frontend-mirco/src/pages-restaurant-client/OrderDetailPage.jsx` → `http://localhost:3003/...`
- `Frontend-mirco/src/pages-restaurant-client/OrdersManagementPage.jsx` → `http://localhost:3003/...`
- `Frontend-mirco/src/pages-admin/AdminSignupPage.jsx` → `http://localhost:5001/...` (đã qua Gateway)

Khuyến nghị: chuẩn hoá để tất cả frontend gọi qua API Gateway (`/api` hoặc `API_GATEWAY_URL`) và tránh gọi thẳng cổng service.

5. Script thông báo/kiểm tra port

- `start-all.ps1` in ra các địa chỉ sau khi khởi động
- `check-status.ps1` kiểm tra cổng: 5001, 4001–4004 và frontend 3475..3480
- Nếu bạn đổi cổng, cập nhật các script này để dòng hiển thị khớp thực tế.

### 7) Health check nhanh

- API Gateway: `http://localhost:5001/health`
- User: `http://localhost:4001/health`
- Product: `http://localhost:4002/health`
- Order: `http://localhost:4003/health`
- Payment: `http://localhost:4004/health`
- Restaurant: `http://localhost:4006/health`

Ví dụ:

```bash
curl http://localhost:5001/health
```

### 8) Lỗi thường gặp

- CORS lỗi khi đổi cổng frontend: cập nhật mảng `origin` trong `src/app.js` của từng service.
- Frontend không gọi được API: kiểm tra `vite.config.js` proxy `/api`, kiểm tra `API_GATEWAY_URL` và các URL hard-code trong code frontend.
- Xung đột port: đổi `PORT` qua `.env` service tương ứng và cập nhật lại mapping trong Gateway/Frontend.

### 9) Cây thư mục chính

```text
project/
  Frontend-mirco/
  services/
    api-gateway/
    user-service/
    product-service/
    order-service/
    payment-service/
    restaurant-service/
  start-all.ps1
  stop-all.ps1
  restart-all.ps1
  check-status.ps1
```

### 10) Gợi ý cải tiến (tuỳ chọn)

- Thêm `.env` cho tất cả service và dùng biến môi trường thống nhất.
- Thêm `docker-compose.yml` để chạy đồng bộ.
- Chuẩn hoá frontend dùng 1 chỗ cấu hình base URL (VD: `VITE_API_BASE_URL`).

---

Nếu bạn đổi cổng/URL ở bất kỳ đâu, hãy rà lại cả 3 nơi: API Gateway ↔ Backend services ↔ Frontend (proxy/axios) để đảm bảo khớp nhau.
