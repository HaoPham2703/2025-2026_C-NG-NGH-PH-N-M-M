# Kết quả kiểm tra tài khoản pho.hanoi@fastfood.com

## Thông tin tài khoản

- **Email:** pho.hanoi@fastfood.com
- **Password:** 123456
- **Restaurant Name:** Phở Gia Truyền Hà Nội
- **RestaurantId trong data:** restaurant_1

## Sản phẩm trong products-data.json

Theo file `data_demo/products-data.json`, restaurant_1 có **1 sản phẩm**:

1. **Phở Bò Tái Nạm Chín - Phở Việt Nam Truyền Thống**
   - Giá: 65,000đ
   - Giá khuyến mãi: 55,000đ
   - Mô tả: Phở bò tái nạm chín thơm ngon với nước dùng đậm đà, bánh phở mềm dai, thịt bò tái tươi ngon và nạm chín mềm. Kèm rau thơm, giá đỗ, chanh, ớt.
   - Tồn kho: 50

## Cách kiểm tra trong database

Để kiểm tra xem sản phẩm đã được seed và link với restaurant chưa, bạn cần:

1. **Seed restaurants** (nếu chưa):

   ```bash
   cd data_demo
   node seed-restaurants.js
   ```

2. **Seed products** (nếu chưa):

   ```bash
   cd data_demo
   node seed-products-data.js
   ```

3. **Link products với restaurants**:
   ```bash
   cd data_demo
   node link-restaurants.js
   ```

## Kiểm tra qua Restaurant Dashboard

Sau khi login với `pho.hanoi@fastfood.com`:

- Vào trang "Quản lý món ăn" (Products Management)
- Nếu không thấy sản phẩm, có thể:
  - Products chưa được seed
  - Products chưa được link với restaurant ObjectId
  - Products tồn tại trong Product service nhưng chưa được sync sang Restaurant service MenuItems

## Lưu ý

Trong hệ thống này có 2 nơi lưu sản phẩm:

1. **Product Service** (`fastfood_products` database):

   - Lưu tất cả sản phẩm
   - Có field `restaurant` (ObjectId reference) và `restaurantId` (String)

2. **Restaurant Service** (`fastfood_restaurants` database):
   - Lưu MenuItems (sản phẩm của từng restaurant)
   - Restaurant có thể tự thêm sản phẩm vào menu của mình
   - Field `restaurantId` (ObjectId reference)

Để hiển thị trong Restaurant Dashboard, sản phẩm cần tồn tại trong **Restaurant Service MenuItems**, không phải chỉ trong Product Service.

