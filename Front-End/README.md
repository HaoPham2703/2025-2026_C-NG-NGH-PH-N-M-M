# 🍔 FoodFast – Drone Delivery System

**FoodFast** là nền tảng web đặt đồ ăn nhanh tiên tiến, tích hợp công nghệ **drone** để giao hàng siêu tốc và an toàn.  
Dự án áp dụng **kiến trúc microservices**, kết hợp **React** cho frontend và **Node.js (Express)** cho backend, sử dụng **GPS** để định tuyến và theo dõi thời gian thực.

---

## 🚀 Tổng Quan Sản Phẩm (Product Overview)

FoodFast hướng đến việc **tối ưu hóa quy trình giao thức ăn**, đặc biệt ở khu vực đô thị đông đúc, bằng việc:

- Giảm thời gian giao hàng xuống **< 20 phút**.
- Cung cấp **trải nghiệm theo dõi drone thời gian thực**.
- Giúp **quán ăn nhỏ** dễ dàng quản lý đơn hàng và khách hàng.

Hệ thống tích hợp:

- Giao diện **React SPA** (Single Page Application).
- **Microservices backend** dựa trên Node.js + MongoDB.
- **Kafka/RabbitMQ** cho giao tiếp bất đồng bộ.
- **Redis caching**, **Docker + Kubernetes**, **Grafana + Prometheus** để giám sát.

---

## 🧩 Kiến Trúc Hệ Thống

### 🔹 Tổng Quan Backend

Backend được thiết kế theo mô hình **microservices** phân tán:

| Dịch vụ                          | Mô tả chính                                                  | Cơ sở dữ liệu | Giao tiếp         |
| -------------------------------- | ------------------------------------------------------------ | ------------- | ----------------- |
| **API Gateway**                  | Điểm vào duy nhất cho frontend, xử lý định tuyến & xác thực. | -             | REST / Kafka      |
| **User Service**                 | Quản lý người dùng, đăng ký, đăng nhập, RBAC.                | Users DB      | REST / Kafka      |
| **Product Service**              | Quản lý menu món ăn, nhà hàng đối tác.                       | Products DB   | REST              |
| **Cart Service**                 | Giỏ hàng tạm thời, tính tổng tiền.                           | Carts DB      | REST              |
| **Order Service**                | Quản lý vòng đời đơn hàng.                                   | Orders DB     | REST / Kafka      |
| **Payment Service**              | Xử lý thanh toán (VNPay, Momo, COD).                         | Payments DB   | REST / Kafka      |
| **Drone Dispatcher Service**     | Phân bổ và điều phối drone.                                  | Drones DB     | Kafka             |
| **Delivery & GPS Service**       | Quản lý hành trình drone, GPS, ETA.                          | GPS Data DB   | REST / WebSocket  |
| **Monitoring & Logging Service** | Giám sát, ghi log toàn hệ thống.                             | Logs DB       | REST / Prometheus |

---

## 🛠️ Công Nghệ Sử Dụng

| Thành phần            | Công nghệ                |
| --------------------- | ------------------------ |
| **Frontend**          | React (SPA)              |
| **Backend Framework** | Express.js (Node.js)     |
| **Database**          | MongoDB (Azure)          |
| **Caching**           | Redis (LRU)              |
| **Message Broker**    | Kafka / RabbitMQ         |
| **Containerization**  | Docker + Kubernetes      |
| **Monitoring**        | Grafana + Prometheus     |
| **Maps API**          | Google Maps / Azure Maps |

---

## 🧭 Quy Trình Người Dùng (User Flow)

1. **Người dùng mở web app FoodFast** trên trình duyệt (React SPA).
2. **Đăng nhập hoặc đăng ký** qua `POST /api/auth`.
3. **Duyệt sản phẩm**, thêm vào giỏ (`GET /products`, `POST /cart/add`).
4. **Đặt đơn hàng** qua `POST /orders`.
5. **Thanh toán** xử lý qua `Payment Service`, cập nhật trạng thái.
6. **Drone giao hàng** theo lộ trình GPS tối ưu (`Delivery & GPS Service`).
7. **Theo dõi drone thời gian thực** qua `GET /delivery/:orderId/location`.
8. **Đơn hoàn tất**, trạng thái chuyển thành `DELIVERED`.

---

## 📦 API Chính (Example Endpoints)

| Endpoint                          | Mô tả                            | Service                |
| --------------------------------- | -------------------------------- | ---------------------- |
| `POST /api/auth/login`            | Đăng nhập người dùng             | User Service           |
| `GET /products`                   | Lấy danh sách sản phẩm           | Product Service        |
| `POST /cart/add`                  | Thêm sản phẩm vào giỏ            | Cart Service           |
| `POST /orders`                    | Tạo đơn hàng mới                 | Order Service          |
| `POST /payments/process`          | Thanh toán đơn hàng              | Payment Service        |
| `GET /delivery/:orderId/location` | Vị trí drone theo thời gian thực | Delivery & GPS Service |

---

## 🎯 Mục Tiêu & Kết Quả Dự Kiến

| Mục tiêu                          | Kết quả mong đợi                    |
| --------------------------------- | ----------------------------------- |
| ⏱️ Thời gian xử lý đơn hàng       | < 30 giây                           |
| 🚁 Thời gian giao hàng trung bình | < 20 phút                           |
| 💡 Mức độ hài lòng khách hàng     | +50%                                |
| 🧱 Khả năng mở rộng               | Auto-scaling, microservices độc lập |

---

## 🧠 Các Use Case Chính

| Mã      | Tên Use Case                   | Actor    | Mô tả                               |
| ------- | ------------------------------ | -------- | ----------------------------------- |
| **UC1** | Đặt món và thêm vào giỏ hàng   | Customer | Người dùng chọn món và thêm vào giỏ |
| **UC2** | Đăng ký / Đăng nhập người dùng | Customer | Tạo tài khoản và đăng nhập hệ thống |
| **UC3** | Thanh toán & xác nhận đơn hàng | Customer | Thực hiện giao dịch thanh toán      |
| **UC4** | Xem / Theo dõi đơn hàng        | Customer | Xem trạng thái, GPS drone           |
| **UC5** | Quản lý menu món ăn            | Admin    | Cập nhật món ăn, giá, khuyến mãi    |
| **UC6** | Giám sát hệ thống              | Admin    | Theo dõi log, hiệu suất dịch vụ     |

---

## 📁 Cấu Trúc Thư Mục

```bash
foodfast/
├── backend/
│   ├── api-gateway/
│   ├── user-service/
│   ├── product-service/
│   ├── order-service/
│   ├── payment-service/
│   ├── drone-dispatcher/
│   ├── delivery-gps-service/
│   └── monitoring-service/
├── frontend/
│   └── react-app/
├── docs/
│   ├── PRD.docx
│   ├── Backend.docx
│   └── Script.docx
└── README.md
```
