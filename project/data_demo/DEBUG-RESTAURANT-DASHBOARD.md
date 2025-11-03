# Debug: Restaurant Dashboard Bị Trắng Trang

## Cách Kiểm Tra

### 1. Mở Console (F12)

Xem có lỗi JavaScript không:

- Red errors trong Console tab
- Network errors trong Network tab

### 2. Kiểm Tra Authentication

Mở Console và chạy:

```javascript
console.log("Token:", localStorage.getItem("restaurant_token"));
console.log("Data:", localStorage.getItem("restaurant_data"));
```

### 3. Kiểm Tra Route

- URL có đúng không: `http://localhost:3475/restaurant/dashboard`
- Có bị redirect về `/restaurant/login` không?

### 4. Test Login

```javascript
// Test đăng nhập
fetch("/api/restaurant/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "pho.hanoi@fastfood.com",
    password: "123456",
  }),
})
  .then((r) => r.json())
  .then((data) => {
    console.log("Login response:", data);
    if (data.token) {
      localStorage.setItem("restaurant_token", data.token);
      localStorage.setItem(
        "restaurant_data",
        JSON.stringify(data.data?.restaurant || data.restaurant)
      );
      window.location.href = "/restaurant/dashboard";
    }
  });
```

## Các Vấn Đề Đã Sửa

1. ✅ **Error handling khi parse JSON** - Tránh crash khi parse restaurant_data
2. ✅ **Kiểm tra token** - Redirect về login nếu không có token
3. ✅ **Error handling cho queries** - Hiển thị lỗi thay vì trang trắng

## Cách Test

### Bước 1: Đảm bảo đã login

1. Vào: `http://localhost:3475/restaurant/login`
2. Login với:
   - Email: `pho.hanoi@fastfood.com`
   - Password: `123456`

### Bước 2: Kiểm tra localStorage

Mở Console (F12):

```javascript
// Check token
localStorage.getItem("restaurant_token");

// Check data
JSON.parse(localStorage.getItem("restaurant_data") || "{}");
```

### Bước 3: Truy cập dashboard

```
http://localhost:3475/restaurant/dashboard
```

## Nếu Vẫn Trắng

1. **Xem Console (F12)** → Tab Console
   - Copy toàn bộ lỗi (nếu có)
2. **Xem Network Tab**

   - Có request nào failed không?
   - Status code là gì?

3. **Kiểm tra Components**

   - Vào `http://localhost:3475/restaurant/test` để xem debug info

4. **Clear cache và thử lại**
   ```javascript
   localStorage.clear();
   location.reload();
   ```

## Expected Behavior

Sau khi login thành công và vào `/restaurant/dashboard`:

- ✅ Hiển thị sidebar bên trái
- ✅ Hiển thị header trên cùng
- ✅ Hiển thị dashboard content (stats cards, recent orders)
- ✅ Không bị trắng trang

Nếu vẫn trắng, mở Console và cho tôi biết lỗi!
