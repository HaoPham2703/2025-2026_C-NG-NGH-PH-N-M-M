import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../contexts/CartContext";
import {
  ShoppingCart,
  User,
  LogOut,
  Menu,
  X,
  ChefHat,
  Search,
  Bell,
  Heart,
  MapPin,
  Star,
  Plus,
} from "lucide-react";

const Header = () => {
  const { user, logout } = useAuth();
  const { getTotalItems } = useCart();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAddress, setSelectedAddress] = useState(null);

  // Lấy địa chỉ đã chọn từ localStorage hoặc dùng địa chỉ mặc định
  useEffect(() => {
    if (user?.address && user.address.length > 0) {
      const savedAddressIndex = localStorage.getItem("selectedAddressIndex");
      if (savedAddressIndex !== null) {
        const index = parseInt(savedAddressIndex);
        if (index >= 0 && index < user.address.length) {
          setSelectedAddress(user.address[index]);
          return;
        }
      }
      // Nếu không có địa chỉ đã lưu, dùng địa chỉ mặc định
      const defaultIndex = user.address.findIndex((addr) => addr.setDefault);
      if (defaultIndex !== -1) {
        setSelectedAddress(user.address[defaultIndex]);
        localStorage.setItem("selectedAddressIndex", defaultIndex.toString());
      } else {
        setSelectedAddress(user.address[0]);
        localStorage.setItem("selectedAddressIndex", "0");
      }
    } else {
      setSelectedAddress(null);
      localStorage.removeItem("selectedAddressIndex");
    }
  }, [user]);

  const handleLocationSelect = (address) => {
    setSelectedAddress(address);
    // Lưu index của địa chỉ đã chọn
    const index = user.address.findIndex(
      (addr) =>
        (addr._id && address._id && addr._id === address._id) ||
        (addr.id && address.id && addr.id === address.id) ||
        addr === address
    );
    if (index !== -1) {
      localStorage.setItem("selectedAddressIndex", index.toString());
    }
    setIsLocationMenuOpen(false);
  };

  const getAddressDisplay = (address) => {
    if (!address) return "Chọn địa chỉ";
    return `${address.district}, ${address.province}`;
  };

  // Đóng dropdown khi click bên ngoài
  const locationRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setIsLocationMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
    setIsUserMenuOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <ChefHat className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                FoodFast
              </span>
              <span className="text-xs text-gray-500 font-medium">
                Microservices
              </span>
            </div>
          </Link>

          {/* Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearch} className="w-full relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm món ăn..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1.5 rounded-full hover:from-orange-600 hover:to-red-600 transition-all duration-200 text-sm font-medium"
                >
                  Tìm
                </button>
              </div>
            </form>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className="px-4 py-2 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200 font-medium"
            >
              Trang chủ
            </Link>
            <Link
              to="/products"
              className="px-4 py-2 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200 font-medium"
            >
              Sản phẩm
            </Link>
            {user && (
              <>
                <Link
                  to="/orders"
                  className="px-4 py-2 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200 font-medium"
                >
                  Đơn hàng
                </Link>
                <Link
                  to="/favorites"
                  className="px-4 py-2 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200 relative"
                >
                  <Heart className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                </Link>
              </>
            )}
          </nav>

          {/* User Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <>
                {/* Location Dropdown */}
                {user && (
                  <div className="relative" ref={locationRef}>
                    <button
                      onClick={() => setIsLocationMenuOpen(!isLocationMenuOpen)}
                      className="flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors cursor-pointer p-2 rounded-lg hover:bg-orange-50"
                    >
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium max-w-[150px] truncate">
                        {getAddressDisplay(selectedAddress)}
                      </span>
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${
                          isLocationMenuOpen ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {isLocationMenuOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 max-h-96 overflow-y-auto">
                        <div className="px-4 py-2 border-b border-gray-100 sticky top-0 bg-white">
                          <p className="text-sm font-semibold text-gray-900">
                            Chọn địa chỉ giao hàng
                          </p>
                        </div>
                        {user.address && user.address.length > 0 ? (
                          <>
                            {user.address.map((address, index) => {
                              // So sánh địa chỉ bằng cách so sánh object reference hoặc các field chính
                              const isSelected =
                                selectedAddress &&
                                (selectedAddress === address ||
                                  (selectedAddress._id &&
                                    address._id &&
                                    selectedAddress._id === address._id) ||
                                  (selectedAddress.id &&
                                    address.id &&
                                    selectedAddress.id === address.id) ||
                                  (selectedAddress.detail === address.detail &&
                                    selectedAddress.phone === address.phone &&
                                    selectedAddress.province ===
                                      address.province));
                              return (
                                <button
                                  key={index}
                                  onClick={() => handleLocationSelect(address)}
                                  className={`w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                                    isSelected
                                      ? "bg-orange-50 border-l-4 border-l-orange-500"
                                      : ""
                                  }`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <span className="text-sm font-semibold text-gray-900">
                                          {address.name}
                                        </span>
                                        {address.setDefault && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                            <Star className="w-3 h-3 mr-1" />
                                            Mặc định
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-600 mb-1">
                                        {address.phone}
                                      </p>
                                      <p className="text-xs text-gray-500 line-clamp-2">
                                        {address.detail}, {address.ward},{" "}
                                        {address.district}, {address.province}
                                      </p>
                                    </div>
                                    {isSelected && (
                                      <div className="ml-2 flex-shrink-0">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                      </div>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                            <Link
                              to="/profile"
                              onClick={() => setIsLocationMenuOpen(false)}
                              className="flex items-center space-x-2 px-4 py-3 text-sm text-orange-600 hover:bg-orange-50 transition-colors border-t border-gray-100"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Thêm địa chỉ mới</span>
                            </Link>
                          </>
                        ) : (
                          <div className="px-4 py-6 text-center">
                            <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500 mb-3">
                              Chưa có địa chỉ nào
                            </p>
                            <Link
                              to="/profile"
                              onClick={() => setIsLocationMenuOpen(false)}
                              className="inline-flex items-center space-x-2 px-4 py-2 text-sm text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Thêm địa chỉ</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Notifications */}
                <button className="relative p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                </button>

                {/* Cart */}
                <Link
                  to="/cart"
                  className="relative p-3 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-200 group"
                >
                  <ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg">
                    {getTotalItems()}
                  </span>
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-orange-500 group-hover:w-full transition-all duration-200"></div>
                </Link>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 p-2 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium">{user.name}</span>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-semibold text-gray-900">
                          {user.name}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span>Thông tin cá nhân</span>
                      </Link>
                      {user.role === "admin" && (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                        >
                          <ChefHat className="w-4 h-4" />
                          <span>Quản trị viên</span>
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                {/* Cart for non-logged users */}
                <Link
                  to="/cart"
                  className="relative p-3 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-200 group"
                >
                  <ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg">
                    {getTotalItems()}
                  </span>
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-orange-500 group-hover:w-full transition-all duration-200"></div>
                </Link>

                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-700 hover:text-orange-600 transition-colors font-medium"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/signup"
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full hover:from-orange-600 hover:to-red-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Search */}
        <div className="lg:hidden pb-4">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm món ăn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1.5 rounded-full hover:from-orange-600 hover:to-red-600 transition-all duration-200 text-sm font-medium"
              >
                Tìm
              </button>
            </div>
          </form>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
            <nav className="flex flex-col space-y-2">
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-white rounded-lg transition-all duration-200 font-medium"
              >
                <span>Trang chủ</span>
              </Link>
              <Link
                to="/products"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-white rounded-lg transition-all duration-200 font-medium"
              >
                <span>Sản phẩm</span>
              </Link>
              {user ? (
                <>
                  <Link
                    to="/orders"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-white rounded-lg transition-all duration-200 font-medium"
                  >
                    <span>Đơn hàng</span>
                  </Link>
                  <Link
                    to="/favorites"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-white rounded-lg transition-all duration-200 font-medium"
                  >
                    <Heart className="w-5 h-5" />
                    <span>Yêu thích</span>
                  </Link>
                  <Link
                    to="/cart"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-white rounded-lg transition-all duration-200 font-medium relative group"
                  >
                    <div className="relative">
                      <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg">
                        {getTotalItems()}
                      </span>
                    </div>
                    <span>Giỏ hàng</span>
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-white rounded-lg transition-all duration-200 font-medium"
                  >
                    <User className="w-5 h-5" />
                    <span>Thông tin cá nhân</span>
                  </Link>
                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-white rounded-lg transition-all duration-200 font-medium"
                    >
                      <ChefHat className="w-5 h-5" />
                      <span>Quản trị viên</span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium text-left w-full"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Đăng xuất</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-white rounded-lg transition-all duration-200 font-medium"
                  >
                    <span>Đăng nhập</span>
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center space-x-3 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 font-medium"
                  >
                    <span>Đăng ký</span>
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
