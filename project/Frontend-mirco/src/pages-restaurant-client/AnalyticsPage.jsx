import { useState } from "react";
import { useQuery } from "react-query";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Calendar,
  Download,
  BarChart3,
  PieChart,
} from "lucide-react";
import { restaurantApi } from "../api/restaurantApi";

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState("week");

  // Fetch analytics data from API
  const { data: analyticsData, isLoading } = useQuery(
    ["restaurantAnalytics", timeRange],
    async () => {
      const response = await restaurantApi.getAnalytics(timeRange);
      // Response structure: { status: "success", data: { revenue, orders, ... } }
      return (
        response?.data ||
        response || {
          revenue: { current: 0, previous: 0, growth: 0 },
          orders: { current: 0, previous: 0, growth: 0 },
          customers: { current: 0, previous: 0, growth: 0 },
          avgOrderValue: { current: 0, previous: 0, growth: 0 },
          topProducts: [],
          revenueByDay: [],
          ordersByStatus: { completed: 0, cancelled: 0, refunded: 0 },
        }
      );
    },
    {
      refetchOnWindowFocus: false,
      enabled: !!localStorage.getItem("restaurant_token"),
    }
  );

  const analytics = analyticsData;

  const statCards = [
    {
      icon: DollarSign,
      label: "Doanh thu",
      value: new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(analytics?.revenue.current || 0),
      change: analytics?.revenue.growth || 0,
      color: "bg-green-100 text-green-600",
    },
    {
      icon: ShoppingBag,
      label: "Đơn hàng",
      value: analytics?.orders.current || 0,
      change: analytics?.orders.growth || 0,
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: Users,
      label: "Khách hàng",
      value: analytics?.customers.current || 0,
      change: analytics?.customers.growth || 0,
      color: "bg-purple-100 text-purple-600",
    },
    {
      icon: TrendingUp,
      label: "Giá trị TB/Đơn",
      value: new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(analytics?.avgOrderValue.current || 0),
      change: analytics?.avgOrderValue.growth || 0,
      color: "bg-orange-100 text-orange-600",
    },
  ];

  const timeRanges = [
    { value: "today", label: "Hôm nay" },
    { value: "week", label: "Tuần này" },
    { value: "month", label: "Tháng này" },
    { value: "year", label: "Năm này" },
  ];

  const handleExport = () => {
    // TODO: Implement export functionality
    alert("Xuất báo cáo (Chức năng đang phát triển)");
  };

  if (isLoading || !analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const maxRevenue =
    analytics?.revenueByDay?.length > 0
      ? Math.max(...analytics.revenueByDay.map((d) => d.revenue || 0))
      : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Thống kê & Phân tích
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Theo dõi hiệu suất kinh doanh của nhà hàng
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleExport}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Download className="h-5 w-5" />
            <span>Xuất báo cáo</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="h-6 w-6" />
              </div>
              <span
                className={`text-sm font-medium flex items-center ${
                  card.change >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {card.change >= 0 ? "↑" : "↓"}{" "}
                {Math.abs(card.change).toFixed(1)}%
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-orange-600" />
              Doanh thu theo ngày
            </h3>
          </div>
          <div className="space-y-3">
            {analytics?.revenueByDay.map((day, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    {day.day}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                      notation: "compact",
                    }).format(day.revenue)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${(day.revenue / maxRevenue) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-orange-600" />
              Món ăn bán chạy
            </h3>
          </div>
          <div className="space-y-4">
            {analytics?.topProducts.map((product, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-orange-600">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">
                      Đã bán: {product.sold}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-orange-600">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                      notation: "compact",
                    }).format(product.revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Orders by Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <PieChart className="h-5 w-5 mr-2 text-orange-600" />
          Phân tích đơn hàng
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-green-50 rounded-xl">
            <p className="text-3xl font-bold text-green-600 mb-2">
              {analytics?.ordersByStatus.completed}
            </p>
            <p className="text-sm text-gray-600">Hoàn thành</p>
            <p className="text-xs text-gray-500 mt-1">
              {(
                (analytics?.ordersByStatus.completed /
                  (analytics?.orders.current || 1)) *
                100
              ).toFixed(1)}
              %
            </p>
          </div>
          <div className="text-center p-6 bg-red-50 rounded-xl">
            <p className="text-3xl font-bold text-red-600 mb-2">
              {analytics?.ordersByStatus.cancelled}
            </p>
            <p className="text-sm text-gray-600">Đã hủy</p>
            <p className="text-xs text-gray-500 mt-1">
              {(
                (analytics?.ordersByStatus.cancelled /
                  (analytics?.orders.current || 1)) *
                100
              ).toFixed(1)}
              %
            </p>
          </div>
          <div className="text-center p-6 bg-yellow-50 rounded-xl">
            <p className="text-3xl font-bold text-yellow-600 mb-2">
              {analytics?.ordersByStatus.refunded}
            </p>
            <p className="text-sm text-gray-600">Hoàn tiền</p>
            <p className="text-xs text-gray-500 mt-1">
              {(
                (analytics?.ordersByStatus.refunded /
                  (analytics?.orders.current || 1)) *
                100
              ).toFixed(1)}
              %
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
