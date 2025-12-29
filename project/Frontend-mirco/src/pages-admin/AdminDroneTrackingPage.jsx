import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  Package,
  Bell,
  Menu,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Navigation,
  ArrowLeft,
  BarChart3,
  Users,
  TrendingUp,
  ShoppingBag,
  CreditCard,
  Store,
  Settings,
} from "lucide-react";
import DroneTrackingPage from "../pages/DroneTrackingPage";

const AdminDroneTrackingPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
    } else if (!user) {
      navigate("/admin/login");
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  if (!user || user.role !== "admin") {
    return null;
  }

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
          <Link
            to="/admin"
            className="text-2xl font-bold text-primary-600 flex items-center"
          >
            <Package className="mr-2" size={28} />
            FoodFast Admin
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-2 space-y-1">
            {[
              {
                id: "dashboard",
                name: "Tổng quan",
                icon: BarChart3,
                path: "/admin",
              },
              {
                id: "orders",
                name: "Đơn hàng",
                icon: ShoppingBag,
                path: "/admin",
              },
              { id: "menu", name: "Sản phẩm", icon: Package, path: "/admin" },
              {
                id: "restaurants",
                name: "Nhà hàng",
                icon: Store,
                path: "/admin",
              },
              {
                id: "customers",
                name: "Khách hàng",
                icon: Users,
                path: "/admin",
              },
              {
                id: "payments",
                name: "Thanh toán",
                icon: CreditCard,
                path: "/admin",
              },
              {
                id: "analytics",
                name: "Thống kê",
                icon: TrendingUp,
                path: "/admin",
              },
              {
                id: "drone-hub",
                name: "Drone Hub",
                icon: Navigation,
                path: "/admin",
                state: { activeNav: "drone-hub" },
              },
              {
                id: "settings",
                name: "Cài đặt",
                icon: Settings,
                path: "/admin",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  state={item.state}
                  className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <Icon className="mr-3" size={20} />
                  {item.name}
                </Link>
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
                Theo dõi Drone Giao Hàng
              </h2>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to="/admin"
                state={{ activeNav: "drone-hub" }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại Drone Hub
              </Link>
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
                      to="/admin"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Quay lại Dashboard
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
        <main className="flex-1 overflow-y-auto bg-gray-100">
          <DroneTrackingPage hideHeader={true} />
        </main>
      </div>
    </div>
  );
};

export default AdminDroneTrackingPage;
