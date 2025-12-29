# Payment Service 2 - VNPay Sandbox

Payment Service 2 sử dụng VNPay Sandbox API để xử lý thanh toán.

## Cấu hình

Service này được cấu hình với thông tin VNPay Sandbox:

- **Terminal ID (vnp_TmnCode)**: ZTUCV5PD
- **Secret Key (vnp_HashSecret)**: ERLAD0KMGZMAVNLMVN2QMTGKMOA9COAE
- **VNPay URL (vnp_Url)**: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html

## Cài đặt

1. Copy file `env.example` thành `.env`:

```bash
cp env.example .env
```

2. Cập nhật các biến môi trường trong file `.env` nếu cần

3. Cài đặt dependencies:

```bash
npm install
```

## Chạy Service

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

Service sẽ chạy trên port **3005** (mặc định).

## API Endpoints

### VNPay

- `POST /api/v1/payments/create_payment_url` - Tạo URL thanh toán VNPay
- `POST /api/v1/payments/return_payment_status` - Xác thực kết quả thanh toán từ VNPay

### Health Check

- `GET /health` - Kiểm tra trạng thái service

## Database

Service sử dụng MongoDB với database name: `fastfood_payments_2`

## Lưu ý

- Đây là service sử dụng VNPay Sandbox, chỉ dùng cho môi trường test
- Không sử dụng thông tin thật trong môi trường sandbox
- Return URL mặc định: `http://localhost:5173/payment/vnpay/callback`

