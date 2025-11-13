# Hướng dẫn chạy Payment Service 2

## Bước 1: Kiểm tra file .env

Đảm bảo file `.env` đã được tạo từ `env.example`:

```bash
cd services/payment-service-2
cp env.example .env
```

## Bước 2: Cài đặt dependencies (nếu chưa)

```bash
npm install
```

## Bước 3: Kiểm tra cấu hình trong .env

Đảm bảo các biến sau có giá trị đúng:

- `vnp_TmnCode=ZTUCV5PD`
- `vnp_HashSecret=ERLAD0KMGZMAVNLMVN2QMTGKMOA9COAE`
- `vnp_Url=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`
- `vnp_ReturnUrl=http://localhost:3475/payment/vnpay/callback`

## Bước 4: Chạy service

```bash
npm start
```

Service sẽ chạy trên port **3005**.

## Bước 5: Kiểm tra service đang chạy

Mở browser và truy cập: `http://localhost:3005/health`

Bạn sẽ thấy:

```json
{
  "status": "success",
  "message": "Payment Service 2 (VNPay Sandbox) is running",
  "port": "3005"
}
```

## Troubleshooting

### Lỗi "Cannot connect"

- Kiểm tra port 3005 có bị chiếm không: `netstat -ano | findstr :3005`
- Kiểm tra MongoDB có đang chạy không
- Kiểm tra file `.env` có đầy đủ không

### Lỗi "Network Error" từ frontend

- Đảm bảo CORS đã được cấu hình đúng (đã có port 3475)
- Restart service sau khi thay đổi code
- Kiểm tra console trong browser để xem lỗi chi tiết

