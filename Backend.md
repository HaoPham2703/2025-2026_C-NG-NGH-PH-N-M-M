### **Thiết Kế Backend Cho Hệ Thống FoodFast**

Backend của FoodFast được xây dựng dựa trên kiến trúc microservices phân tán, với trọng tâm là xử lý các quy trình giao hàng bằng drone một cách hiệu quả và an toàn. Các dịch vụ được thiết kế độc lập, giao tiếp qua REST API cho các hoạt động đồng bộ và Kafka hay RabbitMQ **c**ho các sự kiện bất đồng bộ như cập nhật trạng thái drone hoặc xác nhận thanh toán. Sử dụng FastAPI làm framework chính để đạt tốc độ cao, kết hợp MongoDB trên Azure cho lưu trữ linh hoạt, Redis cho caching, và container hóa qua Docker với Kubernetes cho môi trường production. Hệ thống giám sát sử dụng Grafana kết hợp Prometheus để theo dõi metrics như thời gian bay, tải hệ thống, và tỷ lệ lỗi giao hàng.

#### **Hệ Thống Phụ (Sub-systems)**

- **Dịch Vụ Định Hướng Và Theo Dõi (Navigation & Tracking Service)**: Xử lý tích hợp GPS để tính toán lộ trình drone và theo dõi vị trí thời gian thực, đảm bảo an toàn bay.  
- **Dịch Vụ Giám Sát Và Báo Cáo (Monitoring & Reporting Service)**: Thu thập log và metrics từ tất cả dịch vụ, hỗ trợ phân tích hoạt động drone và hiệu suất hệ thống.

#### **Ứng Dụng (App)**

- **Ứng dụng web backend**: Dựa trên FastAPI để xử lý yêu cầu cao tải, đảm bảo phản hồi dưới 200ms cho API liên quan đến drone và đơn hàng.  
- **Cơ sở dữ liệu**: MongoDB Azure với tùy chọn nâng cấp tier để hỗ trợ scalability, xử lý dữ liệu lớn từ theo dõi drone.  
- **Caching**: Redis sử dụng LRU cho dữ liệu gần nhất, như cache trạng thái đơn hàng hoặc vị trí drone (phase 2: mở rộng cache sự kiện thanh toán và lộ trình bay).  
- **Container hóa**: Nghiên cứu số replicas và cấu hình để cân bằng tải, tích hợp auto-scaling dựa trên tải drone.

#### **Theo Dõi Và Điều Khiển Drone (Drone Control & Monitoring)**

- **Azure Maps hoặc Google Maps API**: Tích hợp để tìm kiếm lộ trình tối ưu, tính toán ETA dựa trên tọa độ GPS và dữ liệu thời tiết.  
- **Caching**: Redis lưu trữ các cặp vị trí/ETA gần nhất (phase 2: cache sự kiện drone để tăng tốc phản hồi theo dõi).

#### **Dữ Liệu (Data)**

- **Dữ liệu lộ trình drone**: Tái sử dụng dữ liệu từ các chuyến bay trước để tối ưu hóa.  
- **Pipeline tiền xử lý**: Frontend → Azure Blob Storage → Azure Maps. Lập lịch hàng ngày để cập nhật dữ liệu giao thông hoặc hạn chế bay drone.  
- **Tích hợp drone**: Lưu trữ và xử lý dữ liệu lộ trình mà không cần dịch ngôn ngữ, tập trung vào tọa độ và an toàn.

#### **Lộ Trình Bay (Route Optimization)**

- **Giả định đường chim bay:**: Áp dụng cho các điểm giao hàng tùy chỉnh trong khu vực đô thị.  
- **Cơ sở dữ liệu nhỏ**: Lưu trữ tọa độ điểm giao, phạm vi hạ cánh an toàn, và dữ liệu thời tiết.

#### **Giám Sát (Monitoring \- Grafana \+ Prometheus \+ Pushgateway)**

- **Metric mặc định**: Theo dõi tải CPU, thời gian phản hồi API, tỷ lệ thành công giao hàng drone, và cảnh báo pin drone thấp.

#### **Các Microservices Chính Và Tương Tác**

Dưới đây là mô tả chi tiết từng microservice, cách chúng hoạt động, và tương tác với các dịch vụ khác.

