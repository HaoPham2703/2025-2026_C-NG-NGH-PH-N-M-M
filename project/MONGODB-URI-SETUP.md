# Hướng dẫn cấu hình MongoDB URI cho tất cả services

## ⚠️ QUAN TRỌNG: Xử lý Password có ký tự đặc biệt

Nếu password của bạn có chứa các ký tự đặc biệt như `@`, `#`, `%`, `&`, v.v., bạn **PHẢI URL-encode** chúng trong connection string.

### Bảng URL Encoding cho các ký tự thường gặp:

| Ký tự | URL-encoded |
| ----- | ----------- |
| `@`   | `%40`       |
| `#`   | `%23`       |
| `%`   | `%25`       |
| `&`   | `%26`       |
| `+`   | `%2B`       |
| `=`   | `%3D`       |
| `?`   | `%3F`       |
| `/`   | `%2F`       |
| `:`   | `%3A`       |

### Ví dụ:

- **Password gốc:** `@123456`
- **Password trong URI:** `%40123456`
- **Connection string:** `mongodb+srv://username:%40123456@cluster.mongodb.net/database`

## MongoDB URI của bạn:

```
mongodb+srv://0011andanh:%40123456@cluster0.m8f5azj.mongodb.net/
```

**Lưu ý:** Password `@123456` đã được encode thành `%40123456` trong URI.

## Cách cấu hình:

### 1. Tạo file `.env` trong mỗi service folder

Tạo file `.env` trong các thư mục sau và thêm nội dung tương ứng:

#### **services/user-service/.env**

```env
PORT=4001
NODE_ENV=development
DB_URL=mongodb+srv://0011andanh:%40123456@cluster0.m8f5azj.mongodb.net/fastfood_users?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7
```

#### **services/product-service/.env**

```env
PORT=4002
NODE_ENV=development
DB_URL=mongodb+srv://0011andanh:%40123456@cluster0.m8f5azj.mongodb.net/fastfood_products?retryWrites=true&w=majority
```

#### **services/order-service/.env**

```env
PORT=4003
NODE_ENV=development
DB_URL=mongodb+srv://0011andanh:%40123456@cluster0.m8f5azj.mongodb.net/fastfood_orders?retryWrites=true&w=majority
```

#### **services/restaurant-service/.env**

```env
PORT=4004
NODE_ENV=development
DB_URL=mongodb+srv://0011andanh:%40123456@cluster0.m8f5azj.mongodb.net/fastfood_restaurants?retryWrites=true&w=majority
```

#### **services/payment-service/.env**

```env
PORT=4005
NODE_ENV=development
DB_URL=mongodb+srv://0011andanh:%40123456@cluster0.m8f5azj.mongodb.net/fastfood_payments?retryWrites=true&w=majority
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3475/payment/vnpay/callback
```

#### **services/payment-service-2/.env**

```env
PORT=4006
NODE_ENV=development
DB_URL=mongodb+srv://0011andanh:%40123456@cluster0.m8f5azj.mongodb.net/fastfood_payments_2?retryWrites=true&w=majority
```

#### **services/drone-service/.env**

```env
PORT=4007
NODE_ENV=development
DB_URL=mongodb+srv://0011andanh:%40123456@cluster0.m8f5azj.mongodb.net/fastfood_drones?retryWrites=true&w=majority
```

## Lưu ý:

1. **Database names** (tên database ở cuối URI):

   - `fastfood_users` - cho user-service
   - `fastfood_products` - cho product-service
   - `fastfood_orders` - cho order-service
   - `fastfood_restaurants` - cho restaurant-service
   - `fastfood_payments` - cho payment-service
   - `fastfood_payments_2` - cho payment-service-2
   - `fastfood_drones` - cho drone-service

2. **URI format**:

   - Format đầy đủ: `mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority`
   - Đã thêm `?retryWrites=true&w=majority` để đảm bảo kết nối ổn định
   - **Nếu password có ký tự đặc biệt, phải URL-encode trước khi đặt vào URI**

3. **Sau khi tạo file .env**, restart tất cả các services để áp dụng cấu hình mới.

4. **Kiểm tra kết nối**: Nếu gặp lỗi "URI must include hostname, domain name, and tld", hãy kiểm tra lại:
   - Password đã được URL-encode đúng chưa?
   - Không có ký tự `@` thừa trong connection string
   - Format URI đúng: `username:encoded_password@host`

## Công cụ hỗ trợ URL Encoding:

Bạn có thể sử dụng các công cụ online hoặc JavaScript để encode password:

```javascript
// JavaScript
encodeURIComponent("@123456"); // Kết quả: '%40123456'
```

Hoặc sử dụng các trang web như:

- https://www.urlencoder.org/
- https://www.urldecoder.org/

## Tất cả services đã được cập nhật:

✅ user-service/src/config/database.js
✅ product-service/src/config/database.js
✅ order-service/src/config/database.js
✅ restaurant-service/src/config/database.js
✅ payment-service/src/config/database.js
✅ payment-service-2/src/config/database.js
✅ drone-service/src/config/database.js

Tất cả đã hỗ trợ MongoDB URI và sẽ tự động sử dụng `DB_URL` từ file `.env`.
