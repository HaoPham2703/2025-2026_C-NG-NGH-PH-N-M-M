### **User Flow**

1. **Người dùng mở FoodFast web app**:  
   - Người dùng truy cập ứng dụng web FoodFast qua trình duyệt (React SPA) trên máy tính hoặc thiết bị di động. Giao diện tự động hiển thị ngôn ngữ mặc định của thiết bị (ví dụ: tiếng Việt) và kiểm tra kết nối internet.  
2. **Đăng nhập (nếu đã có tài khoản) hoặc đăng ký tài khoản mới**:  
   - Nếu đã có tài khoản, người dùng nhập email và mật khẩu, gửi yêu cầu *POST /api/auth/login* qua API Gateway. Hệ thống xác thực qua User Service, trả về Access Token và Refresh Token nếu thành công.  
   - Nếu chưa có, người dùng chọn "Đăng ký", gửi *POST /api/auth/register* với thông tin cơ bản (email, mật khẩu), áp dụng rate limiting và Captcha, sau đó User Service lưu dữ liệu vào Users DB.  
3. **Duyệt sản phẩm, thêm vào giỏ hàng và đặt đơn**:  
   - Người dùng duyệt danh sách sản phẩm qua *GET /products* (hỗ trợ lọc theo giá, loại món), xem chi tiết qua *GET /products/:id*.  
   - Thêm sản phẩm vào giỏ hàng qua *POST /cart/add*, kiểm tra tồn kho từ Product Service, và xem giỏ hàng qua *GET /cart/:userId*.  
   - Khi xác nhận đặt đơn, gửi POST /orders để tạo đơn hàng với trạng thái PENDING, Order Service lấy dữ liệu từ Cart Service và xóa giỏ hàng tạm.  
4. **Khi đơn hàng được xác nhận, Order Service sẽ gửi request đến Payment Service để xử lý thanh toán giả lập**:  
   - Order Service gửi sự kiện OrderCreated qua Kafka, Payment Service nhận và xử lý POST /payments/process với Idempotency Key để tránh trùng lặp.  
   - Nếu thành công, Payment Service gửi sự kiện PaymentSucceeded qua Kafka, Order Service cập nhật trạng thái thành CONFIRMED. Nếu thất bại, trạng thái chuyển thành FAILED.  
5. **Sau khi thanh toán thành công, Order Service sẽ gửi yêu cầu đến Delivery & GPS Service để khởi động drone và bắt đầu hành trình giao hàng**:  
   - Order Service gửi sự kiện OrderConfirmed qua Kafka, Drone Dispatcher Service nhận, chọn drone phù hợp (dựa trên pin và vị trí), và gửi POST /delivery/start-trip đến Delivery & GPS Service.  
   - Delivery & GPS Service khởi động drone với tọa độ từ Orders DB.  
6. **Drone nhận tọa độ GPS của người dùng và nhà hàng. Delivery & GPS Service sử dụng thuật toán tìm đường tối ưu để xác định tuyến đường bay**:  
   - Với giả định đường bay thẳng, Delivery & GPS Service tính toán khoảng cách Euclidean giữa tọa độ quán ăn và địa chỉ giao hàng.  
   - Kiểm tra an toàn.  
7. **Trong quá trình giao hàng, người dùng có thể theo dõi vị trí của drone và thời gian nhận hàng dự kiến thông qua Delivery & GPS Service)**:  
   - Người dùng truy cập GET /delivery/:orderId/location để xem vị trí drone thời gian thực (qua WebSocket), và GET /delivery/:orderId/eta để nhận ETA cập nhật động.  
   - Giao diện bản đồ hiển thị đường bay thẳng, marker cho quán và địa chỉ, cùng thông báo âm thanh (Play/Pause) về ETA.  
8. **Sau khi drone đến nơi, đơn hàng được hoàn tất**:  
   - Delivery & GPS Service gửi sự kiện OrderDelivered qua Kafka khi drone hạ cánh, Order Service cập nhật trạng thái thành DELIVERED.  
   - Nếu thanh toán tiền mặt, nhân viên giao hàng cung cấp OTP, người dùng nhập để xác nhận qua app, và giao diện chuyển sang trạng thái "Hoàn tất".

