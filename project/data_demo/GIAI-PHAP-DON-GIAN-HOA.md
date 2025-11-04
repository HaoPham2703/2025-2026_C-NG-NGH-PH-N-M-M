# Giải pháp đơn giản hóa: Dùng chung Products

## Vấn đề hiện tại

Hiện có 2 nơi lưu sản phẩm:

1. **`fastfood_products`** database - Lưu Products (có field `restaurant`)
2. **`fastfood_restaurants`** database - Lưu MenuItems collection

**Hệ quả:**

- ❌ Dữ liệu bị trùng lặp
- ❌ Phải sync giữa 2 nơi (Products → MenuItems)
- ❌ Khó maintain và dễ lệch dữ liệu
- ❌ Tốn tài nguyên

## Giải pháp: Dùng chung Products

### Ý tưởng

Restaurant Dashboard **query trực tiếp từ Product Service** theo field `restaurant` (ObjectId).

**Lợi ích:**

- ✅ Không trùng lặp dữ liệu
- ✅ Không cần sync
- ✅ Dữ liệu luôn nhất quán
- ✅ Đơn giản hơn, dễ maintain

### Cách thực hiện

#### Option 1: Sửa Restaurant Service để gọi Product Service

Sửa `menuController.js` để query Products thay vì MenuItems:

```javascript
// services/restaurant-service/src/controllers/menuController.js
const axios = require("axios");

exports.getMenuItems = catchAsync(async (req, res, next) => {
  // Gọi Product Service thay vì query MenuItems
  const productServiceUrl =
    process.env.PRODUCT_SERVICE_URL || "http://localhost:4002";

  const response = await axios.get(`${productServiceUrl}/api/v1/products`, {
    params: {
      restaurant: req.restaurant.id, // Filter theo restaurant ID
      ...req.query,
    },
    headers: {
      // Forward authentication if needed
      Authorization: req.headers.authorization,
    },
  });

  // Map Products format to MenuItems format for compatibility
  const menuItems = response.data.data.products.map((product) => ({
    _id: product._id,
    title: product.title,
    description: product.description,
    price: product.price,
    promotion: product.promotion,
    category: product.category || "Khác",
    images: product.images || [],
    stock: product.inventory || 0,
    status: "active",
    sold: product.sold || 0,
    rating: product.ratingsAverage || 0,
    reviewCount: product.ratingsQuantity || 0,
  }));

  res.status(200).json({
    status: "success",
    results: menuItems.length,
    data: {
      menuItems,
      pagination: response.data.pagination || {},
    },
  });
});
```

#### Option 2: Frontend gọi trực tiếp Product Service

Sửa `ProductsManagementPage.jsx` để gọi Product Service:

```javascript
// Frontend-mirco/src/pages-restaurant-client/ProductsManagementPage.jsx
import { productApi } from "../../api";

const { data: products } = useQuery("restaurantProducts", async () => {
  const restaurantData = JSON.parse(localStorage.getItem("restaurant_data"));
  const restaurantId = restaurantData?._id;

  const res = await productApi.getProducts({ restaurant: restaurantId });
  return res?.data?.products || [];
});
```

### Đã sửa

✅ **Product Controller đã support filter theo restaurant:**

```javascript
// services/product-service/src/controllers/productController.js
if (req.query.restaurant) {
  queryObj.restaurant = req.query.restaurant;
}
```

## Khuyến nghị

**Nên chọn Option 2 (Frontend gọi trực tiếp Product Service)** vì:

- ✅ Đơn giản nhất
- ✅ Không cần thay đổi Restaurant Service
- ✅ Frontend có thể control được
- ✅ Dễ debug và maintain

**Sau khi implement:**

- Có thể xóa MenuItems collection (nếu không cần)
- Hoặc giữ MenuItems chỉ để reference (nếu có business logic đặc biệt)

## Migration path

1. ✅ Product Service đã support filter by restaurant
2. 🔄 Cần sửa Frontend để gọi Product Service
3. 🔄 Sau đó có thể deprecate MenuItems
