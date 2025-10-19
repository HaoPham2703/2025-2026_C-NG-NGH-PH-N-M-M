import { useState } from "react";
import { useQuery } from "react-query";
import { Link } from "react-router-dom";
import { productApi } from "../api/productApi";
import {
  Star,
  ShoppingCart,
  Timer,
  Verified,
  ArrowRight,
  Menu,
  CreditCard,
  ChefHat,
  Plane,
} from "lucide-react";
import "../styles/HomePageNew.css";

const HomePageNew = () => {
  const { data: topProducts, isLoading } = useQuery(
    "topProducts",
    productApi.getTopProducts,
    {
      refetchOnWindowFocus: false,
    }
  );

  const products = topProducts?.data?.products || [];

  return (
    <div className="homepage-new">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 text-white mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Giao hàng nhanh chóng bằng Drone
            </h1>
            <p className="text-xl mb-8">
              Thưởng thức đồ ăn nóng hổi chỉ trong vòng 15 phút với công nghệ
              giao hàng bằng drone tiên tiến
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link
                to="/products"
                className="bg-white text-primary-600 font-semibold px-6 py-3 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105 text-center"
              >
                Đặt hàng ngay
              </Link>
              <Link
                to="/products"
                className="border border-white text-white font-semibold px-6 py-3 rounded-full hover:bg-white hover:text-primary-600 transition-all duration-300 text-center"
              >
                Xem thực đơn
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 relative">
            <img
              src="https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
              alt="Drone delivery"
              className="rounded-lg shadow-xl transform hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-lg shadow-lg transform hover:rotate-2 transition-transform duration-300">
              <div className="flex items-center space-x-2 text-primary-600">
                <Timer className="w-6 h-6" />
                <span className="font-bold text-xl">15 phút</span>
              </div>
              <p className="text-gray-600 text-sm">Giao hàng siêu tốc</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-orange-50 clip-wave"></div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">Cách thức hoạt động</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Quy trình đặt hàng và giao hàng bằng drone đơn giản, nhanh chóng
              và tiện lợi
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
            <div className="how-it-works-card">
              <div className="icon-container">
                <Menu className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Chọn món</h3>
              <p className="text-gray-600">
                Lựa chọn món ăn từ thực đơn đa dạng của chúng tôi
              </p>
            </div>
            <div className="how-it-works-card">
              <div className="icon-container">
                <CreditCard className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Đặt hàng</h3>
              <p className="text-gray-600">
                Thanh toán dễ dàng với nhiều phương thức khác nhau
              </p>
            </div>
            <div className="how-it-works-card">
              <div className="icon-container">
                <ChefHat className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Chuẩn bị</h3>
              <p className="text-gray-600">
                Đầu bếp chúng tôi chuẩn bị món ăn tươi ngon
              </p>
            </div>
            <div className="how-it-works-card">
              <div className="icon-container">
                <Plane className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Giao hàng</h3>
              <p className="text-gray-600">
                Drone sẽ giao món ăn đến địa chỉ của bạn
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Menu Section */}
      <section className="popular-menu-section">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold">Thực đơn phổ biến</h2>
            <Link
              to="/products"
              className="text-primary-600 hover:text-primary-700 flex items-center group"
            >
              Xem tất cả
              <ArrowRight className="w-5 h-5 ml-1 transform group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading
              ? // Loading skeleton
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="product-card-skeleton">
                    <div className="skeleton-image"></div>
                    <div className="p-5">
                      <div className="skeleton-title"></div>
                      <div className="skeleton-price"></div>
                      <div className="skeleton-description"></div>
                      <div className="skeleton-rating"></div>
                      <div className="skeleton-button"></div>
                    </div>
                  </div>
                ))
              : products.slice(0, 3).map((product) => (
                  <Link
                    key={product._id}
                    to={`/products/${product._id}`}
                    className="product-card block hover:shadow-xl transition-all duration-300"
                  >
                    <div className="relative">
                      <img
                        src={
                          product.images?.[0] ||
                          "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                        }
                        alt={product.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-0 left-0 bg-primary-500 text-white py-1 px-3 rounded-br-lg font-semibold">
                        Bán chạy
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-semibold">
                          {product.title}
                        </h3>
                        <div className="flex flex-col items-end">
                          {product.promotion ? (
                            <>
                              <span className="text-sm text-gray-500 line-through">
                                {new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(product.price)}
                              </span>
                              <span className="bg-primary-100 text-primary-700 text-sm font-semibold py-1 px-2 rounded">
                                {new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(product.promotion)}
                              </span>
                            </>
                          ) : (
                            <span className="bg-primary-100 text-primary-700 text-sm font-semibold py-1 px-2 rounded">
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(product.price)}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-600 mt-2">
                        {product.description ||
                          "Món ăn ngon được chế biến từ nguyên liệu tươi ngon"}
                      </p>
                      <div className="flex items-center mt-3">
                        <div className="flex text-primary-500">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(product.ratingsAverage || 4.5)
                                  ? "fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-gray-500 ml-2">
                          {product.ratingsAverage?.toFixed(1) || "4.5"} (
                          {product.ratingsQuantity || 0})
                        </span>
                      </div>
                      <div className="mt-4 w-full bg-primary-500 hover:bg-primary-600 text-white py-2 rounded-lg transition-colors duration-300 flex items-center justify-center pointer-events-none">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Thêm vào giỏ
                      </div>
                    </div>
                  </Link>
                ))}
          </div>
        </div>
      </section>

      {/* App Download Section */}
      <section className="app-download-section">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h2 className="text-3xl font-bold mb-4">Tải ứng dụng FoodFast</h2>
              <p className="text-gray-700 mb-6 text-lg">
                Theo dõi đơn hàng theo thời gian thực, nhận ưu đãi đặc biệt và
                trải nghiệm giao hàng bằng drone ngay trên ứng dụng của chúng
                tôi.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <a
                  href="#"
                  className="flex items-center bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-300"
                >
                  <span className="mr-3 text-2xl">🍎</span>
                  <div>
                    <div className="text-xs">Tải về trên</div>
                    <div className="text-sm font-semibold">App Store</div>
                  </div>
                </a>
                <a
                  href="#"
                  className="flex items-center bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-300"
                >
                  <span className="mr-3 text-2xl">🤖</span>
                  <div>
                    <div className="text-xs">Tải về trên</div>
                    <div className="text-sm font-semibold">Google Play</div>
                  </div>
                </a>
              </div>
            </div>
            <div className="md:w-1/2 relative">
              <img
                src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Mobile app"
                className="rounded-xl shadow-xl mx-auto max-w-sm transform hover:rotate-3 transition-transform duration-500"
              />
              <div className="absolute -bottom-4 -right-4 bg-white p-3 rounded-lg shadow-lg transform rotate-3 hover:rotate-6 transition-transform duration-300">
                <div className="flex items-center text-primary-600">
                  <Verified className="w-5 h-5 mr-2" />
                  <span className="font-bold">Theo dõi trực tiếp</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">
              Khách hàng nói gì về chúng tôi
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Những trải nghiệm thực tế từ khách hàng đã sử dụng dịch vụ giao
              hàng bằng drone của chúng tôi
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="testimonial-card">
              <div className="flex items-center mb-4">
                <img
                  src="https://images.unsplash.com/photo-1556741533-e228ee50f8b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3MzkyNDZ8MXwxfHNlYXJjaHwxfHxjdXN0b21lcnxlbnwwfHx8fDE3NjA2OTI5MjN8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Customer"
                  className="w-14 h-14 rounded-full object-cover border-2 border-primary-500"
                />
                <div className="ml-4">
                  <h4 className="font-semibold">Nguyễn Thị Mai</h4>
                  <div className="flex text-primary-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "Thật không thể tin được khi thức ăn được giao đến chỉ sau 12
                phút đặt hàng! Drone giao hàng là một trải nghiệm thú vị và món
                ăn vẫn còn nóng hổi."
              </p>
            </div>
            <div className="testimonial-card">
              <div className="flex items-center mb-4">
                <img
                  src="https://images.unsplash.com/photo-1590698933947-a202b069a861?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3MzkyNDZ8MHwxfHNlYXJjaHwyfHxjdXN0b21lcnxlbnwwfHx8fDE3NjA2OTI5MjN8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Customer"
                  className="w-14 h-14 rounded-full object-cover border-2 border-primary-500"
                />
                <div className="ml-4">
                  <h4 className="font-semibold">Trần Văn Hiếu</h4>
                  <div className="flex text-primary-500">
                    {[...Array(4)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                    <Star className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "Ban đầu tôi còn nghi ngờ về việc giao hàng bằng drone, nhưng
                sau khi thử thì thực sự ấn tượng. Đồ ăn đến nhanh chóng và chất
                lượng rất tốt."
              </p>
            </div>
            <div className="testimonial-card">
              <div className="flex items-center mb-4">
                <img
                  src="https://images.unsplash.com/photo-1556740758-90de374c12ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3MzkyNDZ8MHwxfHNlYXJjaHwzfHxjdXN0b21lcnxlbnwwfHx8fDE3NjA2OTI5MjN8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Customer"
                  className="w-14 h-14 rounded-full object-cover border-2 border-primary-500"
                />
                <div className="ml-4">
                  <h4 className="font-semibold">Lê Thị Hương</h4>
                  <div className="flex text-primary-500">
                    {[...Array(4)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                    <Star className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "Tôi thực sự thích cách đồ ăn được đóng gói kỹ lưỡng để vận
                chuyển bằng drone. Pizza vẫn giữ nguyên hình dạng và nóng hổi
                khi đến tay tôi."
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePageNew;
