# Hướng dẫn Test VNPay Payment Service

## 1. Cấu hình Environment Variables

Trước khi test, bạn cần cấu hình các biến môi trường trong file `.env`:

```env
# VNPay Configuration
vnp_TmnCode=YOUR_TERMINAL_CODE          # Lấy từ VNPay Sandbox
vnp_HashSecret=YOUR_SECRET_KEY         # Lấy từ VNPay Sandbox
vnp_Url=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
vnp_ReturnUrl=http://localhost:4004/api/v1/payments/return_payment_status
vnp_Locale=vn
```

### Cách lấy mã từ VNPay Sandbox:

1. Đăng ký tài khoản tại: https://sandbox.vnpayment.vn/apis/
2. Sau khi đăng nhập, vào phần **"Thông tin kết nối"** hoặc **"API Integration"**
3. Copy 2 mã:
   - **Terminal Code (TmnCode)**: Ví dụ `2QXUI4J4`
   - **Secret Key (HashSecret)**: Một chuỗi dài (ví dụ: `RAOJSXGCRQDKZKLXHXQZQZQZQZQZQZ`)

**Tài liệu tham khảo:**

- Demo VNPay: [https://sandbox.vnpayment.vn/apis/vnpay-demo/](https://sandbox.vnpayment.vn/apis/vnpay-demo/)
- Link demo trực tiếp: [http://sandbox.vnpayment.vn/tryitnow/Home/CreateOrder](http://sandbox.vnpayment.vn/tryitnow/Home/CreateOrder)

## 2. API Endpoints

### 2.1. Tạo Payment URL

**Endpoint:** `POST /api/v1/payments/create_payment_url`

**Request Body:**

```json
{
  "amount": 100000, // Số tiền (VND) - BẮT BUỘC
  "bankCode": "NCB", // Mã ngân hàng (OPTIONAL) - để trống nếu không chọn ngân hàng cụ thể
  "action": "Payment for order" // Mô tả đơn hàng (OPTIONAL) - mặc định: "Payment for order"
}
```

**Response:**

```json
{
  "status": "success",
  "vnpUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
  "orderId": "12345678"
}
```

**Ví dụ Request (cURL):**

```bash
curl -X POST http://localhost:4004/api/v1/payments/create_payment_url \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100000,
    "action": "Thanh toán đơn hàng #12345"
  }'
```

**Ví dụ Request (Postman/Thunder Client):**

```json
POST http://localhost:4004/api/v1/payments/create_payment_url
Content-Type: application/json

{
  "amount": 100000,
  "bankCode": "",
  "action": "Payment for order"
}
```

### 2.2. Xử lý Callback từ VNPay

**Endpoint:** `POST /api/v1/payments/return_payment_status`

**Request Body:**

```json
{
  "invoice": {
    "vnp_Amount": "10000000",
    "vnp_BankCode": "NCB",
    "vnp_BankTranNo": "VNP12345678",
    "vnp_CardType": "ATM",
    "vnp_OrderInfo": "Payment for order",
    "vnp_PayDate": "20231201120000",
    "vnp_ResponseCode": "00",
    "vnp_TmnCode": "2QXUI4J4",
    "vnp_TransactionNo": "12345678",
    "vnp_TransactionStatus": "00",
    "vnp_TxnRef": "12345678",
    "vnp_SecureHash": "abc123..."
  }
}
```

**Response:**

```json
{
  "message": "success",
  "code": "00",  // "00" = thành công, các mã khác = thất bại
  "invoice": { ... }
}
```

## 3. Thẻ Test VNPay Sandbox

### 3.1. Thẻ Test Thành Công (Khuyến nghị dùng để test)

**Thẻ ATM NCB - Thành công:**

- Số thẻ: `9704198526191432198`
- Tên chủ thẻ: `NGUYEN VAN A`
- Ngày phát hành: `07/15`
- OTP: `123456`
- Kết quả: ✅ Thành công

**Thẻ VISA - Thành công:**

- Số thẻ: `4456530000001005`
- CVC/CVV: `123`
- Tên chủ thẻ: `NGUYEN VAN A`
- Ngày hết hạn: `12/26`
- Email: `test@gmail.com`
- Địa chỉ: `22 Lang Ha`
- Thành phố: `Ha Noi`
- Kết quả: ✅ Thành công (No 3DS)

### 3.2. Thẻ Test Các Trường Hợp Lỗi

| Trường hợp         | Số thẻ                | Response Code | Response từ API                                                                   |
| ------------------ | --------------------- | ------------- | --------------------------------------------------------------------------------- |
| Không đủ số dư     | `9704195798459170488` | `51`          | `{ "status": "error", "message": "Tài khoản không đủ số dư...", "code": "51" }`   |
| Thẻ chưa kích hoạt | `9704192181368742`    | `09`          | `{ "status": "error", "message": "Thẻ/Tài khoản chưa đăng ký...", "code": "09" }` |
| Thẻ bị khóa        | `9704193370791314`    | `12`          | `{ "status": "error", "message": "Thẻ/Tài khoản bị khóa", "code": "12" }`         |
| Thẻ hết hạn        | `9704194841945513`    | `11`          | `{ "status": "error", "message": "Đã hết hạn chờ thanh toán...", "code": "11" }`  |

**⚠️ Lưu ý quan trọng:**

- Code đã được sửa để **chỉ trả về success khi responseCode === "00"**
- Các trường hợp lỗi sẽ trả về `status: "error"` với HTTP status code 400
- Frontend cần check `response.status === "success"` và `response.code === "00"` để xác định thanh toán thành công

Xem danh sách đầy đủ ở [mục 5.3](#53-thanh-toán-trên-vnpay-sandbox)

## 4. Test Data Examples

### 4.1. Test với số tiền khác nhau:

```json
// Test 1: Thanh toán 50,000 VND
{
  "amount": 50000,
  "action": "Test payment 50k"
}

// Test 2: Thanh toán 100,000 VND
{
  "amount": 100000,
  "action": "Test payment 100k"
}

// Test 3: Thanh toán 1,000,000 VND
{
  "amount": 1000000,
  "action": "Test payment 1M"
}
```

### 4.2. Test với ngân hàng cụ thể:

```json
// Test với NCB
{
  "amount": 100000,
  "bankCode": "NCB",
  "action": "Test NCB"
}

// Test với VCB
{
  "amount": 100000,
  "bankCode": "VCB",
  "action": "Test VCB"
}

// Không chọn ngân hàng (để trống)
{
  "amount": 100000,
  "bankCode": "",
  "action": "Test no bank"
}
```

### 4.3. Danh sách mã ngân hàng phổ biến:

- `NCB` - Ngân hàng Quốc Dân
- `VCB` - Vietcombank
- `TCB` - Techcombank
- `VTB` - Vietinbank
- `BID` - BIDV
- `ACB` - ACB
- `TPB` - TPBank
- `DAB` - Đông Á Bank

## 5. Flow Test Hoàn Chỉnh

### Bước 1: Tạo Payment URL

```bash
POST http://localhost:4004/api/v1/payments/create_payment_url
{
  "amount": 100000,
  "action": "Test VNPay payment"
}
```

**Response:**

```json
{
  "status": "success",
  "vnpUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=10000000&vnp_Command=pay&...",
  "orderId": "12345678"
}
```

### Bước 2: Redirect user đến vnpUrl

Copy `vnpUrl` từ response và mở trong browser, hoặc redirect user đến URL đó.

### Bước 3: Thanh toán trên VNPay Sandbox

**Link Demo chính thức:** [http://sandbox.vnpayment.vn/tryitnow/Home/CreateOrder](http://sandbox.vnpayment.vn/tryitnow/Home/CreateOrder)

Trên trang VNPay Sandbox, bạn có thể test với các thẻ test sau:

#### Thẻ ATM nội địa - NCB (Ngân hàng Quốc Dân)

| #   | Số thẻ                | Tên chủ thẻ  | Ngày phát hành | OTP      | Kết quả               |
| --- | --------------------- | ------------ | -------------- | -------- | --------------------- |
| 1   | `9704198526191432198` | NGUYEN VAN A | 07/15          | `123456` | ✅ Thành công         |
| 2   | `9704195798459170488` | NGUYEN VAN A | 07/15          | -        | ❌ Thẻ không đủ số dư |
| 3   | `9704192181368742`    | NGUYEN VAN A | 07/15          | -        | ❌ Thẻ chưa kích hoạt |
| 4   | `9704193370791314`    | NGUYEN VAN A | 07/15          | -        | ❌ Thẻ bị khóa        |
| 5   | `9704194841945513`    | NGUYEN VAN A | 07/15          | -        | ❌ Thẻ bị hết hạn     |

#### Thẻ quốc tế - VISA

| #   | Số thẻ             | CVC/CVV | Tên chủ thẻ  | Ngày hết hạn | Email          | Kết quả                |
| --- | ------------------ | ------- | ------------ | ------------ | -------------- | ---------------------- |
| 6   | `4456530000001005` | `123`   | NGUYEN VAN A | 12/26        | test@gmail.com | ✅ Thành công (No 3DS) |
| 7   | `4456530000001096` | `123`   | NGUYEN VAN A | 12/26        | test@gmail.com | ✅ Thành công (3DS)    |

#### Thẻ quốc tế - MasterCard

| #   | Số thẻ             | CVC/CVV | Tên chủ thẻ  | Ngày hết hạn | Email          | Kết quả                |
| --- | ------------------ | ------- | ------------ | ------------ | -------------- | ---------------------- |
| 8   | `5200000000001005` | `123`   | NGUYEN VAN A | 12/26        | test@gmail.com | ✅ Thành công (No 3DS) |
| 9   | `5200000000001096` | `123`   | NGUYEN VAN A | 12/26        | test@gmail.com | ✅ Thành công (3DS)    |

#### Thẻ quốc tế - JCB

| #   | Số thẻ             | CVC/CVV | Tên chủ thẻ  | Ngày hết hạn | Email          | Kết quả                |
| --- | ------------------ | ------- | ------------ | ------------ | -------------- | ---------------------- |
| 10  | `3337000000000008` | `123`   | NGUYEN VAN A | 12/26        | test@gmail.com | ✅ Thành công (No 3DS) |
| 11  | `3337000000200004` | `123`   | NGUYEN VAN A | 12/24        | test@gmail.com | ✅ Thành công (3DS)    |

#### Thẻ ATM nội địa - NAPAS

| #   | Số thẻ                                     | Tên chủ thẻ  | Ngày phát hành | OTP   | Kết quả       |
| --- | ------------------------------------------ | ------------ | -------------- | ----- | ------------- |
| 12  | `9704000000000018` hoặc `9704020000000016` | NGUYEN VAN A | 03/07          | `otp` | ✅ Thành công |

#### Thẻ ATM nội địa - EXIMBANK

| #   | Số thẻ             | Tên chủ thẻ  | Ngày hết hạn | Kết quả       |
| --- | ------------------ | ------------ | ------------ | ------------- |
| 13  | `9704310005819191` | NGUYEN VAN A | 10/26        | ✅ Thành công |

**Lưu ý quan trọng:**

- Địa chỉ test: `22 Lang Ha`
- Thành phố: `Ha Noi`
- Trên môi trường test chỉ sử dụng được các thông tin thẻ theo danh sách trên
- Các ngân hàng khác do kết nối đã lâu nên môi trường test đã bị tạm đóng

**Nguồn:** [VNPay Sandbox Demo](https://sandbox.vnpayment.vn/apis/vnpay-demo/)

### Bước 4: VNPay redirect về ReturnUrl

Sau khi thanh toán, VNPay sẽ redirect về `vnp_ReturnUrl` với các tham số trong query string (GET):

```
http://localhost:4004/api/v1/payments/return_payment_status?vnp_Amount=10000000&vnp_BankCode=NCB&vnp_ResponseCode=00&vnp_SecureHash=...
```

**Response từ API:**

**Khi thanh toán thành công (responseCode = "00"):**

```json
{
  "status": "success",
  "message": "Thanh toán thành công",
  "code": "00",
  "invoice": { ... }
}
```

**Khi thanh toán thất bại (responseCode khác "00"):**

```json
{
  "status": "error",
  "message": "Tài khoản không đủ số dư để thực hiện giao dịch",
  "code": "51",
  "invoice": { ... }
}
```

**Lưu ý quan trọng:**

- Code đã được cập nhật để xử lý cả GET (query string) và POST (body)
- Chỉ khi `responseCode === "00"` mới được coi là thanh toán thành công
- Các response code khác sẽ trả về `status: "error"` với message tương ứng

## 6. Response Codes

- `00`: Giao dịch thành công
- `07`: Trừ tiền thành công, giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)
- `09`: Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking
- `10`: Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần
- `11`: Đã hết hạn chờ thanh toán. Xin vui lòng thực hiện lại giao dịch
- `12`: Thẻ/Tài khoản bị khóa
- `51`: Tài khoản không đủ số dư để thực hiện giao dịch
- `65`: Tài khoản đã vượt quá hạn mức giao dịch trong ngày
- `75`: Ngân hàng thanh toán đang bảo trì
- `79`: Nhập sai mật khẩu thanh toán quá số lần quy định
- `97`: Checksum failed (Lỗi chữ ký không hợp lệ)

## 7. Troubleshooting

### Lỗi: "vnp_TmnCode is not defined"

- **Nguyên nhân**: Chưa cấu hình `vnp_TmnCode` trong file `.env`
- **Giải pháp**: Thêm `vnp_TmnCode=YOUR_TERMINAL_CODE` vào file `.env`

### Lỗi: "vnp_HashSecret is not defined"

- **Nguyên nhân**: Chưa cấu hình `vnp_HashSecret` trong file `.env`
- **Giải pháp**: Thêm `vnp_HashSecret=YOUR_SECRET_KEY` vào file `.env`

### Lỗi: "Checksum failed" (code 97)

- **Nguyên nhân**: Secret key không đúng hoặc cách hash không khớp
- **Giải pháp**: Kiểm tra lại `vnp_HashSecret` trong `.env` và đảm bảo đúng với mã từ VNPay Sandbox

### VNPay redirect nhưng không nhận được callback

- **Nguyên nhân**: `vnp_ReturnUrl` không đúng hoặc service chưa chạy
- **Giải pháp**:
  - Kiểm tra `vnp_ReturnUrl` trong `.env` phải trỏ đúng endpoint
  - Đảm bảo Payment Service đang chạy trên port 4004
  - Kiểm tra CORS settings nếu gọi từ frontend

## 8. Test với Postman Collection

Bạn có thể tạo Postman collection với các request sau:

1. **Create VNPay URL**

   - Method: POST
   - URL: `http://localhost:4004/api/v1/payments/create_payment_url`
   - Body:
     ```json
     {
       "amount": 100000,
       "action": "Test payment"
     }
     ```

2. **Return Payment Status** (Mock)
   - Method: POST
   - URL: `http://localhost:4004/api/v1/payments/return_payment_status`
   - Body:
     ```json
     {
       "invoice": {
         "vnp_Amount": "10000000",
         "vnp_BankCode": "NCB",
         "vnp_OrderInfo": "Payment for order",
         "vnp_ResponseCode": "00",
         "vnp_TmnCode": "YOUR_TMN_CODE",
         "vnp_TxnRef": "12345678",
         "vnp_SecureHash": "calculated_hash"
       }
     }
     ```

## 9. Lưu ý quan trọng

1. **Sandbox vs Production**:

   - Sandbox: Dùng để test, không cần thẻ thật
   - Production: Cần đăng ký tài khoản thật và có phí

2. **Amount**:

   - API nhận số tiền theo VND (ví dụ: 100000 = 100,000 VND)
   - Code tự động nhân 100 khi gửi lên VNPay (vì VNPay yêu cầu số tiền nhỏ nhất là đồng)

3. **Return URL**:

   - Phải là URL công khai (public) khi deploy production
   - Có thể dùng ngrok để test local: `ngrok http 4004`

4. **Security**:
   - Không commit file `.env` lên git
   - Bảo mật `vnp_HashSecret` - đây là key quan trọng để verify payment
