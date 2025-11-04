# Hướng dẫn sync sản phẩm vào Restaurant Dashboard

## Vấn đề
Không thấy sản phẩm trong `http://localhost:3475/restaurant/dashboard/products` mặc dù đã có data.

## Nguyên nhân
Hệ thống có 2 nơi lưu sản phẩm:
1. **Product Service** (`fastfood_products` database) - Lưu tất cả sản phẩm
2. **Restaurant Service** (`fastfood_restaurants` database) - Lưu MenuItems (sản phẩm của từng restaurant)

Restaurant Dashboard chỉ hiển thị từ **Restaurant Service MenuItems**, không phải Product Service.

## Giải pháp: Sync Products → MenuItems

### Bước 1: Đảm bảo MongoDB đang chạy
```bash
# Kiểm tra MongoDB
mongosh
```

### Bước 2: Seed Restaurants (nếu chưa)
```bash
cd data_demo
node seed-restaurants.js
```

**Kết quả:** Tạo 16 restaurants với:
- Email: `[tên]@fastfood.com`
- Password: `123456`
- Ví dụ: `pho.hanoi@fastfood.com` / `123456`

### Bước 3: Seed Products (nếu chưa)
```bash
cd data_demo
node seed-products-data.js
```

**Kết quả:** Import 16 products từ `products-data.json` vào Product Service

### Bước 4: Link Products với Restaurants (nếu chưa)
```bash
cd data_demo
node link-restaurants.js
```

**Kết quả:** Link trường `restaurant` (ObjectId) trong products với restaurants

### Bước 5: Sync Products → MenuItems (QUAN TRỌNG!)
```bash
cd services/product-service
node sync-products-to-menuitems.js
```

Hoặc:
```bash
cd services/product-service
npm run sync-menuitems
```

**Kết quả:** 
- Tạo MenuItems trong Restaurant Service từ Products
- Mỗi restaurant sẽ có MenuItems tương ứng với products của họ

### Bước 6: Kiểm tra
1. Login vào Restaurant Dashboard:
   - URL: `http://localhost:3475/restaurant/login`
   - Email: `pho.hanoi@fastfood.com`
   - Password: `123456`

2. Vào "Quản lý món ăn" (Products Management)

3. Bạn sẽ thấy sản phẩm: **Phở Bò Tái Nạm Chín - Phở Việt Nam Truyền Thống**

## Thứ tự chạy đầy đủ

```bash
# 1. Seed restaurants
cd data_demo
node seed-restaurants.js

# 2. Seed products
node seed-products-data.js

# 3. Link products với restaurants
node link-restaurants.js

# 4. Sync products sang MenuItems (QUAN TRỌNG!)
cd ../services/product-service
node sync-products-to-menuitems.js
```

## Kiểm tra bằng script

```bash
cd services/product-service
node check-restaurant-products.js
```

Script này sẽ kiểm tra:
- Restaurant có tồn tại không
- Products có trong Product Service không
- MenuItems có trong Restaurant Service không

## Lưu ý

- **Bước 5 (sync-products-to-menuitems.js) là bắt buộc** để sản phẩm hiển thị trong Restaurant Dashboard
- Script sẽ tự động skip nếu MenuItem đã tồn tại (dựa trên title)
- Có thể chạy lại script nhiều lần mà không lo trùng lặp

