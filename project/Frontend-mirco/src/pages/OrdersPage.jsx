import React from "react";
import { useQuery } from "react-query";
import { Link } from "react-router-dom";
import { orderApi } from "../api/orderApi";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  CreditCard,
} from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";

const OrdersPage = () => {
  const [selectedStatus, setSelectedStatus] = React.useState("all");

  const {
    data: orders,
    isLoading,
    error,
  } = useQuery("orders", orderApi.getOrders, {
    refetchOnWindowFocus: false,
  });

  // Filter orders based on selected status
  const filteredOrders = React.useMemo(() => {
    if (!orders?.data?.orders) return [];
    if (selectedStatus === "all") return orders.data.orders;
    return orders.data.orders.filter(
      (order) => order.status === selectedStatus
    );
  }, [orders, selectedStatus]);

  const statusTabs = [
    { value: "all", label: "Tất cả", icon: Package },
    { value: "Processed", label: "Đã xử lý", icon: Clock },
    { value: "Waiting Goods", label: "Chờ hàng", icon: Package },
    { value: "Delivery", label: "Đang giao", icon: Truck },
    { value: "Success", label: "Thành công", icon: CheckCircle },
    { value: "Cancelled", label: "Đã hủy", icon: XCircle },
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case "Processed":
        return <Clock className="w-5 h-5 text-blue-500" />;
      case "Waiting Goods":
        return <Package className="w-5 h-5 text-yellow-500" />;
      case "Delivery":
        return <Truck className="w-5 h-5 text-purple-500" />;
      case "Success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "Cancelled":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "Processed":
        return "Đã xử lý";
      case "Waiting Goods":
        return "Chờ hàng";
      case "Delivery":
        return "Đang giao";
      case "Success":
        return "Thành công";
      case "Cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Processed":
        return "bg-blue-100 text-blue-800";
      case "Waiting Goods":
        return "bg-yellow-100 text-yellow-800";
      case "Delivery":
        return "bg-purple-100 text-purple-800";
      case "Success":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Lỗi tải đơn hàng
          </h2>
          <p className="text-gray-600">Vui lòng thử lại sau</p>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: "Trang Chủ", path: "/" },
    { label: "Đơn Hàng", path: "/orders" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Breadcrumb items={breadcrumbItems} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            Đơn Hàng Của Tôi
          </h1>
          <p className="text-gray-600 text-lg">
            Quản lý và theo dõi tất cả đơn hàng của bạn
          </p>
          {orders?.data?.orders?.length > 0 && (
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
              <Package className="w-5 h-5 text-primary-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">
                {orders.data.orders.length} đơn hàng
              </span>
            </div>
          )}
        </div>

        {/* Status Filter Tabs */}
        {orders?.data?.orders?.length > 0 && (
          <div className="mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-4">
              <div className="flex flex-wrap gap-2">
                {statusTabs.map((tab) => {
                  const Icon = tab.icon;
                  const count =
                    tab.value === "all"
                      ? orders.data.orders.length
                      : orders.data.orders.filter((o) => o.status === tab.value)
                          .length;

                  return (
                    <button
                      key={tab.value}
                      onClick={() => setSelectedStatus(tab.value)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                        selectedStatus === tab.value
                          ? "bg-primary-600 text-white shadow-md"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                      <span
                        className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          selectedStatus === tab.value
                            ? "bg-white/20 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            {filteredOrders.length > 0 && (
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <p>
                  Hiển thị{" "}
                  <span className="font-semibold text-gray-900">
                    {filteredOrders.length}
                  </span>{" "}
                  đơn hàng
                  {selectedStatus !== "all" && (
                    <span className="ml-1">
                      -{" "}
                      {
                        statusTabs.find((t) => t.value === selectedStatus)
                          ?.label
                      }
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {orders?.data?.orders?.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Chưa có đơn hàng nào
              </h3>
              <p className="text-gray-600 mb-8 text-lg">
                Bắt đầu mua sắm để xem đơn hàng của bạn ở đây
              </p>
              <Link
                to="/products"
                className="btn-primary inline-flex items-center px-8 py-3 text-base font-medium"
              >
                <Package className="w-5 h-5 mr-2" />
                Xem Sản Phẩm
              </Link>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Không tìm thấy đơn hàng
              </h3>
              <p className="text-gray-600">
                Không có đơn hàng nào với trạng thái này
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-primary-200"
              >
                {/* Order Header */}
                <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            order.status
                          )} shadow-sm`}
                        >
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Mã đơn:</span>
                        <span className="text-sm font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                          #{order._id.slice(-8).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>

                {/* Order Body */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Delivery Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-3">
                        <Truck className="w-5 h-5 text-primary-600" />
                        <h4 className="font-semibold text-gray-900">
                          Thông tin giao hàng
                        </h4>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Tên người nhận:
                          </p>
                          <p className="font-semibold text-gray-900">
                            {order.receiver}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Số điện thoại:
                          </p>
                          <p className="text-sm text-gray-700">{order.phone}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Địa chỉ:</p>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {order.address}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Products */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-3">
                        <Package className="w-5 h-5 text-primary-600" />
                        <h4 className="font-semibold text-gray-900">
                          Sản phẩm
                        </h4>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        {order.cart?.slice(0, 3).map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-gray-700 flex-1 truncate">
                              {item.product?.title}
                            </span>
                            <span className="text-gray-500 ml-2">
                              x{item.quantity}
                            </span>
                          </div>
                        ))}
                        {order.cart?.length > 3 && (
                          <p className="text-xs text-primary-600 font-medium pt-1">
                            +{order.cart.length - 3} sản phẩm khác
                          </p>
                        )}
                        <div className="pt-2 mt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            Tổng: {order.cart?.length || 0} sản phẩm
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Payment */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-3">
                        <CreditCard className="w-5 h-5 text-primary-600" />
                        <h4 className="font-semibold text-gray-900">
                          Thanh toán
                        </h4>
                      </div>
                      <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">
                            Phương thức:
                          </span>
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {order.payments}
                          </span>
                        </div>
                        <div className="pt-3 border-t border-primary-200">
                          <p className="text-xs text-gray-600 mb-1">
                            Tổng thanh toán
                          </p>
                          <p className="text-2xl font-bold text-primary-600">
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(order.totalPrice)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-sm text-gray-600"></div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/orders/${order._id}`}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors duration-200"
                    >
                      Xem chi tiết
                    </Link>
                    {order.status === "Processed" && (
                      <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200">
                        Hủy đơn hàng
                      </button>
                    )}
                    {order.status === "Success" && (
                      <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors duration-200 shadow-sm">
                        Đặt lại
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
