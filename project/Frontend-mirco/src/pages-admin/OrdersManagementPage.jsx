import { useState, useMemo } from "react";
import { useQuery } from "react-query";
import { orderApi } from "../api/orderApi";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Search,
  Eye,
} from "lucide-react";
import OrderDetailAdminPage from "./OrderDetailAdminPage";
import Pagination from "./components/Pagination";

const OrdersManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Fetch orders với pagination từ backend
  const {
    data: ordersData,
    isLoading,
    error: ordersError,
  } = useQuery(
    ["adminAllOrders", currentPage, statusFilter, searchTerm],
    () =>
      orderApi.getOrders({
        page: currentPage,
        limit: itemsPerPage,
        // Gửi status filter lên backend nếu có
        ...(statusFilter !== "all" && { status: statusFilter }),
      }),
    {
      keepPreviousData: true, // Giữ data cũ khi đang load trang mới
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Không retry nếu request bị abort (ECONNABORTED)
        if (
          error?.code === "ECONNABORTED" ||
          error?.message?.includes("aborted")
        ) {
          return false;
        }
        // Retry tối đa 2 lần cho các lỗi khác
        return failureCount < 2;
      },
      retryDelay: 1000,
    }
  );

  // Lấy orders và pagination từ response
  const orders = ordersData?.data?.orders || [];
  const pagination = ordersData?.data?.pagination || {
    page: currentPage,
    limit: itemsPerPage,
    total: 0,
    totalPages: 0,
  };

  // Filter orders ở client-side cho search (vì search có thể cần filter nhiều field)
  // Backend sẽ xử lý pagination và status filter
  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;
    return orders.filter((order) => {
      const matchesSearch =
        order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.receiver?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.phone?.includes(searchTerm);
      return matchesSearch;
    });
  }, [orders, searchTerm]);

  // Reset to page 1 when filter or search changes
  useMemo(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  const totalPages = pagination.totalPages || 0;
  const paginatedOrders = filteredOrders;

  const getStatusBadge = (status) => {
    const badges = {
      Processed: "bg-blue-100 text-blue-800",
      "Waiting Goods": "bg-yellow-100 text-yellow-800",
      Delivery: "bg-purple-100 text-purple-800",
      Success: "bg-green-100 text-green-800",
      Cancelled: "bg-red-100 text-red-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status) => {
    const texts = {
      Processed: "Đã xử lý",
      "Waiting Goods": "Chờ hàng",
      Delivery: "Đang giao",
      Success: "Thành công",
      Cancelled: "Đã hủy",
    };
    return texts[status] || status;
  };

  // Hiển thị lỗi nếu có (trừ lỗi request aborted)
  if (ordersError) {
    const isAborted =
      ordersError?.code === "ECONNABORTED" ||
      ordersError?.message?.includes("aborted");

    // Nếu là lỗi aborted nhưng đã có data, không hiển thị lỗi
    if (isAborted && ordersData) {
      console.warn(
        "[OrdersManagementPage] Request aborted but data available, continuing..."
      );
    } else if (!isAborted) {
      // Chỉ hiển thị lỗi nếu không phải aborted
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-red-600 mb-4">
              Lỗi khi tải đơn hàng: {ordersError?.message || "Đã xảy ra lỗi"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Thử lại
            </button>
          </div>
        </div>
      );
    }
  }

  if (isLoading && !ordersData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If order is selected, show detail page
  if (selectedOrderId) {
    return (
      <OrderDetailAdminPage
        id={selectedOrderId}
        onBack={() => setSelectedOrderId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h2>
          <p className="text-sm text-gray-600 mt-1">
            {searchTerm ? (
              <>
                Tìm kiếm: {filteredOrders.length} kết quả trên trang này
                {filteredOrders.length === 0 && orders.length > 0 && (
                  <span className="text-gray-500 ml-2">
                    (không tìm thấy trên trang {currentPage})
                  </span>
                )}
              </>
            ) : (
              <>
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến{" "}
                {Math.min(currentPage * itemsPerPage, pagination.total || 0)}{" "}
                trong tổng số {pagination.total || 0} kết quả
              </>
            )}
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm đơn hàng..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full sm:w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
          >
            <option value="all">Tất cả</option>
            <option value="Processed">Đã xử lý</option>
            <option value="Waiting Goods">Chờ hàng</option>
            <option value="Delivery">Đang giao</option>
            <option value="Success">Thành công</option>
            <option value="Cancelled">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã đơn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tổng tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedOrders?.map((order) => (
                <tr
                  key={order._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono font-medium text-gray-900">
                      #{order._id.slice(-8).toUpperCase()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.receiver}
                    </div>
                    <div className="text-xs text-gray-500">{order.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">
                      {order.cart?.length || 0} món
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(order.totalPrice)}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {order.payments}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedOrderId(order._id)}
                      className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-900 transition-colors"
                    >
                      <Eye size={16} />
                      Xem
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={pagination.total || 0}
            itemsPerPage={itemsPerPage}
          />
        </div>

        {/* Empty State */}
        {filteredOrders?.length === 0 && (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không tìm thấy đơn hàng
            </h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== "all"
                ? "Không có đơn hàng nào khớp với bộ lọc"
                : "Chưa có đơn hàng nào trong hệ thống"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersManagementPage;
