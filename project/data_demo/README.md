# Data Demo - Seed Scripts

Folder này chứa các file data và script seed cho database.

## Cấu trúc file

- `products-data.json` - Dữ liệu 16 sản phẩm mẫu với đầy đủ thông tin
- `seed-restaurants.js` - Script seed 16 restaurants vào database
- `seed-products-data.js` - Script seed products từ `products-data.json`
- `link-restaurants.js` - Script link products với restaurants trong database

## Cách sử dụng

### 1. Seed Restaurants

```bash
cd data_demo
node seed-restaurants.js
```

Hoặc từ project root:

```bash
node data_demo/seed-restaurants.js
```

**Kết quả:** Tạo 16 restaurants với:

- Email: `[tên]@fastfood.com`
- Password: `123456`
- Tất cả đã verified và active

### 2. Seed Products

```bash
cd data_demo
node seed-products-data.js
```

Hoặc từ project root:

```bash
node data_demo/seed-products-data.js
```

**Kết quả:** Import 16 products từ `products-data.json` vào database

### 3. Link Products với Restaurants

```bash
cd data_demo
node link-restaurants.js
```

Hoặc từ project root:

```bash
node data_demo/link-restaurants.js
```

**Kết quả:** Link trường `restaurant` (ObjectId) trong products với restaurants trong database

### 4. Sync Products → MenuItems (QUAN TRỌNG!)

**⚠️ Bước này BẮT BUỘC để sản phẩm hiển thị trong Restaurant Dashboard**

```bash
cd services/product-service
node sync-products-to-menuitems.js
```

Hoặc từ project root:

```bash
cd services/product-service
npm run sync-menuitems
```

**Kết quả:** Tạo MenuItems trong Restaurant Service từ Products. Restaurant Dashboard chỉ hiển thị từ MenuItems, không phải Products.

## Thứ tự chạy

1. **Chạy seed restaurants trước:**

   ```bash
   node data_demo/seed-restaurants.js
   ```

2. **Sau đó seed products:**

   ```bash
   node data_demo/seed-products-data.js
   ```

3. **Link products với restaurants:**

   ```bash
   node data_demo/link-restaurants.js
   ```

4. **QUAN TRỌNG: Sync products sang MenuItems (bắt buộc để hiển thị trong Dashboard):**
   ```bash
   cd services/product-service
   node sync-products-to-menuitems.js
   ```

## Lưu ý

- Các script cần MongoDB đang chạy
- Cần có file `.env` trong các service directories hoặc set environment variables
- Products và Restaurants được seed vào 2 databases khác nhau:
  - Products: `fastfood_products`
  - Restaurants: `fastfood_restaurants`

## Environment Variables

Đảm bảo có các biến môi trường sau:

**For Product Service:**

- `DB_URL=mongodb://localhost:27017/fastfood_products`

**For Restaurant Service:**

- `DB_URL=mongodb://localhost:27017/fastfood_restaurants`
- `RESTAURANT_DB_URL=mongodb://localhost:27017/fastfood_restaurants` (cho link script)