1. **API Gateway**:  
   - **Mô tả**: Điểm vào duy nhất cho mọi yêu cầu từ frontend, hoạt động như lớp bảo vệ, định tuyến yêu cầu đến dịch vụ phù hợp và quản lý các nhiệm vụ chung như xác thực và kiểm soát tải.  
   - **Chức năng**:  
     + Định tuyến yêu cầu đến microservice đúng (routing).  
     + Xác thực và ủy quyền qua JWT token trước khi chuyển tiếp.  
     + Cân bằng tải giữa các instances dịch vụ.  
     + Ghi log yêu cầu và gửi metrics đến Monitoring Service.  
   - **Lưu trữ dữ liệu**: Không lưu trữ, chỉ proxy.  
   - **Tương tác**: Nhận yêu cầu từ Client Apps (React frontend), chuyển đến các microservices nội bộ như User hoặc Order, và đẩy log đến Monitoring & Logging Service.  
2. **User Service**:  
   - **Mô tả**: Xử lý toàn bộ thông tin người dùng, từ đăng ký đến quản lý hồ sơ, đảm bảo bảo mật và xác thực nhanh chóng.  
   - **Chức năng**:  
     + Đăng ký/đăng nhập người dùng, cập nhật hồ sơ (địa chỉ giao hàng, liên hệ).  
     + Cấp và thu hồi JWT token, hỗ trợ RBAC (Role-Based Access Control) cho khách hàng và admin quán ăn.  
   - **Lưu trữ dữ liệu**: Users DB (MongoDB) \- lưu thông tin cá nhân và lịch sử đăng nhập.  
   - **Tương tác**: Kết nối với API Gateway để xác thực, cung cấp dữ liệu người dùng cho Order Service khi tạo đơn hàng, và gửi sự kiện đăng nhập đến Message Broker để ghi log.  
3. **Product Service**:  
   - **Mô tả**: Quản lý danh mục sản phẩm fast food từ các quán đối tác, hỗ trợ tìm kiếm và cập nhật menu động.  
   - **Chức năng**:  
     + Thêm/sửa/xóa món ăn, quản lý danh mục (burger, pizza, v.v.), tìm kiếm và lọc sản phẩm theo giá hoặc quán.  
   - **Lưu trữ dữ liệu**: Products DB (MongoDB) \- lưu thông tin món ăn, hình ảnh, và quán đối tác.  
   - **Tương tác**: Kết nối trực tiếp với API Gateway để frontend truy vấn menu, cung cấp dữ liệu sản phẩm cho Order Service khi thêm vào đơn hàng.  
4. **Cart Service** (Thêm mới để tối ưu giỏ hàng):  
   - **Mô tả**: Dịch vụ riêng biệt để quản lý giỏ hàng tạm thời, tránh mất dữ liệu khi người dùng tải lại trang.  
   - **Chức năng**:  
     + Thêm/bớt sản phẩm vào giỏ, tính tổng giá tạm thời, lưu trữ giỏ hàng theo phiên người dùng.  
   - **Lưu trữ dữ liệu**: Carts DB (MongoDB) \- lưu giỏ hàng tạm thời với thời hạn hết hạn.  
   - **Tương tác**: Nhận yêu cầu từ API Gateway, đồng bộ dữ liệu với Product Service để lấy giá sản phẩm, và chuyển giỏ hàng sang Order Service khi xác nhận đơn.  
5. **Order Service**:  
   - **Mô tả**: Quản lý vòng đời đơn hàng từ tạo đến hoàn tất, tích hợp drone để khởi động giao hàng.  
   - **Chức năng**:  
     + Tạo đơn hàng, cập nhật trạng thái (Pending, Confirmed, Preparing, Delivered).  
     + Xem chi tiết và danh sách đơn hàng lịch sử.  
   - **Lưu trữ dữ liệu**: Orders DB (MongoDB) \- lưu chi tiết đơn hàng và trạng thái.  
   - **Tương tác**: Kết nối API Gateway, lấy sản phẩm từ Product Service, gửi thanh toán đến Payment Service, khởi động drone qua Drone Dispatcher Service. Nhận cập nhật từ Message Broker (ví dụ: thanh toán thành công hoặc drone đến nơi).  
