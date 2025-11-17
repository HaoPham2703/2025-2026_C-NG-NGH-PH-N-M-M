# Test Review Feature - Hướng dẫn kiểm tra tính năng đánh giá

## Chuẩn bị
1. Đảm bảo tất cả services đang chạy
2. Frontend đang chạy ở http://localhost:3475
3. Có tài khoản user để test

## Test Case 1: Tạo Review cho Order đã hoàn thành

### Bước 1: Tạo Order mới
1. Đăng nhập vào hệ thống
2. Thêm sản phẩm vào giỏ hàng
3. Checkout và tạo order
4. Ghi lại Order ID (ví dụ: `673b0f9d3e8a4c5d7f1e2a3b`)

### Bước 2: Đổi status Order thành Success (Manual)
Chạy trong MongoDB hoặc qua API:
```javascript
// Trong MongoDB Compass hoặc shell
db.orders.updateOne(
  { _id: ObjectId("673b0f9d3e8a4c5d7f1e2a3b") },
  { $set: { status: "Success", isReviewed: false } }
)
```

Hoặc dùng PowerShell script:
```powershell
# Tạo file test-order-status.ps1
$orderId = "673b0f9d3e8a4c5d7f1e2a3b"
$token = "YOUR_JWT_TOKEN_HERE"

# Get order details
Write-Host "Getting order details..." -ForegroundColor Cyan
$response = Invoke-RestMethod -Uri "http://localhost:5001/api/v1/orders/$orderId" -Headers @{
    "Authorization" = "Bearer $token"
}
Write-Host "Current status: $($response.data.order.status)" -ForegroundColor Yellow

# Update to Success (Note: This might need admin access)
# Alternatively, you can manually update in MongoDB
```

### Bước 3: Test Create Review
1. Vào trang Order Detail: `http://localhost:3475/orders/{orderId}`
2. Kiểm tra hiển thị section "Đánh giá đơn hàng"
3. Kiểm tra button "Đánh giá ngay" hiển thị
4. Click button "Đánh giá ngay"
5. ReviewModal mở ra

**Expected:**
- Modal hiển thị đúng thông tin restaurant
- Hiển thị danh sách sản phẩm trong order
- Form có:
  - Rating tổng thể (required, 1-5 sao)
  - Comment tổng thể (optional, max 500 ký tự)
  - Rating từng sản phẩm (optional)
  - Comment từng sản phẩm (optional, max 200 ký tự)

### Bước 4: Submit Review
1. Chọn rating tổng thể (ví dụ: 5 sao)
2. Nhập comment: "Món ăn ngon, giao hàng nhanh!"
3. Optional: Đánh giá từng sản phẩm
4. Click "Gửi đánh giá"

**Expected:**
- Alert "Đánh giá thành công!"
- Modal đóng lại
- Page refresh và hiển thị review đã tạo
- Button "Đánh giá ngay" biến mất
- ReviewCard hiển thị với options Edit/Delete

**API Check:**
```powershell
# Check review was created
$orderId = "YOUR_ORDER_ID"
$token = "YOUR_TOKEN"

Invoke-RestMethod -Uri "http://localhost:5001/api/reviews/order/$orderId" -Headers @{
    "Authorization" = "Bearer $token"
} | ConvertTo-Json -Depth 10
```

---

## Test Case 2: Validation - Không được review 2 lần

### Bước 1: Với order đã review
1. Vào OrderDetailPage của order đã review
2. Thử tạo review mới bằng API

**Expected:**
- Button "Đánh giá ngay" KHÔNG hiển thị
- Chỉ hiển thị ReviewCard với review hiện tại
- Nếu gọi API: Error "You have already reviewed this order"

**API Test:**
```powershell
$orderId = "YOUR_ORDER_ID"
$restaurantId = "YOUR_RESTAURANT_ID"
$token = "YOUR_TOKEN"

$body = @{
    orderId = $orderId
    restaurantId = $restaurantId
    orderRating = 4
    orderComment = "Test duplicate"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:5001/api/reviews" -Method POST -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    } -Body $body
} catch {
    Write-Host "Expected error: $($_.Exception.Message)" -ForegroundColor Green
}
```

---

## Test Case 3: Update Review

### Bước 1: Edit Review
1. Trong OrderDetailPage với review đã tạo
2. Click icon Edit (✏️) trên ReviewCard
3. ReviewModal mở với data hiện tại

**Expected:**
- Modal title: "Chỉnh sửa đánh giá"
- Form điền sẵn data cũ
- Rating và comment có thể chỉnh sửa

### Bước 2: Submit Update
1. Thay đổi rating (ví dụ: từ 5 xuống 4 sao)
2. Sửa comment: "Món ngon nhưng hơi lâu"
3. Click "Cập nhật"

