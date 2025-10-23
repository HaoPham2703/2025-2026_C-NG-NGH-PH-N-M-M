import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "react-query";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Clock,
  ShoppingBag,
  DollarSign,
  CheckCircle,
  XCircle,
  Package,
} from "lucide-react";
import toast from "react-hot-toast";

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // TODO: Replace with actual API call
  const { data: order, isLoading } = useQuery(
    ["restaurantOrder", orderId],
    async () => {
      // Placeholder data
      return {
        _id: orderId,
        customerName: "Nguyễn Văn A",
        customerPhone: "0912345678",
        customerEmail: "nguyenvana@example.com",
        items: [
          {
            _id: "1",
            productName: "Phở Bò",
            quantity: 2,
            price: 50000,
            image: "/images/pho-bo.jpg",
          },
          {
            _id: "2",
            productName: "Bánh Mì",
            quantity: 1,
            price: 25000,
            image: "/images/banh-mi.jpg",
          },
        ],
        subtotal: 125000,
        shippingFee: 15000,
        totalAmount: 140000,
        status: "preparing",
        paymentMethod: "cash",
        paymentStatus: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        address: {
          name: "Nguyễn Văn A",
          phone: "0912345678",
          detail: "123 Nguyễn Huệ",
          ward: "Phường Bến Nghé",
          district: "Quận 1",
          province: "TP. Hồ Chí Minh",
        },
        note: "Giao trước 12h, không ớt",
        statusHistory: [
          {
            status: "pending",
            timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
            note: "Đơn hàng được tạo",
          },
          {
            status: "preparing",
            timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
            note: "Nhà hàng đang chuẩn bị",
          },
        ],
      };
    }
  );

  const updateOrderStatusMutation = useMutation(
    async (status) => {
      // TODO: Replace with actual API call
      const response = await fetch(
        `http://localhost:3003/api/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("restaurant_token")}`,
          },
          body: JSON.stringify({ status }),
        }
      );
      if (!response.ok) throw new Error("Cập nhật thất bại");
      return response.json();
    },
    {
      onSuccess: () => {
        toast.success("Cập nhật trạng thái thành công!");
        queryClient.invalidateQueries(["restaurantOrder", orderId]);
        queryClient.invalidateQueries("restaurantOrders");
      },
      onError: () => {
        toast.error("Cập nhật thất bại!");
      },
    }
  );

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-800" },
      preparing: { label: "Đang chuẩn bị", color: "bg-blue-100 text-blue-800" },
      ready: { label: "Sẵn sàng", color: "bg-purple-100 text-purple-800" },
      delivering: { label: "Đang giao", color: "bg-indigo-100 text-indigo-800" },
      completed: { label: "Hoàn thành", color: "bg-green-100 text-green-800" },
      cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800" },
    };
    return badges[status] || badges.pending;
  };

  const getPaymentMethodLabel = (method) => {
    const methods = {
      cash: "Tiền mặt",
      momo: "MoMo",
      vnpay: "VNPay",
      card: "Thẻ ngân hàng",
    };
    return methods[method] || method;
  };

  const handleStatusChange = (newStatus) => {
    if (confirm(`Bạn có chắc muốn chuyển đơn hàng sang trạng thái "${getStatusBadge(newStatus).label}"?`)) {
      updateOrderStatusMutation.mutate(newStatus);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Không tìm thấy đơn hàng
        </h2>
        <button
          onClick={() => navigate("/restaurant/dashboard/orders")}
          className="text-orange-600 hover:text-orange-700 font-medium"
        >
          ← Quay lại danh sách đơn hàng
        </button>
      </div>
    );
  }

  const statusBadge = getStatusBadge(order.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/restaurant/dashboard/orders")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Chi tiết đơn hàng
            </h2>
            <p className="text-sm text-gray-600 mt-1">Mã đơn: {order._id}</p>
          </div>
        </div>
        <span
          className={`px-4 py-2 text-sm font-semibold rounded-full ${statusBadge.color}`}
        >
          {statusBadge.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <ShoppingBag className="h-5 w-5 mr-2 text-orange-600" />
                Món ăn ({order.items?.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {order.items?.map((item) => (
                <div key={item._id} className="p-6 flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {item.productName}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Số lượng: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(item.price * item.quantity)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(item.price)} / món
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tạm tính</span>
                  <span className="text-gray-900 font-medium">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(order.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Phí giao hàng</span>
                  <span className="text-gray-900 font-medium">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(order.shippingFee)}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between">
                  <span className="font-semibold text-gray-900">Tổng cộng</span>
                  <span className="font-bold text-xl text-orange-600">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(order.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Note */}
          {order.note && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Ghi chú từ khách hàng</h4>
              <p className="text-blue-800">{order.note}</p>
            </div>
          )}

          {/* Status History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-orange-600" />
              Lịch sử trạng thái
            </h3>
            <div className="space-y-4">
              {order.statusHistory?.map((history, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-2 h-2 rounded-full bg-orange-600 mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {getStatusBadge(history.status).label}
                    </p>
                    <p className="text-sm text-gray-600">{history.note}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(history.timestamp).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-orange-600" />
              Thông tin khách hàng
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Tên khách hàng</p>
                <p className="font-medium text-gray-900">{order.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Số điện thoại</p>
                <p className="font-medium text-gray-900">{order.customerPhone}</p>
              </div>
              {order.customerEmail && (
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{order.customerEmail}</p>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-orange-600" />
              Địa chỉ giao hàng
            </h3>
            <div className="space-y-2">
              <p className="font-medium text-gray-900">{order.address.name}</p>
              <p className="text-sm text-gray-600">{order.address.phone}</p>
              <p className="text-sm text-gray-900">
                {order.address.detail}, {order.address.ward}, {order.address.district}, {order.address.province}
              </p>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-orange-600" />
              Thanh toán
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Phương thức</p>
                <p className="font-medium text-gray-900">
                  {getPaymentMethodLabel(order.paymentMethod)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Trạng thái</p>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    order.paymentStatus === "paid"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {order.paymentStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Thao tác
            </h3>
            <div className="space-y-2">
              {order.status === "pending" && (
                <>
                  <button
                    onClick={() => handleStatusChange("preparing")}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="h-5 w-5" />
                    <span>Xác nhận đơn</span>
                  </button>
                  <button
                    onClick={() => handleStatusChange("cancelled")}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <XCircle className="h-5 w-5" />
                    <span>Hủy đơn</span>
                  </button>
                </>
              )}
              {order.status === "preparing" && (
                <button
                  onClick={() => handleStatusChange("ready")}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Món đã sẵn sàng
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;