6. **Payment Service**:  
   - **Mô tả**: Xử lý giao dịch thanh toán an toàn, bắt đầu từ mô phỏng và mở rộng sang cổng thực tế.  
   - **Chức năng**:  
     + Xử lý thanh toán mô phỏng ban đầu, tích hợp với cổng ngoài như VNPay hoặc Momo.  
   - **Lưu trữ dữ liệu**: Payments DB (MongoDB) \- lưu lịch sử giao dịch và trạng thái.  
   - **Tương tác**: Nhận yêu cầu từ Order Service, kết nối với External Payment Gateway, gửi kết quả qua Message Broker để Order Service cập nhật trạng thái đơn.  
7. **Drone Dispatcher Service** (Thêm mới để quản lý đội drone):  
   - **Mô tả**: Dịch vụ chuyên biệt để phân bổ và điều phối drone, đảm bảo drone sẵn sàng cho đơn hàng.  
   - **Chức năng**:  
     + Tìm drone khả dụng dựa trên vị trí và pin, gửi lệnh khởi động đến Delivery & GPS Service.  
     + Xử lý dự phòng nếu drone không sẵn (chuyển sang giao thủ công).  
   - **Lưu trữ dữ liệu**: Drones DB (MongoDB) \- lưu trạng thái drone, vị trí hiện tại, và lịch sử chuyến bay.  
   - **Tương tác**: Nhận sự kiện từ Order Service qua Message Broker, chuyển yêu cầu đến Delivery & GPS Service, và gửi log đến Monitoring Service.  
8. **Delivery & GPS Service**:  
   - **Mô tả**: Lõi của hệ thống drone, quản lý toàn bộ quy trình bay và theo dõi GPS.  
   - **Chức năng**:  
     + Tính toán lộ trình bay tối ưu dựa trên tọa độ quán và khách.  
     + Gửi lệnh điều khiển drone (cất cánh, bay, hạ cánh).  
     + Theo dõi vị trí GPS thời gian thực và tính ETA.  
     + Cập nhật trạng thái giao hàng (đang bay, đã đến).  
   - **Lưu trữ dữ liệu**: GPS Data DB (MongoDB) \- lưu lộ trình, vị trí drone, và lịch sử.  
   - **Tương tác**: Nhận yêu cầu từ Drone Dispatcher Service, kết nối External Maps API để tính lộ trình, đẩy vị trí/ETA đến frontend qua API Gateway, gửi sự kiện hoàn tất đến Message Broker cho Order Service.  
9. **Monitoring & Logging Service**:  
   - **Mô tả**: Dịch vụ trung tâm để thu thập và phân tích log/metrics từ toàn hệ thống.  
   - **Chức năng**:  
     + Phát hiện lỗi, giám sát hiệu suất, phân tích hành vi drone và người dùng.  
   - **Lưu trữ dữ liệu**: Logs DB (ví dụ: ELK Stack tích hợp với MongoDB).  
   - **Tương tác**: Nhận metrics từ API Gateway và các microservices khác, gửi cảnh báo tự động qua email/Slack nếu vượt ngưỡng.  
10. **Message Broker (Kafka, RabbitMQ)**:  
    - **Mô tả**: Hệ thống hàng đợi để giao tiếp bất đồng bộ giữa các dịch vụ.  
    - **Chức năng**:  
      + Đảm bảo nhất quán dữ liệu qua sự kiện (ví dụ: thanh toán thành công khởi động drone).  
      + Giảm kết nối trực tiếp giữa dịch vụ, tăng khả năng mở rộng.  
    - **Tương tác**: Order, Payment, Drone Dispatcher, và Delivery & GPS Service gửi/nhận message để phối hợp, như cập nhật trạng thái đơn hàng hoặc vị trí drone.

### **Cách API Hoạt Động**

Dưới đây là mô tả chi tiết cách các API hoạt động trong hệ thống backend của FoodFast, dựa trên thiết kế microservices.

**API Gateway**:

