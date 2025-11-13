# Hướng dẫn Setup VNPay

## Bước 1: Tạo file .env

Copy file `env.example` thành `.env` trong thư mục `services/payment-service/`:

```bash
cd services/payment-service
copy env.example .env
```

Hoặc tạo file `.env` mới với nội dung:

```env
# Payment Service Configuration
PORT=4004
NODE_ENV=development
DB_URL=mongodb://127.0.0.1:27017/fastfood_payments
KAFKA_URL=127.0.0.1:9092
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=cnpm-payment-service
KAFKA_GROUP_ID=cnpm-payment-service-group

# VNPay Configuration
# Thông tin cấu hình VNPay Sandbox
# Terminal ID / Mã Website
vnp_TmnCode=ZTUCV5PD
# Secret Key / Chuỗi bí mật tạo checksum
vnp_HashSecret=7C8D38HPV4NFVI21LF2F05QJ37Q4N09N
# Url thanh toán môi trường TEST
vnp_Url=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
# URL callback sau khi thanh toán (Frontend)
vnp_ReturnUrl=http://localhost:3475/payment/vnpay/callback
# Ngôn ngữ (vn hoặc en)
vnp_Locale=vn
```

## Bước 2: Kiểm tra cấu hình

Đảm bảo các giá trị sau đúng:

- ✅ `vnp_TmnCode=ZTUCV5PD`
- ✅ `vnp_HashSecret=7C8D38HPV4NFVI21LF2F05QJ37Q4N09N`
- ✅ `vnp_Url=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`
- ✅ `vnp_ReturnUrl=http://localhost:3475/payment/vnpay/callback` (đảm bảo frontend đang chạy trên port 3475)

### ⚠️ QUAN TRỌNG: Đảm bảo HashSecret đúng môi trường

**Lỗi phổ biến (Code 70 - Invalid signature):**

1. **Dùng HashSecret sai môi trường:**

   - ❌ Dùng HashSecret của **Production** với URL **Sandbox** → Lỗi 70
   - ❌ Dùng HashSecret của **Sandbox** với URL **Production** → Lỗi 70
   - ✅ Phải dùng HashSecret của **Sandbox** với URL **Sandbox**
   - ✅ Phải dùng HashSecret của **Production** với URL **Production**

2. **HashSecret không đầy đủ:**

   - HashSecret thường có 32 ký tự
   - Đảm bảo copy đầy đủ, không thiếu ký tự nào

3. **Kiểm tra trong console:**
   - Khi khởi động service, sẽ hiển thị:
     ```
     ✅ Môi trường: SANDBOX
        TmnCode: ZTUCV5PD
        HashSecret: 7C8D38HPV4...4N09N
        URL: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
     ```

## Bước 3: Khởi động lại Payment Service

Sau khi cập nhật `.env`, khởi động lại Payment Service:

```bash
# Dừng service hiện tại (nếu đang chạy)
# Sau đó start lại
cd services/payment-service
npm start
```

## Bước 4: Test thanh toán

1. Vào trang checkout: `http://localhost:3475/checkout`
2. Chọn phương thức thanh toán **VNPay**
3. (Tùy chọn) Chọn ngân hàng từ dropdown
4. Click "Đặt hàng"
5. Sẽ redirect đến VNPay Sandbox
6. Nhập thông tin thẻ test (xem `VNPAY-TEST-GUIDE.md`)
7. Sau khi thanh toán, VNPay sẽ redirect về `/payment/vnpay/callback`

## Thẻ Test

### Thẻ thành công:

- Số thẻ: `9704198526191432198`
- Tên: `NGUYEN VAN A`
- Ngày phát hành: `07/15`
- OTP: `123456`

### Thẻ không đủ số dư:

- Số thẻ: `9704195798459170488`
- Kết quả: Lỗi code `51`

Xem thêm các thẻ test khác trong `VNPAY-TEST-GUIDE.md`

## Troubleshooting

### Lỗi: "vnp_TmnCode is not defined"

- Kiểm tra file `.env` có tồn tại không
- Kiểm tra giá trị `vnp_TmnCode` có đúng không
- Khởi động lại Payment Service

### Lỗi: "Checksum failed" (code 97)

- Kiểm tra `vnp_HashSecret` có đúng không
- Đảm bảo không có khoảng trắng thừa trong `.env`

### VNPay không redirect về

- Kiểm tra `vnp_ReturnUrl` có đúng không
- Đảm bảo frontend đang chạy trên port 3475
- Kiểm tra route `/payment/vnpay/callback` có tồn tại không
