# MenuItem Status - Sau khi implement Option 2

## ✅ Frontend - KHÔNG DÙNG NỮA

Frontend đã chuyển sang gọi **Product Service** trực tiếp:

### Trước đây (MenuItem):

```javascript
// ProductsManagementPage.jsx
const res = await restaurantClient.get("/restaurant/menu");
return res?.data?.menuItems || [];
```

### Bây giờ (Product Service):

```javascript
// ProductsManagementPage.jsx
const res = await productApi.getProducts({ restaurant: restaurantId });
return res?.data?.products || [];
```

**Kết luận:** Frontend KHÔNG còn gọi MenuItem API nữa ✅

---

## ⚠️ Backend - VẪN CÒN (LEGACY CODE)

MenuItem vẫn còn trong **Restaurant Service**, nhưng không được sử dụng:

### Files còn tồn tại:

1. ✅ `services/restaurant-service/src/models/menuItemModel.js` - Model definition
2. ✅ `services/restaurant-service/src/controllers/menuController.js` - Controller
3. ✅ `services/restaurant-service/src/routes/menuRoutes.js` - Routes
4. ✅ `services/restaurant-service/src/app.js` - Route registration

### API Endpoints (KHÔNG được dùng):

- `GET /api/v1/restaurant/menu` - Get all menu items
- `POST /api/v1/restaurant/menu` - Create menu item
- `GET /api/v1/restaurant/menu/:id` - Get menu item
- `PUT /api/v1/restaurant/menu/:id` - Update menu item
- `DELETE /api/v1/restaurant/menu/:id` - Delete menu item
- `PATCH /api/v1/restaurant/menu/:id/stock` - Update stock

---

## 💡 Quyết định

### Option A: Giữ lại (Safe)

- Giữ MenuItem code như legacy
- Có thể dùng sau này nếu cần business logic riêng
- Không ảnh hưởng gì vì không được gọi

### Option B: Deprecate và xóa (Clean)

- Comment hoặc xóa MenuItem routes
- Xóa menuController, menuItemModel
- Clean code hơn, không có dead code

---

## 📝 Recommendation

**Nên giữ lại tạm thời** vì:

- Không ảnh hưởng performance (không được gọi)
- Có thể cần rollback nếu có vấn đề
- Sau khi stable, có thể xóa để clean code

**Nếu muốn xóa**, có thể:

1. Comment route trong `app.js`:
   ```javascript
   // app.use("/api/v1/restaurant/menu", menuRoutes); // Deprecated
   ```
2. Hoặc xóa hoàn toàn files MenuItem

---

## ✅ Kết luận

- ✅ **Frontend:** KHÔNG dùng MenuItem nữa → Dùng Product Service
- ⚠️ **Backend:** MenuItem vẫn còn nhưng KHÔNG được gọi
- 💡 **Action:** Có thể deprecate/xóa sau khi stable
