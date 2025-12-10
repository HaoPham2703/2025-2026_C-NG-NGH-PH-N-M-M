import React, { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { orderApi } from "../api/orderApi";
import { paymentApi2 } from "../api/paymentApi2";
import { useAuth } from "../hooks/useAuth";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  MapPin,
  Phone,
  User,
  CreditCard,
} from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";
import ProductReviewSection from "./components/ProductReviewSection";

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const socketRef = useRef(null);

  const {
    data: order,
    isLoading,
    error,
  } = useQuery(["order", id], () => orderApi.getOrder(id), {
    refetchOnWindowFocus: false,
  });

  // Lấy transaction để lấy paymentUrl - luôn query khi có orderId
  const {
    data: transactionData,
    isLoading: isLoadingTransaction,
    error: transactionError,
  } = useQuery(
    ["transaction", id],
    () => paymentApi2.getTransactionByOrderId(id),
    {
      refetchOnWindowFocus: false,
      enabled: !!id, // Luôn query khi có orderId
    }
  );

  // Mutation để hủy đơn hàng
  const cancelOrderMutation = useMutation(
    ({ orderId, status }) => orderApi.updateOrder(orderId, { status }),
    {
      onSuccess: (data, variables) => {
        toast.success(
          "Đã hủy đơn hàng thành công. Nếu đã thanh toán, tiền sẽ được hoàn lại trong vòng 3-5 ngày làm việc."
        );
        // Refetch orders để cập nhật danh sách
        queryClient.invalidateQueries("orders");
        queryClient.invalidateQueries(["order", id]);
        // Navigate về trang đơn hàng sau 2 giây
        setTimeout(() => {
          navigate("/orders");
        }, 2000);
      },
      onError: (error) => {
        toast.error(
          error?.response?.data?.message || "Có lỗi xảy ra khi hủy đơn hàng"
        );
      },
    }
  );

  const handleCancelOrder = (orderId) => {
    if (
      window.confirm(
        "Bạn có chắc chắn muốn hủy đơn hàng này? Nếu đã thanh toán, tiền sẽ được hoàn lại. Hành động này không thể hoàn tác."
      )
    ) {
      cancelOrderMutation.mutate({ orderId, status: "Cancelled" });
    }
  };

  // Debug logging - chỉ log khi có data
  React.useEffect(() => {
    try {
      if (order?.data?.order) {
        console.log("[OrderDetailPage] Order data:", {
          orderId: order.data.order._id,
          payments: order.data.order.payments,
          status: order.data.order.status,
        });
      }
      if (transactionData) {
        console.log(
          "[OrderDetailPage] Transaction data (full):",
          JSON.stringify(transactionData, null, 2)
        );
        const transaction =
          transactionData?.data?.transaction || transactionData?.transaction;
        console.log("[OrderDetailPage] Transaction details:", {
          hasData: !!transactionData?.data,
          hasTransaction: !!transaction,
          transaction: transaction,
          status: transaction?.status,
          hasPaymentUrl: !!transaction?.paymentUrl,
          paymentUrl: transaction?.paymentUrl,
        });
      }
      if (transactionError) {
        console.error("[OrderDetailPage] Transaction error:", transactionError);
      }
    } catch (err) {
      console.error("[OrderDetailPage] Error in useEffect:", err);
    }
  }, [order, transactionData, transactionError]);

  // WebSocket connection for drone notifications
  useEffect(() => {
    if (!id || !user) return;

    // Load Socket.IO if available
    const loadSocketIO = () => {
      return new Promise((resolve) => {
        if (window.io) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = "https://cdn.socket.io/4.6.1/socket.io.min.js";
        script.onload = resolve;
        script.onerror = resolve; // Continue even if Socket.IO fails
        document.head.appendChild(script);
      });
    };

    loadSocketIO().then(() => {
      if (window.io) {
        const socket = window.io("http://localhost:4007", {
          transports: ["websocket", "polling"],
        });

        socket.on("connect", () => {
          console.log("[OrderDetailPage] Socket.IO connected");
          // Join order room
          socket.emit("join:order", id);
          // Join user room for notifications
          const userId = user._id || user.id;
          if (userId) {
            socket.emit("join:user", userId);
            console.log("[OrderDetailPage] Joined user room:", userId);
          }
        });

        // Listen for drone milestone notifications (1/3 journey)
        socket.on("drone:milestone", (data) => {
          if (data.orderId === id) {
            console.log(
              "[OrderDetailPage] Received drone milestone notification:",
              data
            );

            // Hiển thị thông báo
            const toastStyle = {
              background: data.type === "fromRestaurant" ? "#f59e0b" : "#3b82f6",
              color: "white",
              fontSize: "16px",
              padding: "16px",
            };

            toast.success(data.message || "🚁 Cập nhật drone", {
              duration: data.type === "fromRestaurant" ? 10000 : 8000,
              icon: data.type === "fromRestaurant" ? "⚡" : "🚁",
              style: toastStyle,
            });
          }
        });

        // Listen for drone arriving notification (1km away)
        socket.on("drone:arriving", (data) => {
          if (data.orderId === id) {
            console.log(
              "[OrderDetailPage] Received drone arriving notification:",
              data
            );

            // Hiển thị thông báo cho user
            const notificationMessage =
              data.message ||
              `Drone đang đến gần bạn! Còn khoảng ${
                data.distance || "1"
              }km. Vui lòng chuẩn bị nhận hàng.`;
            toast.success(`🚁 ${notificationMessage}`, {
              duration: 8000, // Hiển thị 8 giây
              icon: "🚁",
              style: {
                background: "#10b981",
                color: "white",
                fontSize: "16px",
                padding: "16px",
              },
            });
          }
        });

        socket.on("connect_error", (error) => {
          console.error("[OrderDetailPage] Socket.IO connection error:", error);
        });

        socketRef.current = socket;

        return () => {
          if (socketRef.current) {
            socketRef.current.emit("leave:order", id);
            const userId = user._id || user.id;
            if (userId) {
              socketRef.current.emit("leave:user", userId);
            }
            socketRef.current.disconnect();
          }
        };
      }
    });
  }, [id, user]);

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

  if (error || !order?.data?.order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Đơn hàng không tồn tại
          </h2>
          <p className="text-gray-600">Vui lòng thử lại sau</p>
        </div>
      </div>
    );
  }

  const orderData = order.data.order;

  const breadcrumbItems = [
    { label: "Trang Chủ", path: "/" },
    { label: "Đơn Hàng", path: "/orders" },
    {
      label: `Đơn hàng #${orderData._id.slice(-8).toUpperCase()}`,
      path: `/orders/${id}`,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Breadcrumb items={breadcrumbItems} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    Đơn hàng #{orderData._id.slice(-8).toUpperCase()}
                  </h1>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(orderData.status)}
                    <span
                      className={`px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(
                        orderData.status
                      )} shadow-sm`}
                    >
                      {getStatusText(orderData.status)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    Đặt hàng lúc{" "}
                    {new Date(orderData.createdAt).toLocaleString("vi-VN")}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Tổng tiền</p>
                <p className="text-3xl font-bold text-primary-600">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(orderData.totalPrice)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Products */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary-600" />
                  Sản phẩm đã đặt
                  <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 text-sm font-semibold rounded-full">
                    {orderData.cart?.length || 0} món
                  </span>
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {orderData.cart?.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200 border border-gray-200"
                    >
                      <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0 border border-gray-200">
                        {item.product?.images?.[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center">
                            <Package className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                            <span className="text-xs text-gray-400">
                              No Image
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1 truncate">
                          {item.product?.title}
                        </h3>
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
                              item.product?.promotion ||
                                item.product?.price ||
                                0
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-bold text-primary-600">
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
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary-600" />
                  Thông tin giao hàng
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <User className="w-5 h-5 text-primary-600" />
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
                        <Phone className="w-5 h-5 text-primary-600" />
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
                        <MapPin className="w-5 h-5 text-primary-600" />
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

            {/* Product Review Section - Chỉ hiển thị khi order đã thành công */}
            {orderData.status === "Success" && (
              <ProductReviewSection
                orderId={orderData._id}
                products={orderData.cart || []}
              />
            )}
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden sticky top-8">
              <div className="bg-gradient-to-r from-primary-50 to-primary-100 px-6 py-4 border-b border-primary-200">
                <h2 className="text-xl font-bold text-gray-900">
                  Thông tin đơn hàng
                </h2>
              </div>

              <div className="p-6">
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-700">
                    <span>Tạm tính:</span>
                    <span className="font-semibold">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(orderData.totalPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Phí vận chuyển:</span>
                    <span className="text-green-600 font-semibold">
                      Miễn phí
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Giảm giá:</span>
                    <span className="text-red-600 font-semibold">-0đ</span>
                  </div>
                  <div className="border-t-2 border-gray-200 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">
                        Tổng cộng:
                      </span>
                      <span className="text-2xl font-bold text-primary-600">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(orderData.totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-4 h-4 text-primary-600" />
                      <p className="text-xs font-semibold text-gray-600 uppercase">
                        Thanh toán
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      {orderData.payments === "tiền mặt"
                        ? "Thanh toán khi nhận hàng (COD)"
                        : orderData.payments === "vnpay"
                        ? "VNPay"
                        : orderData.payments === "momo"
                        ? "MoMo"
                        : orderData.payments}
                    </p>
                  </div>

                  {/* Nút "Chờ thanh toán" - Hiển thị khi có transaction với status "pending" */}
                  {(() => {
                    const transaction =
                      transactionData?.data?.transaction ||
                      transactionData?.transaction;
                    const hasPendingTransaction =
                      transaction &&
                      transaction.status === "pending" &&
                      transaction.paymentUrl;

                    if (
                      orderData.payments === "vnpay" &&
                      !isLoadingTransaction &&
                      hasPendingTransaction &&
                      orderData.status !== "Success" &&
                      orderData.status !== "Cancelled"
                    ) {
                      return (
                        <a
                          href={transaction.paymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md flex items-center justify-center gap-2 mb-3"
                        >
                          <CreditCard className="w-5 h-5" />
                          Chờ thanh toán
                        </a>
                      );
                    }
                    return null;
                  })()}

                  {/* Thông báo khi đang tải */}
                  {orderData.payments === "vnpay" && isLoadingTransaction && (
                    <div className="block w-full py-3 px-4 bg-gray-100 text-gray-600 rounded-lg text-sm mb-3 text-center">
                      Đang tải thông tin thanh toán...
                    </div>
                  )}

                  {/* Thông báo khi chưa có transaction hoặc chưa có paymentUrl */}
                  {(() => {
                    const transaction =
                      transactionData?.data?.transaction ||
                      transactionData?.transaction;
                    const hasNoPaymentUrl =
                      orderData.payments === "vnpay" &&
                      !isLoadingTransaction &&
                      (!transaction || !transaction.paymentUrl) &&
                      orderData.status !== "Success" &&
                      orderData.status !== "Cancelled";

                    if (hasNoPaymentUrl) {
                      return (
                        <div className="block w-full py-3 px-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg text-sm mb-3">
                          ⚠️ Chưa có link thanh toán. Vui lòng thử lại sau.
                          <br />
                          <span className="text-xs mt-1 block">
                            Debug: transaction ={" "}
                            {transaction ? "exists" : "null"}, paymentUrl ={" "}
                            {transaction?.paymentUrl ? "exists" : "missing"}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Thông báo đã thanh toán */}
                  {orderData.payments === "vnpay" &&
                    !isLoadingTransaction &&
                    transactionData?.data?.transaction?.status ===
                      "completed" && (
                      <div className="block w-full py-3 px-4 bg-green-50 border border-green-200 text-green-700 font-medium rounded-lg flex items-center justify-center gap-2 mb-3">
                        <CheckCircle className="w-5 h-5" />
                        Đã thanh toán
                      </div>
                    )}

                  {(orderData.status === "Delivery" ||
                    orderData.status === "Waiting Goods") && (
                    <Link
                      to={`/drone-tracking/${orderData._id}`}
                      className="block w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md flex items-center justify-center gap-2"
                    >
                      <Truck className="w-5 h-5" />
                      Theo dõi Drone
                    </Link>
                  )}

                  {orderData.status === "Processed" && (
                    <button
                      onClick={() => handleCancelOrder(orderData._id)}
                      disabled={cancelOrderMutation.isLoading}
                      className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cancelOrderMutation.isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5" />
                          Hủy đơn hàng
                        </>
                      )}
                    </button>
                  )}

                  {orderData.status === "Success" && (
                    <button className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md flex items-center justify-center gap-2">
                      <Package className="w-5 h-5" />
                      Đặt lại
                    </button>
                  )}

                  <Link
                    to="/orders"
                    className="block w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200 text-center"
                  >
                    Quay lại đơn hàng
                  </Link>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Phone className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">
                      Hỗ trợ khách hàng
                    </h3>
                  </div>
                  <div className="text-sm text-blue-800 space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span className="font-medium">1900 1234</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Hoạt động 24/7</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
