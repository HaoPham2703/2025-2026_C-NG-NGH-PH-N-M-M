import { Link } from "react-router-dom";
import { useQuery } from "react-query";
import { productApi } from "../api/productApi";
import { ShoppingCart, Star, Truck, Clock, Shield } from "lucide-react";

const HomePage = () => {
  const { data: topProducts, isLoading } = useQuery(
    "topProducts",
    productApi.getTopProducts,
    {
      refetchOnWindowFocus: false,
    }
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to FoodFast
              <span className="block text-primary-200">Microservices</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Đặt đồ ăn nhanh với kiến trúc microservices tiên tiến
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/products"
                className="btn-primary bg-white text-primary-600 hover:bg-gray-100"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Xem Sản Phẩm
              </Link>
              <Link
                to="/signup"
                className="btn-secondary bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary-600"
              >
                Đăng Ký Ngay
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tại sao chọn FoodFast?
            </h2>
            <p className="text-lg text-gray-600">
              Kiến trúc microservices mang lại trải nghiệm tốt nhất
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Giao Hàng Nhanh</h3>
              <p className="text-gray-600">
                Drone delivery với thời gian giao hàng dưới 20 phút
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Xử Lý Nhanh</h3>
              <p className="text-gray-600">
                API Gateway xử lý request dưới 200ms
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Bảo Mật Cao</h3>
              <p className="text-gray-600">
                JWT authentication và microservices isolation
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Top Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Sản Phẩm Nổi Bật
            </h2>
            <p className="text-lg text-gray-600">
              Những món ăn được yêu thích nhất
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-48 bg-gray-300 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {topProducts?.data?.products?.slice(0, 6).map((product) => (
                <div
                  key={product._id}
                  className="card hover:shadow-lg transition-shadow"
                >
                  <div className="h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-gray-400">No Image</span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {product.title}
                  </h3>
                  <div className="flex items-center mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.ratingsAverage || 0)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 ml-2">
                      ({product.ratingsQuantity || 0})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {product.promotion ? (
                        <>
                          <span className="text-lg font-bold text-primary-600">
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(product.promotion)}
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(product.price)}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-primary-600">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(product.price)}
                        </span>
                      )}
                    </div>
                    <Link
                      to={`/products/${product._id}`}
                      className="btn-primary text-sm"
                    >
                      Xem Chi Tiết
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/products" className="btn-primary">
              Xem Tất Cả Sản Phẩm
            </Link>
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Kiến Trúc Microservices
            </h2>
            <p className="text-lg text-gray-600">
              Hệ thống được xây dựng với 4 core services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold">U</span>
              </div>
              <h3 className="font-semibold mb-2">User Service</h3>
              <p className="text-sm text-gray-600">
                Quản lý người dùng và authentication
              </p>
            </div>

            <div className="card text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 font-bold">P</span>
              </div>
              <h3 className="font-semibold mb-2">Product Service</h3>
              <p className="text-sm text-gray-600">
                Quản lý sản phẩm và inventory
              </p>
            </div>

            <div className="card text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-yellow-600 font-bold">O</span>
              </div>
              <h3 className="font-semibold mb-2">Order Service</h3>
              <p className="text-sm text-gray-600">
                Xử lý đơn hàng và analytics
              </p>
            </div>

            <div className="card text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 font-bold">$</span>
              </div>
              <h3 className="font-semibold mb-2">Payment Service</h3>
              <p className="text-sm text-gray-600">
                Xử lý thanh toán và transactions
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
