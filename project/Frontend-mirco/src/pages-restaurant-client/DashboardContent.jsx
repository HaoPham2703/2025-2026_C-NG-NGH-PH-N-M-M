import { useQuery } from "react-query";
import { restaurantClient } from "../api/axiosClients";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  UtensilsCrossed,
  Clock,
  CheckCircle,
  XCircle,
  Package,
} from "lucide-react";

const DashboardContent = () => {
  // Fetch real stats from Restaurant Service API
  const {
    data: statsData,
    isLoading,
    error: statsError,
  } = useQuery(
    "restaurantStats",
    async () => {
      const response = await restaurantClient.get("/restaurant/stats");
      // restaurantClient returns response.data, which has shape:
      // { status, data: { stats } }
      return (
        response?.data?.stats || {
          totalRevenue: 0,
          totalOrders: 0,
          pendingOrders: 0,
          completedOrders: 0,
          totalProducts: 0,
          activeProducts: 0,
          revenueGrowth: 0,
          ordersGrowth: 0,
        }
      );
    },
    {
      retry: 1,
      refetchOnWindowFocus: false,
      enabled: !!localStorage.getItem("restaurant_token"),
    }
  );

  const stats = statsData || {
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalProducts: 0,
    activeProducts: 0,
    revenueGrowth: 0,
    ordersGrowth: 0,
  };

  const { data: recentOrders, error: ordersError } = useQuery(
    "recentOrders",
    async () => {
      // Placeholder data
      return [
        {
          id: "ORD-001",
          customerName: "Nguyễn Văn A",
          items: 3,
          total: 250000,
          status: "pending",
          time: "5 phút trước",
        },
        {
          id: "ORD-002",
          customerName: "Trần Thị B",
          items: 2,
          total: 180000,
          status: "preparing",
          time: "15 phút trước",
        },
        {
          id: "ORD-003",
          customerName: "Lê Văn C",
          items: 4,
          total: 320000,
          status: "completed",
          time: "30 phút trước",
        },
      ];
    },
    {
      retry: 1,
      refetchOnWindowFocus: false,
    }
  );

  const statCards = [
    {
      icon: DollarSign,
      label: "Doanh thu",
      value: new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(stats?.totalRevenue || 0),
      change: `+${stats?.revenueGrowth || 0}%`,
      changeType: "positive",
      color: "bg-green-100 text-green-600",
    },
    {
      icon: ShoppingBag,
      label: "Tổng đơn hàng",
      value: stats?.totalOrders || 0,
      change: `+${stats?.ordersGrowth || 0}%`,
      changeType: "positive",
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: Clock,
      label: "Đơn chờ xử lý",
      value: stats?.pendingOrders || 0,
      change: "Cần xử lý",
      changeType: "warning",
      color: "bg-orange-100 text-orange-600",
    },
    {
      icon: UtensilsCrossed,
      label: "Món ăn",
      value: `${stats?.activeProducts || 0}/${stats?.totalProducts || 0}`,
      change: "Đang bán",
      changeType: "neutral",
      color: "bg-purple-100 text-purple-600",
    },
  ];

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        label: "Chờ xác nhận",
        color: "bg-yellow-100 text-yellow-800",
      },
      preparing: { label: "Đang chuẩn bị", color: "bg-blue-100 text-blue-800" },
      completed: { label: "Hoàn thành", color: "bg-green-100 text-green-800" },
      cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800" },
    };
    return badges[status] || badges.pending;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (statsError || ordersError) {
    console.error("Dashboard error:", statsError || ordersError);
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 mb-2">Lỗi tải dữ liệu</p>
          <p className="text-sm text-gray-600">
            {statsError?.message || ordersError?.message || "Vui lòng thử lại"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan</h1>
        <p className="text-gray-600 mt-1">
          Chào mừng trở lại! Đây là tổng quan hoạt động của nhà hàng.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="h-6 w-6" />
              </div>
              <span
                className={`text-sm font-medium ${
                  card.changeType === "positive"
                    ? "text-green-600"
                    : card.changeType === "warning"
                    ? "text-orange-600"
                    : "text-gray-600"
                }`}
              >
                {card.change}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Đơn hàng gần đây
            </h2>
            <a
              href="/restaurant/dashboard/orders"
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              Xem tất cả →
            </a>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {recentOrders?.map((order) => {
            const statusBadge = getStatusBadge(order.status);
            return (
              <div
                key={order.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="font-semibold text-gray-900">
                        {order.id}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${statusBadge.color}`}
                      >
                        {statusBadge.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {order.customerName} • {order.items} món
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{order.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(order.total)}
                    </p>
                    {order.status === "pending" && (
                      <button className="mt-2 text-sm text-orange-600 hover:text-orange-700 font-medium">
                        Xác nhận →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {recentOrders?.length === 0 && (
          <div className="p-12 text-center">
            <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Chưa có đơn hàng nào</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a
          href="/restaurant/dashboard/products"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-orange-100 p-4 rounded-lg group-hover:bg-orange-200 transition-colors">
              <UtensilsCrossed className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Thêm món mới</h3>
              <p className="text-sm text-gray-600">Cập nhật thực đơn của bạn</p>
            </div>
          </div>
        </a>

        <a
          href="/restaurant/dashboard/orders"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-4 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Xem đơn hàng</h3>
              <p className="text-sm text-gray-600">Quản lý đơn hàng của bạn</p>
            </div>
          </div>
        </a>

        <a
          href="/restaurant/dashboard/analytics"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-purple-100 p-4 rounded-lg group-hover:bg-purple-200 transition-colors">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Thống kê</h3>
              <p className="text-sm text-gray-600">Xem báo cáo chi tiết</p>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
};

export default DashboardContent;
