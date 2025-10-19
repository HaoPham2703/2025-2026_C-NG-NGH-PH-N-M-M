import { useState, useEffect } from "react";
import { useQuery } from "react-query";
import { Link, useSearchParams } from "react-router-dom";
import { productApi } from "../api/productApi";
import { Search, Filter, Star, ShoppingCart } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import toast from "react-hot-toast";
import Breadcrumb from "../components/Breadcrumb";
import "../styles/ProductsPage.css";

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const { addToCart } = useCart();

  // Đọc search term từ URL params
  useEffect(() => {
    const urlSearchTerm = searchParams.get("search");
    if (urlSearchTerm) {
      setSearchTerm(urlSearchTerm);
    }
  }, [searchParams]);

  // Thử sử dụng endpoint đơn giản như HomePage trước
  const { data: topProducts } = useQuery(
    "topProducts",
    productApi.getTopProducts,
    {
      refetchOnWindowFocus: false,
    }
  );

  const {
    data: products,
    isLoading,
    error,
  } = useQuery(
    ["products", searchTerm, sortBy, sortOrder, currentPage, limit],
    () =>
      productApi.getProducts({
        // Đơn giản hóa params để tránh lỗi
        page: currentPage,
        limit,
        ...(searchTerm && { search: searchTerm }),
        ...(sortBy && { sort: sortOrder === "desc" ? `-${sortBy}` : sortBy }),
      }),
    {
      refetchOnWindowFocus: false,
      retry: 1, // Thêm retry để xử lý lỗi
      enabled: true, // Luôn chạy
    }
  );

  // Sử dụng topProducts làm fallback nếu products có lỗi
  const displayProducts =
    products?.data?.products || topProducts?.data?.products || [];

  // Debug log để kiểm tra dữ liệu
  console.log("🔍 ProductsPage Debug:", {
    products: products?.data?.products?.length || 0,
    topProducts: topProducts?.data?.products?.length || 0,
    displayProducts: displayProducts?.length || 0,
    error: error?.message,
    isLoading,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    // Cập nhật URL params với search term
    if (searchTerm.trim()) {
      setSearchParams({ search: searchTerm.trim() });
    } else {
      setSearchParams({});
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchParams({});
    setCurrentPage(1);
  };

  const handleAddToCart = (e, product) => {
    e.preventDefault(); // Prevent navigation to product detail
    e.stopPropagation(); // Stop event bubbling
    addToCart(product);
    toast.success(`${product.title} đã được thêm vào giỏ hàng!`);
  };

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Lỗi tải sản phẩm
          </h2>
          <p className="text-gray-600">Vui lòng thử lại sau</p>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: "Trang Chủ", path: "/" },
    { label: "Sản Phẩm", path: "/products" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb items={breadcrumbItems} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Sản Phẩm</h1>
            {searchTerm && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  Kết quả tìm kiếm cho:{" "}
                  <span className="font-semibold text-orange-600">
                    "{searchTerm}"
                  </span>
                </span>
                <button
                  onClick={handleClearSearch}
                  className="text-sm text-orange-600 hover:text-orange-800 font-medium"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Tìm kiếm sản phẩm..."
                />
              </div>
            </form>

            <div className="flex gap-2">
              <button
                onClick={() => handleSortChange("price")}
                className={`btn-secondary ${
                  sortBy === "price" ? "bg-primary-100 text-primary-700" : ""
                }`}
              >
                Giá {sortBy === "price" && (sortOrder === "desc" ? "↓" : "↑")}
              </button>
              <button
                onClick={() => handleSortChange("ratingsAverage")}
                className={`btn-secondary ${
                  sortBy === "ratingsAverage"
                    ? "bg-primary-100 text-primary-700"
                    : ""
                }`}
              >
                Đánh giá{" "}
                {sortBy === "ratingsAverage" &&
                  (sortOrder === "desc" ? "↓" : "↑")}
              </button>
              <button
                onClick={() => handleSortChange("createdAt")}
                className={`btn-secondary ${
                  sortBy === "createdAt"
                    ? "bg-primary-100 text-primary-700"
                    : ""
                }`}
              >
                Mới nhất{" "}
                {sortBy === "createdAt" && (sortOrder === "desc" ? "↓" : "↑")}
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-48 bg-gray-300 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayProducts?.map((product) => (
                <Link
                  key={product._id}
                  to={`/products/${product._id}`}
                  className="product-card block hover:shadow-lg transition-all duration-300"
                >
                  <div className="product-image">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.title} />
                    ) : (
                      <div className="product-placeholder">
                        <span>No Image</span>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2 line-clamp-2">
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

                    {product.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {product.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      {product.promotion ? (
                        <>
                          <span className="text-sm text-gray-500 line-through">
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(product.price)}
                          </span>
                          <span className="text-lg font-bold text-primary-600">
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(product.promotion)}
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

                    <button
                      onClick={(e) => handleAddToCart(e, product)}
                      className="btn-primary text-sm hover:bg-primary-700 transition-colors duration-200"
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Thêm vào giỏ
                    </button>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {displayProducts?.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Không tìm thấy sản phẩm
                </h3>
                <p className="text-gray-600">
                  Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
                </p>
              </div>
            )}

            {/* Pagination Controls */}
            {displayProducts?.length > 0 && (
              <div className="mt-12 flex justify-center">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>

                  <span className="px-4 py-2 text-sm text-gray-700">
                    Trang {currentPage}
                  </span>

                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={displayProducts?.length < limit}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
