import { Link } from "react-router-dom";
import { useQuery } from "react-query";
import { productApi } from "../api/productApi";
import {
  ShoppingCart,
  Star,
  Truck,
  Clock,
  Shield,
  ArrowRight,
  ChefHat,
  Heart,
  Zap,
  Users,
} from "lucide-react";
import "../styles/HomePage.css";

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
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="text-center">
            <div className="hero-title">
              <ChefHat className="hero-logo" />
              <h1 className="hero-main-title">FoodFast</h1>
            </div>
            <h2 className="hero-subtitle">Microservices Architecture</h2>
            <p className="hero-description">
              Đặt đồ ăn nhanh với kiến trúc microservices tiên tiến, tốc độ cao
              và trải nghiệm tuyệt vời
            </p>
            <div className="hero-buttons">
              <Link to="/products" className="hero-primary-btn">
                <ShoppingCart className="btn-icon" />
                Khám Phá Menu
                <ArrowRight className="btn-arrow" />
              </Link>
              <Link to="/signup" className="hero-secondary-btn">
                <Users className="btn-icon" />
                Tham Gia Ngay
              </Link>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="floating-element floating-1"></div>
        <div className="floating-element floating-2"></div>
        <div className="floating-element floating-3"></div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="features-header">
            <h2 className="features-title">Tại sao chọn FoodFast?</h2>
            <p className="features-description">
              Chúng tôi mang đến trải nghiệm đặt hàng tốt nhất với công nghệ
              hiện đại
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon feature-icon-blue">
                <Zap />
              </div>
              <h3 className="feature-title">Tốc Độ Cao</h3>
              <p className="feature-description">
                Kiến trúc microservices đảm bảo tốc độ xử lý nhanh chóng
              </p>
            </div>

            <div className="feature-item">
              <div className="feature-icon feature-icon-green">
                <Truck />
              </div>
              <h3 className="feature-title">Giao Hàng Nhanh</h3>
              <p className="feature-description">
                Cam kết giao hàng trong 30 phút với đội ngũ chuyên nghiệp
              </p>
            </div>

            <div className="feature-item">
              <div className="feature-icon feature-icon-purple">
                <Shield />
              </div>
              <h3 className="feature-title">An Toàn</h3>
              <p className="feature-description">
                Bảo mật thông tin và thanh toán với công nghệ tiên tiến
              </p>
            </div>

            <div className="feature-item">
              <div className="feature-icon feature-icon-pink">
                <Heart />
              </div>
              <h3 className="feature-title">Chất Lượng</h3>
              <p className="feature-description">
                Thực phẩm tươi ngon, được chế biến bởi đầu bếp chuyên nghiệp
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Top Products Section */}
      <section className="products-section">
        <div className="products-container">
          <div className="products-header">
            <h2 className="products-title">Sản Phẩm Nổi Bật</h2>
            <p className="products-description">
              Những món ăn được yêu thích nhất
            </p>
          </div>

          {isLoading ? (
            <div className="loading-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="loading-card">
                  <div className="loading-image"></div>
                  <div className="loading-content">
                    <div className="loading-line"></div>
                    <div className="loading-line loading-line-short"></div>
                    <div className="loading-line loading-line-tall"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="products-grid">
              {topProducts?.data?.products?.slice(0, 6).map((product) => (
                <div key={product._id} className="product-card">
                  <div className="product-image">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.title} />
                    ) : (
                      <div className="product-placeholder">
                        <ChefHat />
                        <span>No Image</span>
                      </div>
                    )}

                    {/* Promotion Badge */}
                    {product.promotion && (
                      <div className="promotion-badge">
                        -
                        {Math.round(
                          (1 - product.promotion / product.price) * 100
                        )}
                        %
                      </div>
                    )}
                  </div>

                  <div className="product-info">
                    <h3 className="product-title">{product.title}</h3>

                    <div className="product-rating">
                      <div className="product-stars">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={
                              i < Math.floor(product.ratingsAverage || 0)
                                ? "filled"
                                : "empty"
                            }
                          />
                        ))}
                      </div>
                      <span className="product-rating-count">
                        ({product.ratingsQuantity || 0})
                      </span>
                    </div>

                    <div className="product-footer">
                      <div className="product-price">
                        {product.promotion ? (
                          <>
                            <span className="product-price-current">
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(product.promotion)}
                            </span>
                            <span className="product-price-original">
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(product.price)}
                            </span>
                          </>
                        ) : (
                          <span className="product-price-normal">
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(product.price)}
                          </span>
                        )}
                      </div>

                      <Link
                        to={`/products/${product._id}`}
                        className="product-action"
                      >
                        <ShoppingCart />
                        <span>Đặt Ngay</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="products-cta">
            <Link to="/products" className="products-cta-btn">
              Xem Tất Cả Sản Phẩm
              <ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stats-grid">
            <div>
              <div className="stat-number">10K+</div>
              <div className="stat-label">Khách Hàng</div>
            </div>
            <div>
              <div className="stat-number">500+</div>
              <div className="stat-label">Món Ăn</div>
            </div>
            <div>
              <div className="stat-number">30min</div>
              <div className="stat-label">Giao Hàng</div>
            </div>
            <div>
              <div className="stat-number">24/7</div>
              <div className="stat-label">Hỗ Trợ</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">Sẵn sàng thưởng thức món ngon?</h2>
          <p className="cta-description">
            Tham gia cùng hàng nghìn khách hàng đã tin tưởng FoodFast
          </p>
          <div className="cta-buttons">
            <Link to="/signup" className="cta-primary-btn">
              Đăng Ký Ngay
            </Link>
            <Link to="/products" className="cta-secondary-btn">
              Xem Menu
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