**Expected:**
- Alert "Cập nhật đánh giá thành công!"
- Modal đóng
- ReviewCard cập nhật với data mới
- Restaurant rating được cập nhật

---

## Test Case 4: Delete Review

### Bước 1: Delete từ OrderDetailPage
1. Click icon Delete (🗑️) trên ReviewCard
2. Confirm dialog xuất hiện
3. Click OK

**Expected:**
- Alert "Đã xóa đánh giá!"
- ReviewCard biến mất
- Button "Đánh giá ngay" xuất hiện lại
- Order.isReviewed = false
- Restaurant rating được cập nhật

---

## Test Case 5: User Reviews Page

### Bước 1: Truy cập My Reviews
1. Vào `http://localhost:3475/my-reviews`
2. Hoặc từ Profile page

**Expected:**
- Hiển thị header với stats (tổng số reviews)
- List tất cả reviews của user
- Mỗi ReviewCard có:
  - Thông tin restaurant (showRestaurant=true)
  - Order ID (showOrder=true)
  - Edit/Delete buttons

### Bước 2: Test Edit từ My Reviews
1. Click Edit trên một review
2. ReviewModal mở
3. Sửa và submit

**Expected:**
- Update thành công
- List refresh với data mới

### Bước 3: Test Delete từ My Reviews
1. Click Delete
2. Confirm
3. Review bị xóa khỏi list

### Bước 4: Test Pagination
1. Tạo nhiều reviews (>10)
2. Kiểm tra pagination buttons
3. Click "Sau" để xem trang 2

---

## Test Case 6: Restaurant Reviews Page

### Bước 1: Truy cập Restaurant Reviews
1. Lấy restaurantId từ một order
2. Vào `http://localhost:3475/restaurants/{restaurantId}/reviews`

**Expected:**
- Statistics section:
  - Average rating (số lớn)
  - Rating stars
  - Total reviews count
  - Distribution chart (1-5 sao)

### Bước 2: Test Filter by Rating
1. Click button "5 ⭐"
2. List chỉ hiển thị reviews 5 sao

**Expected:**
- Filter active (button màu xanh)
- Reviews filtered correctly
- Pagination reset về trang 1

### Bước 3: Test Sort Options
1. Select "Rating cao nhất"
2. Reviews sort theo rating giảm dần

**Expected:**
- Reviews 5 sao hiển thị đầu tiên
- Reviews 1 sao hiển thị cuối

### Bước 4: Test Combined Filter + Sort
1. Filter "4 ⭐"
2. Sort "Cũ nhất"

**Expected:**
- Chỉ reviews 4 sao
- Sắp xếp theo thời gian tăng dần

---

## Test Case 7: Restaurant Rating Update

### Bước 1: Check Initial Rating
```powershell
$restaurantId = "YOUR_RESTAURANT_ID"
$token = "YOUR_TOKEN"

$restaurant = Invoke-RestMethod -Uri "http://localhost:5001/api/restaurant/$restaurantId" -Headers @{
    "Authorization" = "Bearer $token"
}
Write-Host "Rating: $($restaurant.ratingsAverage)" -ForegroundColor Cyan
Write-Host "Count: $($restaurant.ratingsQuantity)" -ForegroundColor Cyan
```

### Bước 2: Create Review với rating 5
1. Tạo review mới với orderRating = 5
2. Check restaurant rating

**Expected:**
- ratingsQuantity tăng lên 1
- ratingsAverage được tính lại

### Bước 3: Create thêm Review với rating 3
1. Tạo review khác với orderRating = 3
2. Check restaurant rating

**Expected:**
- ratingsQuantity tăng lên 2
- ratingsAverage = (5 + 3) / 2 = 4.0

### Bước 4: Delete một review
1. Xóa review rating 5
2. Check restaurant rating

**Expected:**
- ratingsQuantity giảm xuống 1
- ratingsAverage = 3.0

---

## Test Case 8: Validation Tests

### Test 8.1: Order chưa Success không review được
1. Tạo order với status "Processed"
2. Truy cập OrderDetailPage

**Expected:**
- Section "Đánh giá đơn hàng" KHÔNG hiển thị

### Test 8.2: Comment quá dài
1. Mở ReviewModal
2. Nhập comment >500 ký tự
3. Submit

**Expected:**
- Validation error hiển thị
- Submit bị block

### Test 8.3: Rating required
1. Mở ReviewModal
2. Không chọn rating tổng thể
3. Click submit

**Expected:**
- Button disabled hoặc validation error
- "Vui lòng đánh giá nhà hàng"

---

## Test Case 9: Responsive UI

### Test trên Mobile (F12 -> Toggle Device)
1. OrderDetailPage
   - ReviewModal hiển thị full screen
   - Touch-friendly buttons

