import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "react-query";
import { productApi } from "../api/productApi";
import {
  Star,
  ShoppingCart,
  Heart,
  Share2,
  Clock,
  Truck,
  Shield,
  ChefHat,
  Plus,
  Minus,
  ArrowLeft,
  Zap,
  Award,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useCart } from "../contexts/CartContext";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Breadcrumb from "../components/Breadcrumb";
import "../styles/ProductDetailPage.css";

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addToCart, isInCart, getItemQuantity } = useCart();

  const {
    data: product,
    isLoading,
    error,
  } = useQuery(["product", id], () => productApi.getProduct(id), {
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !product?.data?.product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Sản phẩm không tồn tại
          </h2>
          <p className="text-gray-600">Vui lòng thử lại sau</p>
        </div>
      </div>
    );
  }

  const productData = product.data.product;
  const maxQuantity = Math.min(productData.inventory || 0, 10);

  const handleAddToCart = () => {
    if (!productData) return;

    addToCart(productData, quantity);
    toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
  };

  const handleBuyNow = () => {
    if (!productData) return;

    addToCart(productData, quantity);
    toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
    navigate("/cart");
  };

  const breadcrumbItems = [
    { label: "Trang Chủ", path: "/" },
    { label: "Sản Phẩm", path: "/products" },
    {
      label: productData?.title || "Chi tiết sản phẩm",
      path: `/products/${id}`,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <Breadcrumb items={breadcrumbItems} />

      {/* Back Button */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/products"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Quay lại danh sách</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image Section */}
          <div className="space-y-6">
            {/* Main Image */}
            <div className="relative">
              <div className="aspect-square bg-white rounded-3xl shadow-2xl overflow-hidden">
                {productData.images?.[selectedImageIndex] ? (
                  <img
                    src={productData.images[selectedImageIndex]}
                    alt={productData.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-red-100">
                    <ChefHat className="w-24 h-24 text-orange-400" />
                  </div>
                )}
              </div>

              {/* Promotion Badge */}
              {productData.promotion && (
                <div className="absolute top-6 left-6 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg">
                  -
                  {Math.round(
                    ((productData.price - productData.promotion) /
                      productData.price) *
                      100
                  )}
                  %
                </div>
              )}

              {/* Quick Actions */}
              <div className="absolute top-6 right-6 flex flex-col space-y-3">
                <button className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
                  <Heart className="w-6 h-6 text-red-500" />
                </button>
                <button className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
                  <Share2 className="w-6 h-6 text-blue-500" />
                </button>
              </div>
            </div>

            {/* Thumbnail Images */}
            {productData.images?.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {productData.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square bg-white rounded-2xl overflow-hidden border-4 transition-all duration-300 ${
                      selectedImageIndex === index
                        ? "border-orange-500 shadow-lg scale-105"
                        : "border-transparent hover:border-orange-200"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${productData.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Food Delivery Features */}
            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Truck className="w-6 h-6 text-orange-500 mr-2" />
                Dịch vụ giao hàng
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">30 phút</p>
                    <p className="text-sm text-gray-600">Giao hàng nhanh</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">An toàn</p>
                    <p className="text-sm text-gray-600">Đóng gói kỹ</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Zap className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Nóng hổi</p>
                    <p className="text-sm text-gray-600">Giữ nhiệt tốt</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Award className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Chất lượng</p>
                    <p className="text-sm text-gray-600">Đầu bếp chuyên</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Info Section */}
          <div className="space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {productData.title}
              </h1>

              <div className="flex items-center space-x-4 mb-6">
                <div className="flex items-center bg-yellow-100 px-3 py-1 rounded-full">
                  <div className="flex items-center mr-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(productData.ratingsAverage || 0)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {productData.ratingsAverage?.toFixed(1) || "0.0"}
                  </span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Users className="w-4 h-4 mr-1" />
                  <span className="text-sm">
                    {productData.ratingsQuantity || 0} đánh giá
                  </span>
                </div>
              </div>
            </div>

            {/* Price Section */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-orange-100 text-sm mb-1">Giá món ăn</p>
                  {productData.promotion ? (
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl font-bold">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(productData.promotion)}
                      </span>
                      <span className="text-lg line-through opacity-75">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(productData.price)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-3xl font-bold">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(productData.price)}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-orange-100 text-sm">Còn lại</p>
                  <p className="text-2xl font-bold">
                    {productData.inventory || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Số lượng
                </h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="w-16 text-center text-xl font-bold">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity(Math.min(maxQuantity, quantity + 1))
                    }
                    className="w-10 h-10 rounded-full bg-orange-100 hover:bg-orange-200 flex items-center justify-center transition-colors"
                    disabled={quantity >= maxQuantity}
                  >
                    <Plus className="w-5 h-5 text-orange-600" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleAddToCart}
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3 ${
                    isInCart(id)
                      ? "bg-green-600 hover:bg-green-700 text-white shadow-lg"
                      : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                  }`}
                  disabled={productData.inventory === 0}
                >
                  <ShoppingCart className="w-6 h-6" />
                  <span>
                    {isInCart(id)
                      ? `Đã có ${getItemQuantity(id)} trong giỏ - Thêm nữa?`
                      : "Thêm vào giỏ hàng"}
                  </span>
                </button>

                <button
                  onClick={handleBuyNow}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  disabled={productData.inventory === 0}
                >
                  🚀 Mua ngay - Giao trong 30 phút
                </button>
              </div>
            </div>

            {/* Description */}
            {productData.description && (
              <div className="bg-white rounded-3xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Mô tả món ăn
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {productData.description}
                </p>
              </div>
            )}

            {/* Nutrition & Info */}
            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Thông tin dinh dưỡng
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {productData.calories && (
                  <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-xl">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 font-bold text-sm">🔥</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {productData.calories} cal
                      </p>
                      <p className="text-sm text-gray-600">Calories</p>
                    </div>
                  </div>
                )}
                {productData.weight && (
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">
                        ⚖️
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {productData.weight}g
                      </p>
                      <p className="text-sm text-gray-600">Trọng lượng</p>
                    </div>
                  </div>
                )}
                {productData.shelfLife && (
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-xl">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-bold text-sm">
                        ⏰
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {productData.shelfLife}
                      </p>
                      <p className="text-sm text-gray-600">Hạn sử dụng</p>
                    </div>
                  </div>
                )}
                {productData.origin && (
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-xl">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-sm">
                        🌍
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {productData.origin}
                      </p>
                      <p className="text-sm text-gray-600">Xuất xứ</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
