# Hướng dẫn Debug Lỗi 500 Dashboard

## Bước 1: Restart Restaurant Service

```powershell
# Dừng Restaurant Service (Ctrl+C trong terminal đang chạy)
# Sau đó start lại:
cd services/restaurant-service
npm run dev
```

## Bước 2: Kiểm tra Logs

Khi vào Dashboard (`http://localhost:3475/restaurant/dashboard`), Restaurant Service console sẽ hiển thị:

```
[getStats] Restaurant ID: <restaurant-id>
[getStats] Calling Order Service: http://localhost:4003/api/v1/orders/restaurant/<restaurant-id>
[getStats] Order Service response status: 200
[getStats] Found orders: X
[getStats] Calling Product Service: http://localhost:4002/api/v1/products
[getStats] Product Service response status: 200
[getStats] Calculated stats: {...}
```

## Bước 3: Xác định Lỗi

### Nếu thấy lỗi từ Order Service:

```
[getStats] Order Service error: {
  message: "...",
  status: 500,
  ...
}
```

**Nguyên nhân có thể:**

- Order Service không chạy
- Route `/api/v1/orders/restaurant/:restaurantId` không tồn tại
- Database connection issue
- Query error (restaurant field không tồn tại trong Order model)

**Fix:**

```powershell
# 1. Kiểm tra Order Service có chạy không
curl http://localhost:4003/health

# 2. Nếu không chạy, start Order Service:
cd services/order-service
npm run dev

# 3. Kiểm tra route có đúng không:
curl http://localhost:4003/api/v1/orders/restaurant/<restaurant-id>
```

### Nếu thấy lỗi từ Product Service:

```
[getStats] Product Service error: {
  message: "...",
  status: 500,
  ...
}
```

**Nguyên nhân có thể:**

- Product Service không chạy
- Filter `restaurant` không hoạt động đúng

**Fix:**

```powershell
# 1. Kiểm tra Product Service có chạy không
curl http://localhost:4002/health

# 2. Nếu không chạy, start Product Service:
cd services/product-service
npm run dev

# 3. Test filter:
curl "http://localhost:4002/api/v1/products?restaurant=<restaurant-id>"
```

## Bước 4: Kiểm tra Services đang chạy

```powershell
# List tất cả Node processes
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Select-Object Id, ProcessName

# Hoặc check ports:
netstat -ano | findstr ":4002"
netstat -ano | findstr ":4003"
netstat -ano | findstr ":4006"
```

## Bước 5: Test API trực tiếp

### Test Order Service:

```bash
# Replace <restaurant-id> với ID thật từ localStorage
curl http://localhost:4003/api/v1/orders/restaurant/<restaurant-id>
```

### Test Product Service:

```bash
curl "http://localhost:4002/api/v1/products?restaurant=<restaurant-id>"
```

## Bước 6: Kiểm tra .env

Đảm bảo `services/restaurant-service/.env` có:

```
ORDER_SERVICE_URL=http://localhost:4003
PRODUCT_SERVICE_URL=http://localhost:4002
```

## Expected Behavior sau khi fix

1. ✅ Restaurant Service console hiển thị logs với `[getStats]` prefix
2. ✅ Dashboard load thành công (có thể hiển thị số 0 nếu chưa có data)
3. ✅ Không có 500 error
4. ✅ Stats được tính toán từ database thật

## Quick Fix Checklist

- [ ] Restaurant Service có axios: `npm install` trong `services/restaurant-service`
- [ ] Order Service đang chạy: `curl http://localhost:4003/health`
- [ ] Product Service đang chạy: `curl http://localhost:4002/health`
- [ ] Restaurant Service .env có đúng service URLs
- [ ] Restart Restaurant Service sau khi sửa code
- [ ] Check logs trong Restaurant Service console