2. UserReviewsPage
   - List stack vertically
   - Pagination responsive

3. RestaurantReviewsPage
   - Statistics grid 1 column
   - Filter buttons wrap
   - Sort dropdown full width

---

## Test Case 10: Error Handling

### Test 10.1: Network Error
1. Stop product-service
2. Thử tạo review

**Expected:**
- Error message hiển thị
- Loading state kết thúc

### Test 10.2: Unauthorized
1. Logout
2. Thử access /my-reviews

**Expected:**
- Redirect to login
- Hoặc hiển thị "Vui lòng đăng nhập"

### Test 10.3: Invalid Order ID
```powershell
$token = "YOUR_TOKEN"
$body = @{
    orderId = "invalid_id_123"
    restaurantId = "some_restaurant_id"
    orderRating = 5
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:5001/api/reviews" -Method POST -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    } -Body $body
} catch {
    Write-Host "Expected error: $($_.Exception.Message)" -ForegroundColor Green
}
```

---

## Automated Test Script

```powershell
# test-review-feature.ps1
$baseUrl = "http://localhost:5001"
$token = "YOUR_JWT_TOKEN"

Write-Host "=== Review Feature Test Suite ===" -ForegroundColor Magenta

# Test 1: Health Check
Write-Host "`n[Test 1] Health Check Services..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/api/v1/products/health"
    Write-Host "✓ Product Service: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "✗ Product Service Failed" -ForegroundColor Red
}

# Test 2: Get Reviews Stats
Write-Host "`n[Test 2] Get Restaurant Stats..." -ForegroundColor Yellow
$restaurantId = "YOUR_RESTAURANT_ID"
try {
    $stats = Invoke-RestMethod -Uri "$baseUrl/api/reviews/stats/restaurant/$restaurantId"
    Write-Host "✓ Average: $($stats.data.averageRating)" -ForegroundColor Green
    Write-Host "✓ Total: $($stats.data.totalReviews)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to get stats" -ForegroundColor Red
}

# Test 3: Get User Reviews
Write-Host "`n[Test 3] Get User Reviews..." -ForegroundColor Yellow
$userId = "YOUR_USER_ID"
try {
    $reviews = Invoke-RestMethod -Uri "$baseUrl/api/reviews/user/$userId" -Headers @{
        "Authorization" = "Bearer $token"
    }
    Write-Host "✓ Found $($reviews.results) reviews" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to get user reviews" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Magenta
```

---

## Checklist Tổng Kết

### Backend
- [ ] Review Model có đủ fields
- [ ] Review Controller có 8 functions
- [ ] Review Routes mounted đúng
- [ ] Order Model có isReviewed field
- [ ] Restaurant Model có rating fields
- [ ] Inter-service communication hoạt động
- [ ] Validation đúng
- [ ] Error handling đầy đủ

### Frontend
- [ ] ReviewApi exported đúng
- [ ] 4 Components hoạt động
- [ ] OrderDetailPage tích hợp review
- [ ] RestaurantReviewsPage hoạt động
- [ ] UserReviewsPage hoạt động
- [ ] Routes đã thêm vào App.jsx
- [ ] Responsive trên mobile
- [ ] Loading states đúng
- [ ] Error handling UI

### Business Logic
- [ ] User chỉ review order của mình
- [ ] Order phải Success mới review được
- [ ] Không review 2 lần
- [ ] Update review chỉ của mình
- [ ] Delete review chỉ của mình
- [ ] Restaurant rating update tự động
- [ ] Order isReviewed flag update đúng

### UX/UI
- [ ] Modal animations smooth
- [ ] Button states (loading, disabled) rõ ràng
- [ ] Error messages dễ hiểu
- [ ] Success feedback rõ ràng
- [ ] Responsive design tốt
- [ ] Icons và colors hợp lý

---

## Known Issues & Limitations

1. **Review chỉ cho completed orders**: Order phải có status "Success"
2. **Không edit được sau X ngày**: Có thể thêm time limit
3. **Rating chỉ 1-5 sao**: Không có half stars
4. **Images trong review**: Chưa support upload ảnh
5. **Reply to review**: Restaurant chưa reply được

---

## Next Steps (Optional Enhancements)

1. **Restaurant Dashboard Reviews**: Thêm trang xem reviews trong restaurant client
2. **Image Upload**: Cho phép upload ảnh trong review
3. **Reply System**: Restaurant có thể reply reviews
4. **Helpful Votes**: Users vote reviews helpful/not helpful
5. **Report Review**: Report spam/inappropriate reviews
6. **Review Badges**: "Verified Buyer", "Top Reviewer", etc.
7. **Review Summary**: AI-generated summary của reviews
8. **Sentiment Analysis**: Phân tích sentiment positive/negative
