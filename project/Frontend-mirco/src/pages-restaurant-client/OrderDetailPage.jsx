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
  Edit2,
  Save,
  Truck,
  CreditCard,
} from "lucide-react";
import toast from "react-hot-toast";
import { orderApi } from "../api/orderApi";
import { useState } from "react";

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedStatus, setEditedStatus] = useState("");

  // Fetch order from API - use restaurant-specific API if available
  const {
    data: order,
    isLoading,
    error,
  } = useQuery(
    ["restaurantOrder", orderId],
    async () => {
      console.log("[OrderDetailPage] Fetching order:", orderId);
      const response = await orderApi.getOrderForRestaurant(orderId);
      console.log("[OrderDetailPage] Order response:", response);
      return response;
    },
    {
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        console.log("[OrderDetailPage] Order fetched successfully:", data);
        setEditedStatus(data?.data?.order?.status || "");
      },
      onError: (error) => {
        console.error("[OrderDetailPage] Error fetching order:", error);
        console.error("[OrderDetailPage] Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
      },
    }
  );

  // Update order status mutation - use restaurant-specific API if available
  const updateStatusMutation = useMutation(
    (newStatus) =>
      orderApi.updateOrderForRestaurant(orderId, { status: newStatus }),
    {
      onSuccess: () => {
        toast.success("Cập nhật trạng thái thành công!");
        queryClient.invalidateQueries(["restaurantOrder", orderId]);
        queryClient.invalidateQueries("restaurantOrders");
        setIsEditing(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Cập nhật thất bại!");
      },
    }
  );

  const handleSaveStatus = () => {
    if (editedStatus !== order?.data?.order?.status) {
      updateStatusMutation.mutate(editedStatus);
    } else {
      setIsEditing(false);
    }
  };

  const handleQuickStatusUpdate = (newStatus) => {
    updateStatusMutation.mutate(newStatus);
  };

  const getNextStatus = (currentStatus) => {
    const workflow = {
      Processed: "Waiting Goods",
      "Waiting Goods": "Delivery",
      Delivery: "Success",
    };
    return workflow[currentStatus];
  };

  const getNextStatusText = (currentStatus) => {
    const texts = {
      Processed: "Chuyển sang Chờ hàng",
      "Waiting Goods": "Bắt đầu giao hàng",
      Delivery: "Hoàn thành đơn",
    };
    return texts[currentStatus];
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error) {
    console.error("[OrderDetailPage] Error fetching order:", error);
    return (
      <div className="text-center py-12">
        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Không tìm thấy đơn hàng
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {error.response?.data?.message ||
            error.message ||
            "Đã xảy ra lỗi khi tải đơn hàng"}
        </p>
        <button
          onClick={() => navigate("/restaurant/dashboard/orders")}
          className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Quay lại
        </button>
      </div>
    );
  }

  if (!order || !order?.data?.order) {
    return (
      <div className="text-center py-12">
        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Không tìm thấy đơn hàng
        </h3>
        <button
          onClick={() => navigate("/restaurant/dashboard/orders")}
          className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const orderData = order.data.order;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/restaurant/dashboard/orders")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Đơn hàng #{orderData._id.slice(-8).toUpperCase()}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Tạo lúc: {new Date(orderData.createdAt).toLocaleString("vi-VN")}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card - Editable */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                {getStatusIcon(orderData.status)}
                Trạng thái đơn hàng
              </h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
                >
                  <Edit2 size={16} />
                  Chỉnh sửa
                </button>
              )}
            </div>
            <div className="p-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cập nhật trạng thái
                    </label>
                    <select
                      value={editedStatus}
                      onChange={(e) => setEditedStatus(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="Processed">Đã xử lý</option>
                      <option value="Waiting Goods">Chờ hàng</option>
                      <option value="Delivery">Đang giao</option>
                      <option value="Success">Thành công</option>
                      <option value="Cancelled">Đã hủy</option>
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveStatus}
                      disabled={updateStatusMutation.isLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                    >
                      <Save size={18} />
                      {updateStatusMutation.isLoading ? "Đang lưu..." : "Lưu"}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedStatus(orderData.status);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(orderData.status)}
                    <div>
                      <span
                        className={`inline-flex px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusBadge(
                          orderData.status
                        )} shadow-sm`}
                      >
                        {getStatusText(orderData.status)}
                      </span>
                      <p className="text-sm text-gray-500 mt-2">
                        Cập nhật:{" "}
                        {new Date(
                          orderData.updatedAt || orderData.createdAt
                        ).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  {orderData.status !== "Success" &&
                    orderData.status !== "Cancelled" && (
                      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
                        {/* Next Status Button */}
                        {getNextStatus(orderData.status) && (
                          <button
                            onClick={() =>
                              handleQuickStatusUpdate(
                                getNextStatus(orderData.status)
                              )
                            }
                            disabled={updateStatusMutation.isLoading}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50 shadow-sm"
                          >
                            {updateStatusMutation.isLoading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <>
                                <CheckCircle size={18} />
                                {getNextStatusText(orderData.status)}
                              </>
                            )}
                          </button>
                        )}

                        {/* Cancel Button */}
                        <button
                          onClick={() => handleQuickStatusUpdate("Cancelled")}
                          disabled={updateStatusMutation.isLoading}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50 shadow-sm"
                        >
                          <XCircle size={18} />
                          Hủy đơn
                        </button>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
          {/* Products */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                Sản phẩm đã đặt
                <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-sm font-semibold rounded-full">
                  {orderData.cart?.length || 0} món
                </span>
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {orderData.cart?.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200"
                  >
                    <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0 border border-gray-200">
                      {item.product?.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-gray-300" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 mb-1 truncate">
                        {item.product?.title}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <span className="font-medium">SL:</span>
                          <span className="px-2 py-0.5 bg-white rounded-md font-semibold border border-gray-300">
                            {item.quantity}
                          </span>
                        </span>
                        <span className="text-gray-400">×</span>
                        <span>
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(
                            item.product?.promotion || item.product?.price || 0
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold text-orange-600">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(
                          (item.product?.promotion ||
                            item.product?.price ||
                            0) * item.quantity
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-orange-600" />
                Thông tin giao hàng
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <User className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Người nhận</p>
                      <p className="font-semibold text-gray-900">
                        {orderData.receiver}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Phone className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">
                        Số điện thoại
                      </p>
                      <p className="font-semibold text-gray-900">
                        {orderData.phone}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <MapPin className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">
                        Địa chỉ giao hàng
                      </p>
                      <p className="font-semibold text-gray-900 leading-relaxed">
                        {orderData.address}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Summary */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-orange-200">
              <h3 className="text-lg font-bold text-gray-900">
                Chi tiết đơn hàng
              </h3>
            </div>

            <div className="p-6">
              {/* Order ID */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Mã đơn hàng</p>
                <p className="font-mono font-semibold text-gray-900">
                  {orderData._id}
                </p>
              </div>

              {/* Summary */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-700">
                  <span>Tạm tính:</span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(
                      orderData.totalPrice - (orderData.shippingFee || 0)
                    )}
                  </span>
                </div>
                {orderData.shippingFee > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Phí vận chuyển:</span>
                    <span className="font-semibold">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(orderData.shippingFee)}
                    </span>
                  </div>
                )}
                <div className="border-t-2 border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">
                      Tổng cộng:
                    </span>
                    <span className="text-2xl font-bold text-orange-600">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(orderData.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-6 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4 text-orange-600" />
                  <p className="text-xs font-semibold text-gray-600 uppercase">
                    Thanh toán
                  </p>
                </div>
                <p className="font-semibold text-gray-900 capitalize">
                  {orderData.payments === "tiền mặt"
                    ? "COD - Thanh toán khi nhận hàng"
                    : orderData.payments === "vnpay"
                    ? "VNPay"
                    : orderData.payments === "momo"
                    ? "MoMo"
                    : orderData.payments}
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => navigate("/restaurant/dashboard/orders")}
                  className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  ← Quay lại danh sách
                </button>
              </div>

              {/* Metadata */}
              <div className="mt-6 pt-6 border-t border-gray-200 text-xs text-gray-500 space-y-2">
                <div className="flex justify-between">
                  <span>Số món:</span>
                  <span className="font-medium">
                    {orderData.cart?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tạo lúc:</span>
                  <span className="font-medium">
                    {new Date(orderData.createdAt).toLocaleString("vi-VN")}
                  </span>
                </div>
                {orderData.updatedAt && (
                  <div className="flex justify-between">
                    <span>Cập nhật:</span>
                    <span className="font-medium">
                      {new Date(orderData.updatedAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
