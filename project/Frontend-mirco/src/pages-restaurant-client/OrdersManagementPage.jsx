import React, { useState, useEffect, useMemo } from "react";
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
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { orderApi } from "../api/orderApi";
import { restaurantClient } from "../api/axiosClients";
import { paymentApi2 } from "../api/paymentApi2";

const OrdersManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3; // Giảm từ 10 xuống 3 đơn mỗi trang
  const queryClient = useQueryClient();

  // Get restaurant ID from localStorage
  const restaurantData = JSON.parse(
    localStorage.getItem("restaurant_data") || "{}"
  );
  const restaurantId = restaurantData._id || restaurantData.id;

  // Helper functions cho cache với bảo mật
  const getCacheKey = (page, filter) => {
    return `restaurant_orders_cache_${restaurantId}_${page}_${filter}`;
  };

  const getTodayDate = () => {
    return new Date().toDateString(); // Format: "Mon Jan 01 2024"
  };

  // Xóa tất cả cache của restaurant này (dùng khi logout hoặc cần bảo mật)
  const clearAllCache = () => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(`restaurant_orders_cache_${restaurantId}_`)) {
          localStorage.removeItem(key);
        }
      });
      console.log("[OrdersManagementPage] 🗑️  All cache cleared for security");
    } catch (error) {
      console.error("[OrdersManagementPage] Error clearing cache:", error);
    }
  };

  const getCachedData = (page, filter) => {
    try {
      // Kiểm tra xem có token không (bảo mật: chỉ dùng cache khi đã đăng nhập)
      const token = localStorage.getItem("restaurant_token");
      if (!token) {
        clearAllCache(); // Xóa cache nếu không có token
        return null;
      }

      const cacheKey = getCacheKey(page, filter);
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const { data, date, timestamp } = JSON.parse(cached);

      // Kiểm tra: cùng ngày VÀ không quá 12 giờ (bảo mật: giảm thời gian cache)
      const now = Date.now();
      const cacheAge = now - timestamp;
      const maxCacheAge = 12 * 60 * 60 * 1000; // 12 giờ

      if (date === getTodayDate() && cacheAge < maxCacheAge) {
        console.log(
          `[OrdersManagementPage] ✅ Using cache for page ${page}, filter ${filter}`
        );
        return data;
      } else {
        // Cache hết hạn, xóa
        localStorage.removeItem(cacheKey);
        console.log(
          `[OrdersManagementPage] 🗑️  Cache expired, removed old cache`
        );
        return null;
      }
    } catch (error) {
      console.error("[OrdersManagementPage] Error reading cache:", error);
      return null;
    }
  };

  const saveToCache = (page, filter, data) => {
    try {
      // Bảo mật: Chỉ cache khi có token
      const token = localStorage.getItem("restaurant_token");
      if (!token) {
        console.warn("[OrdersManagementPage] ⚠️  No token, skipping cache");
        return;
      }

      // Bảo mật: Cache dữ liệu đầy đủ (restaurant cần xem để quản lý đơn hàng)
      // Lưu ý: Dữ liệu này chỉ hiển thị cho restaurant đã đăng nhập
      // Các biện pháp bảo mật:
      // 1. Chỉ cache khi có token
      // 2. Cache tự động hết hạn sau 12 giờ
      // 3. Cache bị xóa khi logout
      // 4. Cache bị xóa khi không có token
      const cacheKey = getCacheKey(page, filter);
      const cacheEntry = {
        data: data, // Giữ nguyên dữ liệu đầy đủ (restaurant cần xem)
        date: getTodayDate(),
        timestamp: Date.now(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
      console.log(
        `[OrdersManagementPage] 💾 Saved to cache: page ${page}, filter ${filter}`
      );
    } catch (error) {
      console.error("[OrdersManagementPage] Error saving cache:", error);
    }
  };

  // Fetch orders from Order Service API với pagination
  const {
    data: ordersResponse,
    isLoading,
    error,
    refetch,
    isRefetching,
    isFetching, // Thêm isFetching để detect khi đang fetch (bao gồm cả khi chuyển trang)
  } = useQuery(
    ["restaurantOrders", currentPage, statusFilter],
    async () => {
      if (!restaurantId) {
        console.error("[OrdersManagementPage] Restaurant ID not found");
        throw new Error("Restaurant ID not found");
      }

      // Kiểm tra cache trước
      const cachedData = getCachedData(currentPage, statusFilter);
      if (cachedData) {
        return cachedData;
      }

      console.log(
        "[OrdersManagementPage] Fetching orders from server:",
        restaurantId,
        "page:",
        currentPage
      );

      // Call Restaurant Service endpoint với pagination params
      const response = await restaurantClient.get("/restaurant/orders", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          // Có thể thêm status filter nếu backend hỗ trợ
          ...(statusFilter !== "all" && { status: statusFilter }),
        },
      });

      // Giảm log để tăng performance
      // console.log("[OrdersManagementPage] API Response:", {...});

      // orderApi returns response.data, which has shape:
      // { status, results, data: { orders }, pagination: { page, limit, total, totalPages } }
      const ordersList =
        response?.data?.data?.orders || response?.data?.orders || [];
      const pagination = response?.data?.pagination ||
        response?.data?.data?.pagination || {
          page: currentPage,
          limit: itemsPerPage,
          total: ordersList.length,
          totalPages: Math.ceil(ordersList.length / itemsPerPage),
        };

      // Giảm log để tăng performance
      // console.log("[OrdersManagementPage] Orders list:", {...});

      // Use Order Service format directly (no mapping)
      const mappedOrders = ordersList.map((order) => ({
        _id: order._id,
        customerName: order.receiver || "Không có tên",
        customerPhone: order.phone || "N/A",
        items: (order.cart || []).map((item) => ({
          productName: item.product?.title || item.product?.name || "Sản phẩm",
          quantity: item.quantity || 0,
          price: item.product?.price || 0,
        })),
        totalAmount: order.totalPrice || 0,
        status: order.status, // Use Order Service status directly
        payments: order.payments || "tiền mặt", // Phương thức thanh toán
        createdAt: order.createdAt,
        address: order.address || "N/A",
      }));

      const result = {
        orders: mappedOrders,
        pagination,
      };

      // Lưu vào cache sau khi fetch thành công
      saveToCache(currentPage, statusFilter, result);

      return result;
    },
    {
      refetchOnWindowFocus: false, // Học theo OrdersPage.jsx - tắt auto-refetch khi quay lại tab
      keepPreviousData: true, // Giữ data cũ khi đang load trang mới (giống OrdersPage.jsx)
      // KHÔNG có refetchInterval - chỉ fetch khi cần (giống OrdersPage.jsx)
      // KHÔNG có staleTime - dùng default (giống OrdersPage.jsx)
      // KHÔNG có retry - dùng default (giống OrdersPage.jsx)
      // enabled: vẫn cần check restaurantId và token
      enabled: !!restaurantId && !!localStorage.getItem("restaurant_token"),
    }
  );

  // Bảo mật: Xóa cache khi không có token hoặc khi logout
  useEffect(() => {
    // Kiểm tra token khi component mount
    const checkToken = () => {
      const token = localStorage.getItem("restaurant_token");
      if (!token) {
        clearAllCache();
      }
    };

    checkToken();

    // Listen for storage events (khi logout ở tab khác)
    const handleStorageChange = (e) => {
      if (e.key === "restaurant_token" && !e.newValue) {
        clearAllCache();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Cleanup
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [restaurantId]);

  const orders = ordersResponse?.orders || [];
  const pagination = ordersResponse?.pagination || {
    page: currentPage,
    limit: itemsPerPage,
    total: 0,
    totalPages: 0,
  };

  const updateOrderStatusMutation = useMutation(
    async ({ orderId, status }) => {
      // Use restaurant-specific API for updating order status
      return orderApi.updateOrderForRestaurant(orderId, { status });
    },
    {
      onSuccess: () => {
        toast.success("Cập nhật trạng thái thành công!");
        
        // Clear cache for all restaurant orders pages
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (key.startsWith(`restaurant_orders_cache_${restaurantId}_`)) {
            localStorage.removeItem(key);
          }
        });
        
        // Invalidate all restaurantOrders queries (not just current page)
        queryClient.invalidateQueries("restaurantOrders");
        
        // Also invalidate specific queries
        queryClient.invalidateQueries([
          "restaurantOrders",
          currentPage,
          statusFilter,
        ]);
        
        // Invalidate transactions để cập nhật trạng thái thanh toán
        queryClient.invalidateQueries(["restaurantTransactions"]);
        
        // Force refetch current page
        queryClient.refetchQueries([
          "restaurantOrders",
          currentPage,
          statusFilter,
        ]);
      },
      onError: (error) => {
        console.error("[OrdersManagementPage] Update status error:", error);
        toast.error(
          error.response?.data?.message || "Cập nhật thất bại!"
        );
      },
    }
  );

  // Lấy transactions cho các đơn VNPay để kiểm tra trạng thái thanh toán
  const vnpayOrderIds = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    return orders
      .filter(
        (order) =>
          order.payments === "vnpay" &&
          order.status !== "Success" &&
          order.status !== "Cancelled"
      )
      .map((order) => order._id);
  }, [orders]);

  const { data: transactionsData, isLoading: isLoadingTransactions } = useQuery(
    ["restaurantTransactions", vnpayOrderIds],
    () => {
      console.log(
        "[OrdersManagementPage] Fetching transactions for orderIds:",
        vnpayOrderIds
      );
      return paymentApi2.getTransactionsByOrderIds(vnpayOrderIds);
    },
    {
      enabled: vnpayOrderIds.length > 0,
      refetchOnWindowFocus: false,
      // Cache transactions trong 30 giây
      staleTime: 30000,
      // Xử lý lỗi để không làm crash trang
      onError: (error) => {
        console.error(
          "[OrdersManagementPage] Error loading transactions:",
          error
        );
        // Không hiển thị toast để tránh spam
      },
      onSuccess: (data) => {
        console.log("[OrdersManagementPage] Transactions loaded:", {
          hasData: !!data,
          dataStructure: data,
          transactionsCount: data?.data?.transactions?.length || 0,
        });
      },
      // Retry 1 lần nếu fail
      retry: 1,
    }
  );

  // Tạo map để lookup transaction status theo orderId
  const transactionStatusMap = useMemo(() => {
    try {
      if (!transactionsData?.data?.transactions) {
        console.log("[OrdersManagementPage] No transactions data:", {
          hasData: !!transactionsData,
          dataStructure: transactionsData,
        });
        return {};
      }
      const map = {};
      const transactions = Array.isArray(transactionsData.data.transactions)
        ? transactionsData.data.transactions
        : [];

      console.log(
        `[OrdersManagementPage] Processing ${transactions.length} transactions`
      );

      transactions.forEach((transaction, index) => {
        if (transaction && transaction.order) {
          try {
            const orderId =
              typeof transaction.order === "string"
                ? transaction.order
                : transaction.order._id || transaction.order;
            if (orderId) {
              map[orderId] = {
                status: transaction.status || "pending", // "pending", "completed", "failed"
                paymentUrl: transaction.paymentUrl,
              };
              console.log(
                `[OrdersManagementPage] Mapped transaction ${
                  index + 1
                }: orderId=${orderId}, status=${transaction.status}`
              );
            } else {
              console.warn(
                `[OrdersManagementPage] Transaction ${
                  index + 1
                } has no valid orderId:`,
                transaction
              );
            }
          } catch (err) {
            console.warn(
              "[OrdersManagementPage] Error processing transaction:",
              err,
              transaction
            );
          }
        } else {
          console.warn(
            `[OrdersManagementPage] Transaction ${
              index + 1
            } missing order field:`,
            transaction
          );
        }
      });
      console.log(
        "[OrdersManagementPage] Transaction map created with keys:",
        Object.keys(map)
      );
      return map;
    } catch (error) {
      console.error(
        "[OrdersManagementPage] Error creating transaction map:",
        error
      );
      return {};
    }
  }, [transactionsData]);

  // Client-side filtering chỉ cho search (vì status đã filter ở server)
  const filteredOrders = orders?.filter((order) => {
    const matchesSearch =
      order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone?.includes(searchTerm);

    return matchesSearch;
  });

  // Không cần slice nữa vì đã paginate ở server
  const paginatedOrders = filteredOrders;

  // Sử dụng pagination từ server
  const totalPages = pagination.totalPages || 1;
  const totalOrders = pagination.total || 0;

  const getStatusBadge = (status) => {
    const badges = {
      Processed: {
        label: "Đã xử lý",
        color: "bg-blue-100 text-blue-800",
        icon: Clock,
      },
      "Waiting Goods": {
        label: "Chờ hàng",
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
      },
      Delivery: {
        label: "Đang giao",
        color: "bg-purple-100 text-purple-800",
        icon: Clock,
      },
      Success: {
        label: "Thành công",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
      },
      Cancelled: {
        label: "Đã hủy",
        color: "bg-red-100 text-red-800",
        icon: XCircle,
      },
    };
    return badges[status] || badges.Processed;
  };

  const getPaymentMethodBadge = (payments) => {
    const methods = {
      "tiền mặt": {
        label: "COD",
        description: "Thanh toán khi nhận hàng",
        color: "bg-green-100 text-green-800",
      },
      vnpay: {
        label: "VNPay",
        description: "Đã thanh toán online",
        color: "bg-blue-100 text-blue-800",
      },
      momo: {
        label: "MoMo",
        description: "Đã thanh toán online",
        color: "bg-pink-100 text-pink-800",
      },
      paypal: {
        label: "PayPal",
        description: "Đã thanh toán online",
        color: "bg-indigo-100 text-indigo-800",
      },
      "số dư": {
        label: "Số dư",
        description: "Thanh toán bằng số dư",
        color: "bg-purple-100 text-purple-800",
      },
    };
    return (
      methods[payments] || {
        label: payments || "N/A",
        description: "",
        color: "bg-gray-100 text-gray-800",
      }
    );
  };

  const handleAcceptOrder = (orderId) => {
    updateOrderStatusMutation.mutate({ orderId, status: "Waiting Goods" });
  };

  const handleCancelOrder = (orderId) => {
    if (confirm("Bạn có chắc muốn hủy đơn hàng này?")) {
      updateOrderStatusMutation.mutate({ orderId, status: "Cancelled" });
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

  // Hiển thị loading overlay khi đang fetch data mới (chuyển trang)
  // Chỉ hiển thị khi đã có data trước đó (ordersResponse) và đang fetch data mới
  const isFetchingNewData = isFetching && ordersResponse;

  if (isLoading && !ordersResponse) {
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
    <div className="space-y-6 relative">
      {/* Loading Overlay - Hiển thị khi đang fetch data mới (chuyển trang) */}
      {isFetchingNewData && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center gap-4 min-w-[200px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            <p className="text-gray-700 font-medium">Đang tải đơn hàng...</p>
            <p className="text-sm text-gray-500">Vui lòng đợi trong giây lát</p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h2>
          <p className="text-sm text-gray-600 mt-1">
            Hiển thị {filteredOrders?.length || 0} / {totalOrders} đơn hàng
            {isRefetching && (
              <span className="ml-2 text-orange-600 text-xs">
                (Đang cập nhật...)
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => {
            // Xóa cache trước khi refetch để force load từ server
            const cacheKey = getCacheKey(currentPage, statusFilter);
            localStorage.removeItem(cacheKey);
            console.log(
              "[OrdersManagementPage] 🗑️  Cache cleared, fetching from server"
            );
            refetch();
          }}
          disabled={isRefetching || isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          title="Làm mới danh sách đơn hàng (bỏ qua cache)"
        >
          <RefreshCw
            className={`w-4 h-4 ${
              isRefetching || isLoading ? "animate-spin" : ""
            }`}
          />
          <span>Làm mới</span>
        </button>
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
              setCurrentPage(1); // Reset về trang 1 khi đổi filter
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="Processed">Đã xử lý</option>
            <option value="Waiting Goods">Chờ hàng</option>
            <option value="Delivery">Đang giao</option>
            <option value="Success">Thành công</option>
            <option value="Cancelled">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {paginatedOrders?.map((order) => {
          const statusBadge = getStatusBadge(order.status);
          const StatusIcon = statusBadge.icon;
          const paymentBadge = getPaymentMethodBadge(order.payments);

          // Debug: Log để kiểm tra transaction status
          if (order.payments === "vnpay") {
            console.log(`[OrdersManagementPage] Order ${order._id}:`, {
              payments: order.payments,
              hasTransaction: !!transactionStatusMap[order._id],
              transactionStatus: transactionStatusMap[order._id]?.status,
              allOrderIds: Object.keys(transactionStatusMap),
            });
          }

          return (
            <div
              key={order._id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Order Info */}
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2 mb-3">
                    <span className="font-bold text-lg text-gray-900">
                      {order._id}
                    </span>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${statusBadge.color} flex items-center space-x-1`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      <span>{statusBadge.label}</span>
                    </span>
                    {/* Hiển thị payment method - Với VNPay thì ghép với transaction status */}
                    {order.payments === "vnpay" &&
                    (transactionStatusMap[order._id] ||
                      transactionStatusMap[order._id?.toString()] ||
                      transactionStatusMap[String(order._id)]) ? (
                      (() => {
                        // Tìm transaction status - thử nhiều cách match orderId
                        const transaction =
                          transactionStatusMap[order._id] ||
                          transactionStatusMap[order._id?.toString()] ||
                          transactionStatusMap[String(order._id)] ||
                          Object.values(transactionStatusMap).find((t, idx) => {
                            const keys = Object.keys(transactionStatusMap);
                            return (
                              keys[idx]?.includes(order._id) ||
                              order._id?.includes(keys[idx])
                            );
                          });

                        if (!transaction) {
                          console.warn(
                            `[OrdersManagementPage] No transaction found for order ${order._id}`,
                            {
                              orderId: order._id,
                              orderIdType: typeof order._id,
                              mapKeys: Object.keys(transactionStatusMap),
                            }
                          );
                          return null;
                        }

                        return (
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              transaction.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : transaction.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                            title={
                              transaction.status === "completed"
                                ? "VNPay - Đã thanh toán xong"
                                : transaction.status === "pending"
                                ? "VNPay - Chưa thanh toán"
                                : "VNPay - Thanh toán thất bại"
                            }
                          >
                            💳{" "}
                            {transaction.status === "completed"
                              ? "vnpay - Đã thanh toán"
                              : transaction.status === "pending"
                              ? "vnpay - Chưa thanh toán"
                              : "vnpay - Thanh toán thất bại"}
                          </span>
                        );
                      })()
                    ) : (
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${paymentBadge.color}`}
                        title={paymentBadge.description}
                      >
                        💳 {paymentBadge.label}
                      </span>
                    )}
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
                    {order.status === "Processed" && (
                      <>
                        <button
                          onClick={() => handleAcceptOrder(order._id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                        >
                          Xác nhận đơn (Chờ hàng)
                        </button>
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                        >
                          Hủy đơn
                        </button>
                      </>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Hiển thị{" "}
              <span className="font-semibold text-gray-900">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              -{" "}
              <span className="font-semibold text-gray-900">
                {Math.min(currentPage * itemsPerPage, totalOrders)}
              </span>{" "}
              trong tổng số{" "}
              <span className="font-semibold text-gray-900">{totalOrders}</span>{" "}
              đơn hàng
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || isLoading}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                ← Trước
              </button>
              <div className="flex items-center space-x-1">
                {/* Hiển thị số trang với logic đơn giản hơn */}
                {(() => {
                  const pages = [];
                  const maxVisible = 5;

                  if (totalPages <= maxVisible) {
                    // Hiển thị tất cả các trang nếu <= 5 trang
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(i);
                    }
                  } else {
                    // Logic cho nhiều trang
                    if (currentPage <= 3) {
                      // Hiển thị: 1, 2, 3, 4, 5, ..., totalPages
                      for (let i = 1; i <= 5; i++) {
                        pages.push(i);
                      }
                      pages.push("ellipsis");
                      pages.push(totalPages);
                    } else if (currentPage >= totalPages - 2) {
                      // Hiển thị: 1, ..., totalPages-4, totalPages-3, totalPages-2, totalPages-1, totalPages
                      pages.push(1);
                      pages.push("ellipsis");
                      for (let i = totalPages - 4; i <= totalPages; i++) {
                        pages.push(i);
                      }
                    } else {
                      // Hiển thị: 1, ..., currentPage-1, currentPage, currentPage+1, ..., totalPages
                      pages.push(1);
                      pages.push("ellipsis");
                      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                        pages.push(i);
                      }
                      pages.push("ellipsis");
                      pages.push(totalPages);
                    }
                  }

                  return pages.map((page, index) => {
                    if (page === "ellipsis") {
                      return (
                        <span
                          key={`ellipsis-${index}`}
                          className="px-2 text-gray-400"
                        >
                          ...
                        </span>
                      );
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        disabled={isLoading}
                        className={`px-3 py-2 rounded-lg transition-colors font-medium text-sm ${
                          currentPage === page
                            ? "bg-orange-600 text-white border border-orange-600"
                            : "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {page}
                      </button>
                    );
                  });
                })()}
              </div>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages || isLoading}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                Sau →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagementPage;
