import { useState } from "react";
import { useQuery } from "react-query";
import { orderApi, productApi } from "../api";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  Calendar,
} from "lucide-react";

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState("7days");

  // Fetch data
  const { data: orders } = useQuery("adminAllOrders", () =>
    orderApi.getOrders()
  );
  const { data: products } = useQuery("allProducts", () =>
    productApi.getProducts()
  );

  // Process data for analytics
  const processAnalytics = () => {
    if (!orders?.data?.orders) return null;

    const allOrders = orders.data.orders;
    const now = new Date();
    const filteredOrders = allOrders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      const daysDiff = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24));

      switch (timeRange) {
        case "7days":
          return daysDiff <= 7;
        case "30days":
          return daysDiff <= 30;
        case "90days":
          return daysDiff <= 90;
        default:
          return true;
      }
    });

    // Total revenue
    const totalRevenue = filteredOrders.reduce(
      (sum, order) => sum + (order.totalPrice || 0),
      0
    );

    // Previous period revenue for comparison
    const prevPeriodOrders = allOrders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      const daysDiff = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24));
      const period =
        timeRange === "7days" ? 7 : timeRange === "30days" ? 30 : 90;

      return daysDiff > period && daysDiff <= period * 2;
    });

    const prevRevenue = prevPeriodOrders.reduce(
      (sum, order) => sum + (order.totalPrice || 0),
      0
    );

    const revenueGrowth =
      prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    // Order status breakdown
    const statusBreakdown = filteredOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    // Revenue by day
    const revenueByDay = filteredOrders.reduce((acc, order) => {
      const date = new Date(order.createdAt).toLocaleDateString("vi-VN");
      if (!acc[date]) {
        acc[date] = { date, revenue: 0, orders: 0 };
      }
      acc[date].revenue += order.totalPrice || 0;
      acc[date].orders += 1;
      return acc;
    }, {});

    const revenueData = Object.values(revenueByDay).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // Top products
    const productSales = {};
    filteredOrders.forEach((order) => {
      order.cart?.forEach((item) => {
        const productId = item.product?._id || item.product;
        if (!productSales[productId]) {
          productSales[productId] = {
            name: item.product?.title || "Unknown",
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[productId].quantity += item.quantity || 0;
        productSales[productId].revenue +=
          (item.quantity || 0) *
          (item.product?.promotion || item.product?.price || 0);
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalRevenue,
      revenueGrowth,
      totalOrders: filteredOrders.length,
      ordersGrowth:
        prevPeriodOrders.length > 0
          ? ((filteredOrders.length - prevPeriodOrders.length) /
              prevPeriodOrders.length) *
            100
          : 0,
      statusBreakdown,
      revenueData,
      topProducts,
      avgOrderValue:
        filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0,
    };
  };

  const analytics = processAnalytics();

  const COLORS = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
  ];

  const statusColors = {
    Processed: "#3B82F6",
    "Waiting Goods": "#F59E0B",
    Delivery: "#8B5CF6",
    Success: "#10B981",
    Cancelled: "#EF4444",
  };

  const statusLabels = {
    Processed: "Đã xử lý",
    "Waiting Goods": "Chờ lấy hàng",
    Delivery: "Đang giao",
    Success: "Thành công",
    Cancelled: "Đã hủy",
  };

  const pieData = analytics
    ? Object.entries(analytics.statusBreakdown).map(([status, count]) => ({
        name: statusLabels[status] || status,
        value: count,
        color: statusColors[status],
      }))
    : [];

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Thống kê & Phân tích
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Tổng quan về doanh số và hiệu suất kinh doanh
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange("7days")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === "7days"
                ? "bg-primary-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            7 ngày
          </button>
          <button
            onClick={() => setTimeRange("30days")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === "30days"
                ? "bg-primary-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            30 ngày
          </button>
          <button
            onClick={() => setTimeRange("90days")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === "90days"
                ? "bg-primary-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            90 ngày
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                analytics.revenueGrowth >= 0
                  ? "bg-green-500/20"
                  : "bg-red-500/20"
              }`}
            >
              {analytics.revenueGrowth >= 0 ? (
                <TrendingUp size={14} />
              ) : (
                <TrendingDown size={14} />
              )}
              {Math.abs(analytics.revenueGrowth).toFixed(1)}%
            </div>
          </div>
          <div>
            <p className="text-blue-100 text-sm mb-1">Tổng doanh thu</p>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(analytics.totalRevenue)}
            </p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                analytics.ordersGrowth >= 0
                  ? "bg-green-500/20"
                  : "bg-red-500/20"
              }`}
            >
              {analytics.ordersGrowth >= 0 ? (
                <TrendingUp size={14} />
              ) : (
                <TrendingDown size={14} />
              )}
              {Math.abs(analytics.ordersGrowth).toFixed(1)}%
            </div>
          </div>
          <div>
            <p className="text-green-100 text-sm mb-1">Tổng đơn hàng</p>
            <p className="text-2xl font-bold">{analytics.totalOrders}</p>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Package className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-purple-100 text-sm mb-1">Giá trị TB/đơn</p>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(analytics.avgOrderValue)}
            </p>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-orange-100 text-sm mb-1">Sản phẩm</p>
            <p className="text-2xl font-bold">
              {products?.data?.products?.length || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Xu hướng doanh thu
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                style={{ fontSize: "12px" }}
                stroke="#9CA3AF"
              />
              <YAxis
                style={{ fontSize: "12px" }}
                stroke="#9CA3AF"
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}tr`}
              />
              <Tooltip
                formatter={(value) =>
                  new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(value)
                }
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Doanh thu"
                dot={{ fill: "#3B82F6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Phân bổ trạng thái đơn hàng
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products and Orders per Day */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top 5 sản phẩm bán chạy
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                type="number"
                style={{ fontSize: "12px" }}
                stroke="#9CA3AF"
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}tr`}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                style={{ fontSize: "12px" }}
                stroke="#9CA3AF"
              />
              <Tooltip
                formatter={(value) =>
                  new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(value)
                }
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar
                dataKey="revenue"
                fill="#10B981"
                radius={[0, 8, 8, 0]}
                name="Doanh thu"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Orders per Day */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Số đơn hàng theo ngày
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                style={{ fontSize: "12px" }}
                stroke="#9CA3AF"
              />
              <YAxis style={{ fontSize: "12px" }} stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar
                dataKey="orders"
                fill="#8B5CF6"
                radius={[8, 8, 0, 0]}
                name="Đơn hàng"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status Summary Table */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Tổng quan theo trạng thái
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số lượng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tỷ lệ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(analytics.statusBreakdown).map(
                ([status, count]) => (
                  <tr key={status} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                        style={{
                          backgroundColor: `${statusColors[status]}20`,
                          color: statusColors[status],
                        }}
                      >
                        {statusLabels[status] || status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {count} đơn
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {((count / analytics.totalOrders) * 100).toFixed(1)}%
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
