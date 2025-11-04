import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { orderApi } from "../api/orderApi";
import { restaurantClient } from "../api/axiosClients";

const OrdersManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const queryClient = useQueryClient();

  // Get restaurant ID from localStorage
  const restaurantData = JSON.parse(
    localStorage.getItem("restaurant_data") || "{}"
  );
  const restaurantId = restaurantData._id || restaurantData.id;

  // Fetch orders from Order Service API
  const {
    data: ordersResponse,
    isLoading,
    error,
  } = useQuery(
    "restaurantOrders",
    async () => {
      if (!restaurantId) {
        throw new Error("Restaurant ID not found");
      }
      // Call Restaurant Service endpoint which proxies to Order Service
      const response = await restaurantClient.get("/restaurant/orders");
      // orderApi returns response.data, which has shape:
      // { status, results, data: { orders } }
      const ordersList = response?.data?.orders || [];

      // Map Order Service format to UI format
      return ordersList.map((order) => ({
        _id: order._id,
        customerName: order.receiver || "Không có tên",
        customerPhone: order.phone || "N/A",
        items: (order.cart || []).map((item) => ({
          productName: item.product?.title || item.product?.name || "Sản phẩm",
          quantity: item.quantity || 0,
          price: item.product?.price || 0,
        })),
        totalAmount: order.totalPrice || 0,
        status: mapOrderStatus(order.status),
        createdAt: order.createdAt,
        address: order.address || "N/A",
      }));
    },
    {
      retry: 1,
      refetchOnWindowFocus: false,
      enabled: !!restaurantId && !!localStorage.getItem("restaurant_token"),
    }
  );

  // Map Order Service status to UI status
  const mapOrderStatus = (status) => {
    const statusMap = {
      Processed: "pending",
      "Waiting Goods": "preparing",
      Delivery: "delivering",
      Success: "completed",
      Cancelled: "cancelled",
    };
    return statusMap[status] || status?.toLowerCase() || "pending";
  };

  const orders = ordersResponse || [];

  // Map UI status back to Order Service status
  const mapStatusToOrderService = (uiStatus) => {
    const statusMap = {
      pending: "Processed",
      preparing: "Waiting Goods",
      ready: "Waiting Goods",
      delivering: "Delivery",
      completed: "Success",
      cancelled: "Cancelled",
    };
    return statusMap[uiStatus] || "Processed";
  };

  const updateOrderStatusMutation = useMutation(
    async ({ orderId, status }) => {
      // Map UI status to Order Service status
      const orderServiceStatus = mapStatusToOrderService(status);
      return orderApi.updateOrder(orderId, { status: orderServiceStatus });
    },
    {
      onSuccess: () => {
        toast.success("Cập nhật trạng thái thành công!");
        queryClient.invalidateQueries("restaurantOrders");
      },
      onError: () => {
        toast.error("Cập nhật thất bại!");
      },
    }
  );

  const filteredOrders = orders?.filter((order) => {
    const matchesSearch =
      order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone?.includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const paginatedOrders = filteredOrders?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil((filteredOrders?.length || 0) / itemsPerPage);

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        label: "Chờ xác nhận",
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
      },
      preparing: {
        label: "Đang chuẩn bị",
        color: "bg-blue-100 text-blue-800",
        icon: Clock,
      },
      ready: {
        label: "Sẵn sàng",
        color: "bg-purple-100 text-purple-800",
        icon: CheckCircle,
      },
      delivering: {
        label: "Đang giao",
        color: "bg-indigo-100 text-indigo-800",
        icon: Clock,
      },
      completed: {
        label: "Hoàn thành",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
      },
      cancelled: {
        label: "Đã hủy",
        color: "bg-red-100 text-red-800",
        icon: XCircle,
      },
    };
    return badges[status] || badges.pending;
  };

  const handleAcceptOrder = (orderId) => {
    updateOrderStatusMutation.mutate({ orderId, status: "preparing" });
  };

  const handleReadyOrder = (orderId) => {
    updateOrderStatusMutation.mutate({ orderId, status: "ready" });
  };

  const handleCancelOrder = (orderId) => {
    if (confirm("Bạn có chắc muốn hủy đơn hàng này?")) {
      updateOrderStatusMutation.mutate({ orderId, status: "cancelled" });
    }
  };

  const getTimeAgo = (dateString) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return `${Math.floor(hours / 24)} ngày trước`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-12 text-center">
        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Lỗi tải dữ liệu
        </h3>
        <p className="text-gray-600">
          {error.message || "Không thể tải danh sách đơn hàng"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h2>
        <p className="text-sm text-gray-600 mt-1">
          Hiển thị {filteredOrders?.length || 0} / {orders?.length || 0} đơn
          hàng
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã đơn, tên, SĐT..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="preparing">Đang chuẩn bị</option>
            <option value="ready">Sẵn sàng</option>
            <option value="delivering">Đang giao</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {paginatedOrders?.map((order) => {
          const statusBadge = getStatusBadge(order.status);
          const StatusIcon = statusBadge.icon;

          return (
            <div
              key={order._id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Order Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="font-bold text-lg text-gray-900">
                      {order._id}
                    </span>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${statusBadge.color} flex items-center space-x-1`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      <span>{statusBadge.label}</span>
                    </span>
                    <span className="text-sm text-gray-500">
                      {getTimeAgo(order.createdAt)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Khách hàng</p>
                      <p className="font-semibold text-gray-900">
                        {order.customerName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.customerPhone}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        Địa chỉ giao hàng
                      </p>
                      <p className="text-sm text-gray-900">{order.address}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">Món ăn:</p>
                    <div className="space-y-1">
                      {order.items?.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-900">
                            {item.quantity}x {item.productName}
                          </span>
                          <span className="text-gray-600">
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end space-y-3 min-w-[200px]">
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">Tổng tiền</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(order.totalAmount)}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 w-full">
                    {order.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleAcceptOrder(order._id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                        >
                          Xác nhận đơn
                        </button>
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                        >
                          Hủy đơn
                        </button>
                      </>
                    )}

                    {order.status === "preparing" && (
                      <button
                        onClick={() => handleReadyOrder(order._id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                      >
                        Món đã sẵn sàng
                      </button>
                    )}

                    <Link
                      to={`/restaurant/dashboard/orders/${order._id}`}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium text-center flex items-center justify-center space-x-1"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Xem chi tiết</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredOrders?.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Không tìm thấy đơn hàng
          </h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== "all"
              ? "Không có đơn hàng nào khớp với bộ lọc"
              : "Chưa có đơn hàng nào"}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trước
            </button>
            <span className="px-4 py-2 text-sm text-gray-700">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagementPage;
