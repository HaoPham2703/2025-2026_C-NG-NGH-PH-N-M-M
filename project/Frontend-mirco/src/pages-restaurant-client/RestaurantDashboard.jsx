import { useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Store,
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  User,
} from "lucide-react";
import toast from "react-hot-toast";

const RestaurantDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [restaurantData, setRestaurantData] = useState(() => {
    try {
      const data = localStorage.getItem("restaurant_data");
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error("Error parsing restaurant_data:", error);
      return {};
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("restaurant_token");
    localStorage.removeItem("restaurant_data");
    toast.success("Đã đăng xuất!");
    navigate("/restaurant/login");
  };

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: "Tổng quan",
      path: "/restaurant/dashboard",
      active: location.pathname === "/restaurant/dashboard",
    },
    {
      icon: UtensilsCrossed,
      label: "Quản lý món ăn",
      path: "/restaurant/dashboard/products",
      active: location.pathname.includes("/products"),
    },
    {
      icon: ShoppingBag,
      label: "Đơn hàng",
      path: "/restaurant/dashboard/orders",
      active: location.pathname.includes("/orders"),
    },
    {
      icon: BarChart3,
      label: "Thống kê",
      path: "/restaurant/dashboard/analytics",
      active: location.pathname.includes("/analytics"),
    },
    {
      icon: Settings,
      label: "Cài đặt",
      path: "/restaurant/dashboard/settings",
      active: location.pathname.includes("/settings"),
    },
  ];

  // Check if token exists
  const token = localStorage.getItem("restaurant_token");
  if (!token) {
    navigate("/restaurant/login", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 flex flex-col`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 flex-shrink-0">
          <Link to="/restaurant/dashboard" className="flex items-center space-x-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Store className="h-6 w-6 text-orange-600" />
            </div>
            <span className="text-xl font-bold text-gray-900">Restaurant</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Restaurant Info */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-3 rounded-full">
              <Store className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {restaurantData.restaurantName || "Nhà hàng của tôi"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {restaurantData.email || "restaurant@example.com"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                item.active
                  ? "bg-orange-50 text-orange-600 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1"></div>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="h-6 w-6" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Profile */}
            <div className="flex items-center space-x-3">
              <div className="bg-orange-100 p-2 rounded-full">
                <User className="h-5 w-5 text-orange-600" />
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">
                  {restaurantData.ownerName || "Chủ nhà hàng"}
                </p>
                <p className="text-xs text-gray-500">Restaurant Owner</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        ></div>
      )}
    </div>
  );
};

export default RestaurantDashboard;

