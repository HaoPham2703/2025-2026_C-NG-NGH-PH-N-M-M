import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  BarChart3,
  Package,
  Users,
  TrendingUp,
  ShoppingBag,
  Bell,
  Menu,
  LogOut,
  Settings,
  User as UserIcon,
  ChevronDown,
  CreditCard,
  Store,
  Navigation,
} from "lucide-react";

// Import các sub-pages
import DashboardContent from "./DashboardContent";
import OrdersManagementPage from "./OrdersManagementPage";
import ProductsManagementPage from "./ProductsManagementPage";
import CustomersManagementPage from "./CustomersManagementPage";
import PaymentsManagementPage from "./PaymentsManagementPage";
import AnalyticsPage from "./AnalyticsPage";
import SettingsPage from "./SettingsPage";
import RestaurantsManagementPage from "./RestaurantsManagementPage";
import DroneHubPage from "../pages/DroneHubPage";
import DroneTrackingPage from "../pages/DroneTrackingPage";
import { useParams } from "react-router-dom";

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Check location state để set activeNav khi navigate từ trang khác
  useEffect(() => {
    if (location.state?.activeNav) {
      setActiveNav(location.state.activeNav);
    }
  }, [location.state]);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const renderContent = () => {
    switch (activeNav) {
      case "dashboard":
        return <DashboardContent />;
      case "orders":
        return <OrdersManagementPage />;
      case "menu":
        return <ProductsManagementPage />;
      case "customers":
        return <CustomersManagementPage />;
      case "payments":
        return <PaymentsManagementPage />;
      case "analytics":
        return <AnalyticsPage />;
      case "drone-hub":
        return <DroneHubPage hideHeader={true} />;
      case "settings":
        return <SettingsPage />;
      case "restaurants":
        return <RestaurantsManagementPage />;
      default:
        return <DashboardContent />;
    }
  };

  const getPageTitle = () => {
    const titles = {
      dashboard: "Tổng quan Dashboard",
      orders: "Quản lý đơn hàng",
      menu: "Quản lý sản phẩm",
      customers: "Quản lý khách hàng",
      payments: "Quản lý thanh toán",
      analytics: "Thống kê & Báo cáo",
      "drone-hub": "Drone Hub - Điều Khiển",
      settings: "Cài đặt hệ thống",
      restaurants: "Quản lý nhà hàng",
    };
    return titles[activeNav] || "Dashboard";
  };

  const navItems = [
    { id: "dashboard", name: "Tổng quan", icon: BarChart3 },
    { id: "orders", name: "Đơn hàng", icon: ShoppingBag },
    { id: "menu", name: "Sản phẩm", icon: Package },
    { id: "restaurants", name: "Nhà hàng", icon: Store },
    { id: "customers", name: "Khách hàng", icon: Users },
    { id: "payments", name: "Thanh toán", icon: CreditCard },
    { id: "analytics", name: "Thống kê", icon: TrendingUp },
    { id: "drone-hub", name: "Drone Hub", icon: Navigation },
    { id: "settings", name: "Cài đặt", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          showMobileMenu ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-in-out fixed md:static inset-y-0 left-0 z-50 w-64 flex flex-col bg-white shadow-lg`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-primary-600 flex items-center">
            <Package className="mr-2" size={28} />
            FoodFast Admin
          </h1>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveNav(item.id);
                    setShowMobileMenu(false); // Close mobile menu on navigation
                  }}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                    activeNav === item.id
                      ? "text-primary-600 bg-primary-50"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="mr-3" size={20} />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-primary-200 flex items-center justify-center">
              <UserIcon className="text-primary-600" size={20} />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || "Quản trị viên"}
              </p>
              <button
                onClick={handleLogout}
                className="text-xs font-medium text-primary-500 hover:text-primary-700 transition-colors flex items-center gap-1"
              >
                <LogOut size={12} />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {showMobileMenu && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setShowMobileMenu(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex justify-between items-center px-6 py-4">
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Menu size={24} />
              </button>
            </div>
            <div className="flex-1 md:ml-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {getPageTitle()}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center p-2 cursor-pointer rounded-full hover:bg-gray-100 transition-colors"
                >
                  <UserIcon size={20} />
                  <ChevronDown
                    size={16}
                    className={`ml-1 text-gray-400 transition-transform ${
                      showUserMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Trang cá nhân
                    </Link>
                    <Link
                      to="/admin"
                      onClick={() => setActiveNav("settings")}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Cài đặt
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
