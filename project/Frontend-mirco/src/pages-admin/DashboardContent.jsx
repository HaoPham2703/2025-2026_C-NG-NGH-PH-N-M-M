import { useQuery } from "react-query";
import { Link } from "react-router-dom";
import { orderApi } from "../api/orderApi";
import {
  ShoppingBag,
  DollarSign,
  Star,
  Users,
  BarChart3,
  Package,
  Store,
} from "lucide-react";

// Import orderApi để lấy dữ liệu

const DashboardContent = () => {
  const { data: orderStats } = useQuery("orderStats", orderApi.getOrderStats);
  const { data: revenueStats } = useQuery(
    "revenueStats",
    orderApi.getRevenueStats
  );
  const { data: topProducts } = useQuery("topProducts", () =>
    orderApi.getTopProducts({})
  );
  const { data: topRestaurants } = useQuery("topRestaurants", () =>
    orderApi.getTopRestaurants()
  );
  const { data: recentOrders } = useQuery("dashboardRecentOrders", () =>
    orderApi.getOrders()
  );

  const getStatusBadge = (status) => {
    const badges = {
      Delivered: "bg-green-100 text-green-800",
      "In Transit": "bg-yellow-100 text-yellow-800",
      Preparing: "bg-blue-100 text-blue-800",
      Cancelled: "bg-red-100 text-red-800",
      Processed: "bg-blue-100 text-blue-800",
      Success: "bg-green-100 text-green-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Orders */}
        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary-100 text-primary-600">
              <ShoppingBag size={24} />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">
                Tổng đơn hàng
              </h3>
              <p className="text-2xl font-semibold text-gray-900">
                {orderStats?.reduce((sum, item) => sum + item.count, 0) || 0}
              </p>
              <p className="text-xs text-green-600">+12.5% tuần trước</p>
            </div>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <DollarSign size={24} />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Doanh thu</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(revenueStats?.[0]?.total_revenue || 0)}
              </p>
              <p className="text-xs text-green-600">+8.2% tuần trước</p>
            </div>
          </div>
        </div>

        {/* Avg Rating */}
        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-amber-100 text-amber-600">
              <Star size={24} />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Đánh giá TB</h3>
              <p className="text-2xl font-semibold text-gray-900">4.8/5</p>
              <p className="text-xs text-green-600">+0.3 tháng trước</p>
            </div>
          </div>
        </div>

        {/* New Customers */}
        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Users size={24} />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">
                Khách hàng mới
              </h3>
              <p className="text-2xl font-semibold text-gray-900">482</p>
              <p className="text-xs text-red-600">-2.3% tuần trước</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Overview */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Tổng quan doanh số
            </h3>
            <select className="text-sm rounded-md border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50 cursor-pointer">
              <option>7 ngày qua</option>
              <option>30 ngày qua</option>
              <option>90 ngày qua</option>
            </select>
          </div>
          <div className="h-80 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <BarChart3 size={48} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Biểu đồ sẽ được cập nhật sớm</p>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Sản phẩm bán chạy
            </h3>
          </div>
          <div className="space-y-3">
            {topProducts?.slice(0, 5).map((product, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-primary-600">
                      {index + 1}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      Đã bán: {product.quantity}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              Đơn hàng gần đây
            </h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {recentOrders?.data?.orders?.slice(0, 5).map((order) => (
              <div
                key={order._id}
                className="block p-4 hover:bg-gray-50 transition-colors cursor-default"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Đơn #{order._id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.cart
                        ?.map((item) => item.product?.title)
                        .join(", ")
                        .slice(0, 50)}
                      {order.cart?.map((item) => item.product?.title).join(", ")
                        .length > 50 && "..."}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.status === "Success"
                        ? "bg-green-100 text-green-800"
                        : order.status === "Delivery"
                        ? "bg-purple-100 text-purple-800"
                        : order.status === "Processed"
                        ? "bg-blue-100 text-blue-800"
                        : order.status === "Cancelled"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {order.status === "Processed"
                      ? "Đã xử lý"
                      : order.status === "Waiting Goods"
                      ? "Chờ hàng"
                      : order.status === "Delivery"
                      ? "Đang giao"
                      : order.status === "Success"
                      ? "Thành công"
                      : order.status === "Cancelled"
                      ? "Đã hủy"
                      : order.status}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <span>Khách: {order.receiver}</span>
                    <span>•</span>
                    <span>{order.cart?.length || 0} món</span>
                  </div>
                  <div className="font-semibold text-primary-600">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(order.totalPrice)}
                  </div>
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  {new Date(order.createdAt).toLocaleString("vi-VN")}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <Link
              to="/orders"
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Xem tất cả đơn hàng →
            </Link>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              Top sản phẩm
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {topProducts?.slice(0, 5).map((product, index) => (
              <div
                key={index}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                    {product.images?.[0] ? (
                      <img
                        className="h-full w-full object-cover"
                        src={product.images[0]}
                        alt={product.title}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package className="text-gray-400" size={20} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.title}
                    </p>
                    <div className="flex items-center">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            fill={i < 4 ? "currentColor" : "none"}
                          />
                        ))}
                      </div>
                      <span className="ml-1 text-xs text-gray-500">
                        4.5 (342)
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(product.price || 0)}
                    </p>
                    <p className="text-xs text-green-600">
                      Đã bán {product.quantity}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <Link
              to="/products"
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Xem tất cả sản phẩm →
            </Link>
          </div>
        </div>

        {/* Top 5 Restaurants */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              Top 5 Nhà hàng
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {topRestaurants?.slice(0, 5).map((restaurant, index) => (
              <div
                key={restaurant._id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-white">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {restaurant.restaurantName || "Nhà hàng"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {restaurant.orderCount} đơn hàng
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-primary-600">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(restaurant.totalRevenue || 0)}
                    </p>
                    <p className="text-xs text-gray-500">Doanh thu</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <Link
              to="#"
              onClick={(e) => {
                e.preventDefault();
                // Navigate to restaurants management
              }}
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Xem tất cả nhà hàng →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
