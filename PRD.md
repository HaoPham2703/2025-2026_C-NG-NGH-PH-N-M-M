### **(PRD): Hệ Thống Giao Hàng Drone FoodFast**

**Tổng Quan Sản Phẩm**: FoodFast là nền tảng web tiên tiến cho việc đặt hàng thức ăn nhanh với giao hàng bằng drone, nhằm tối ưu hóa quy trình đặt hàng và rút ngắn thời gian vận chuyển ở các khu vực đô thị. Hệ thống sử dụng kiến trúc microservices kết hợp giao diện React thân thiện, tận dụng công nghệ GPS để định tuyến drone hiệu quả và theo dõi thời gian thực.

#### **Sự Phù Hợp Vấn Đề**

Các nền tảng giao thức ăn hiện nay thường có giao diện rườm rà, xử lý chậm chạp và trải nghiệm người dùng kém. Các quán ăn nhỏ thiếu công cụ quản lý đơn hàng đơn giản, trong khi giao hàng truyền thống bị ảnh hưởng bởi ùn tắc giao thông, dẫn đến thời gian chờ đợi không ổn định. Việc áp dụng drone giúp vượt qua rào cản giao thông mặt đất, nhưng cần tích hợp GPS chính xác để đảm bảo an toàn và tốc độ.

Các Thách Thức Chính:

* Thời gian xác nhận và xử lý đơn hàng thường vượt quá 1 phút, gây mất khách hàng.  
* Giao hàng truyền thống trung bình 30-45 phút, ảnh hưởng đến chất lượng thức ăn.  
* Khó khăn trong việc mở rộng cho giờ cao điểm mà không có backend vững chắc.

#### **Cách Tiếp Cận Cấp Cao**

Xây dựng ứng dụng web responsive sử dụng React để mang lại trải nghiệm mượt mà trên mọi thiết bị. Backend dựa trên microservices với FastAPI để đạt hiệu suất cao và khả năng mở rộng. Tích hợp GPS qua API bên ngoài (như Google Maps) để tối ưu hóa lộ trình drone và theo dõi trực tiếp. Sử dụng hàng đợi tin nhắn cho giao tiếp bất đồng bộ giữa các dịch vụ, đảm bảo độ tin cậy.

Các Thành Phần Cốt Lõi:

* Frontend: React SPA cung cấp trải nghiệm cho người dùng không cần phải load lại   
* Backend: Các microservices được container hóa, triển khai qua Docker, với giám sát hệ thống.  
* Dữ Liệu: MongoDB trên Azure để lưu trữ linh hoạt, Redis để cache dữ liệu thường dùng như trạng thái đơn hàng.

#### **Câu Chuyện**

Một khách hàng mở ứng dụng FoodFast trên điện thoại, duyệt menu từ các quán gần đó, chọn món và đặt hàng. Sau xác nhận thanh toán nhanh chóng, hệ thống phân bổ drone, tính toán lộ trình bay tối ưu dựa trên GPS từ quán đến địa chỉ khách. Khách hàng theo dõi vị trí drone trên bản đồ thời gian thực, nhận thông báo thời gian đến ước tính. Khi drone đến nơi, đơn hàng được giao, đảm bảo thức ăn nóng hổi trong vòng dưới 20 phút.

#### **Mục Tiêu**

* Đạt thời gian xử lý đơn hàng dưới 30 giây và giao hàng dưới 20 phút nhờ tối ưu hóa drone.  
* Tăng sự hài lòng của khách hàng với theo dõi GPS thời gian thực, giảm khiếu nại về trễ nãi 50%.  
* Xây dựng hệ thống có khả năng mở rộng, xử lý tải cao mà không gián đoạn, sử dụng orchestration container.

#### **Sự Phù Hợp Giải Pháp**

Giải pháp sử dụng thiết kế modular microservices để phân tách trách nhiệm, cho phép mở rộng độc lập. Tích hợp GPS là yếu tố trung tâm cho hoạt động drone, với cơ chế dự phòng chuyển sang giao thủ công nếu cần.

**Các Tính Năng Chính**:

1. Ứng dụng định hướng và theo dõi sử dụng GPS để giám sát vị trí drone, nhấn mạnh lộ trình giao hàng và khoảng cách đến khách.  
2. Gợi ý lộ trình tùy chỉnh theo số lượng điểm dừng, với hướng dẫn bay tối ưu cho drone (ví dụ: tránh khu vực cấm bay).  
3. Cơ sở dữ liệu lưu trữ toàn bộ dữ liệu sinh ra, bao gồm tọa độ drone, phạm vi gần, và hình ảnh thumbnail đơn hàng.  
4. Bảng điều khiển admin cho nhân viên quản lý phiên, cập nhật dữ liệu quán ăn, và giám sát đội drone.  
5. Bảng giám sát để theo dõi sức khỏe hệ thống và thông tin sử dụng thời gian thực.  
6. Xử lý thanh toán tích hợp với luồng đơn hàng, hỗ trợ cổng trực tuyến và tiền mặt.

**Các Cân Nhắc Tương Lai**:

1. Cache các truy vấn đơn hàng gần nhất và cập nhật trạng thái để tăng tốc độ.  
2. Nhật ký thời gian thực theo dõi hoạt động drone và tương tác người dùng.

#### **Các Luồng Chính**

**Luồng Hoạt Động**:

* **Quản Lý Dữ Liệu Ứng Dụng**: Admin cập nhật menu/quán ăn qua bảng điều khiển → Pipeline xử lý thay đổi → Đẩy cập nhật vào cơ sở dữ liệu.  
* **Luồng Chính**: Khách yêu cầu dữ liệu đơn hàng → Dịch vụ liên quan định hướng lấy thông tin GPS → Backend xử lý → Phản hồi với cập nhật thời gian thực.

**Luồng Xử Lý Thanh Toán**:

* Trực Tuyến: Người dùng khởi xướng thanh toán → Sinh URL bảo mật với token xác thực → Chuyển hướng đến cổng → Thông báo thành công → Tạo phiên đơn hàng.  
* Ngoại Tuyến (Tiền Mặt): Hiển thị mã phiên → Nhân viên xác nhận thanh toán → Sinh mã xác thực → Người dùng xác minh → Truy cập theo dõi đơn hàng.

#### **Logic Chính**

1. Lấy Thông Tin Đơn Hàng: Toàn bộ cơ sở dữ liệu ứng dụng, bao gồm chi tiết đơn và dữ liệu GPS, được tải về frontend sau xác thực. Frontend tránh gửi yêu cầu lấy dữ liệu thêm để giảm độ trễ.  
2. Tối Ưu Hóa Lộ Trình: Ma trận adjacency được tính trước cho các điểm giao hàng kiểm soát hiển thị lộ trình và phát drone động.