+ **POST /api/auth/login**: Xác thực người dùng dựa trên tên đăng nhập và mật khẩu, kiểm tra qua User Service, và trả về Access Token (JWT) cùng Refresh Token nếu thành công. Token có thời gian sống ngắn (15 phút) để đảm bảo bảo mật.  
  + **POST /api/auth/register**: Đăng ký tài khoản mới bằng thông tin cơ bản (email, mật khẩu), áp dụng rate limiting và Captcha để chống spam, sau đó chuyển yêu cầu đến User Service để lưu vào cơ sở dữ liệu.

  **User Service**:

  + **GET /users/:id**: Trả về thông tin người dùng (tên, địa chỉ, liên hệ) dựa trên ID, yêu cầu JWT token hợp lệ để truy cập.  
  + **PATCH /users/:id**: Cập nhật thông tin người dùng (ví dụ: địa chỉ giao hàng), xác thực quyền và ghi đè dữ liệu hiện tại trong Users DB.  
  + **GET /users/:id/orders**: Lấy danh sách đơn hàng đã đặt của người dùng, lấy dữ liệu từ Orders DB qua liên kết với Order Service.

  **Product Service**:

  + **GET /products**: Trả về danh sách sản phẩm với các tham số lọc (giá, loại món, quán), hỗ trợ phân trang và tìm kiếm theo từ khóa.  
  + **GET /products/:id**: Trả về chi tiết sản phẩm (hình ảnh, giá, mô tả) dựa trên ID, tối ưu cache bằng Redis để giảm tải cơ sở dữ liệu.  
  + **POST /products**: Thêm sản phẩm mới (chỉ admin), yêu cầu vai trò admin trong JWT, lưu dữ liệu vào Products DB và gửi sự kiện cập nhật qua Kafka.

  **Cart Service**:

  + **POST /cart/add**: Thêm sản phẩm vào giỏ hàng của người dùng, kiểm tra tồn kho từ Product Service, và lưu tạm thời trong Carts DB.  
  + **GET /cart/:userId**: Trả về danh sách sản phẩm trong giỏ hàng của người dùng, tính tổng giá động.  
  + **DELETE /cart/remove/:itemId**: Xóa một sản phẩm khỏi giỏ hàng, cập nhật tổng giá.

  **Order Service**:

  + **POST /orders**: Tạo đơn hàng mới từ giỏ hàng, lấy dữ liệu từ Cart Service, gán trạng thái PENDING, và gửi sự kiện OrderCreated qua Kafka đến Payment Service.  
  + **GET /orders/:id**: Trả về chi tiết đơn hàng (sản phẩm, trạng thái, ETA), truy vấn từ Orders DB.  
  + **PATCH /orders/:id/status**: Cập nhật trạng thái đơn hàng (PENDING → CONFIRMED → DELIVERED), yêu cầu xác thực từ Message Broker khi nhận sự kiện từ Delivery & GPS Service.

  **Payment Service**:

  + **POST /payments/process**: Xử lý thanh toán giả lập ban đầu, tạo Idempotency Key để tránh trùng lặp, và trả về kết quả (thành công/thất bại). Gửi sự kiện PaymentSucceeded hoặc PaymentFailed qua Kafka.  
  + **GET /payments/:id**: Trả về chi tiết giao dịch thanh toán, hỗ trợ debug cho admin.

  **Drone Dispatcher Service**:

  + **POST /drone/assign**: Nhận yêu cầu từ Order Service qua Kafka (sự kiện OrderConfirmed), chọn drone khả dụng dựa trên vị trí và pin, và gửi lệnh khởi động đến Delivery & GPS Service.  
  + **GET /drone/status/:id**: Trả về trạng thái drone (sẵn sàng, bay, lỗi), hỗ trợ quản lý đội drone.

  **Delivery & GPS Service**:

  + **POST /delivery/start-trip**: Bắt đầu chuyến giao hàng, tính toán đường bay thẳng dựa trên tọa độ GPS (sử dụng công thức Euclidean), gửi lệnh cất cánh đến drone, và trả về ID chuyến bay.  
  + **GET /delivery/:orderId/location**: Cung cấp vị trí GPS hiện tại của drone theo thời gian thực, lấy từ GPS Data DB và đẩy qua WebSocket.  
  + **GET /delivery/:orderId/eta**: Cung cấp thời gian dự kiến (ETA) dựa trên khoảng cách thẳng và tốc độ drone (ví dụ: 50km/h), cập nhật động khi drone di chuyển.

  **Monitoring & Logging Service**:

  + **GET /metrics**: Trả về các số liệu hệ thống (tải CPU, thời gian phản hồi API, tỷ lệ lỗi), tích hợp với Prometheus.  
  + **POST /log**: Nhận log từ các service khác, gán Correlation ID, và lưu vào Logs DB để phân tích.

