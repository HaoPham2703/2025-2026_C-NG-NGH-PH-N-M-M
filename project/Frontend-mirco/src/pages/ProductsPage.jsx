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

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

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
        page: currentPage,
        limit,
        ...(searchTerm && { search: searchTerm }),
        ...(sortBy && { sort: sortOrder === "desc" ? `-${sortBy}` : sortBy }),
      }),
    {
      refetchOnWindowFocus: false,
      retry: 1,
      enabled: true,
    }
  );

  // Get pagination info from API
  const totalPages = products?.totalPages || 1;
  const total = products?.total || 0;

  // Sử dụng topProducts làm fallback nếu products có lỗi
  const allProducts =
    products?.data?.products || topProducts?.data?.products || [];

  // Filter products based on filter options (frontend filtering)
  const filteredProducts = allProducts.filter((product) => {
    // Search filter (handled by backend, but keep for consistency)
    const matchesSearch =
      searchTerm === "" ||
      product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());

    // Category filter
    const productCategory = product.category?.name || product.category;
    const matchesCategory =
      categoryFilter === "all" || productCategory === categoryFilter;

    // Price range filter
    const price = Number(product.price) || 0;
    const minOk = priceMin === "" || price >= Number(priceMin);
    const maxOk = priceMax === "" || price <= Number(priceMax);

    // Rating filter
    const rating = product.ratingsAverage || 0;
    const matchesRating =
      ratingFilter === "all" ||
      (ratingFilter === "4+" && rating >= 4) ||
      (ratingFilter === "3+" && rating >= 3) ||
      (ratingFilter === "2+" && rating >= 2) ||
      (ratingFilter === "1+" && rating >= 1);

    // Availability filter (based on inventory, promotion, or creation date)
    const matchesAvailability =
      availabilityFilter === "all" ||
      (availabilityFilter === "in_stock" && (product.inventory ?? 0) > 0) ||
      (availabilityFilter === "on_sale" &&
        product.promotion &&
        product.promotion < product.price) ||
      (availabilityFilter === "new" &&
        new Date(product.createdAt) >
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // Last 7 days

    return (
      matchesSearch &&
      matchesCategory &&
      minOk &&
      maxOk &&
      matchesRating &&
      matchesAvailability
    );
  });

  // Sort filtered products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price") {
      return sortOrder === "desc"
        ? (b.price || 0) - (a.price || 0)
        : (a.price || 0) - (b.price || 0);
    }
    if (sortBy === "ratingsAverage") {
      return sortOrder === "desc"
        ? (b.ratingsAverage || 0) - (a.ratingsAverage || 0)
        : (a.ratingsAverage || 0) - (b.ratingsAverage || 0);
    }
    if (sortBy === "createdAt") {
      return sortOrder === "desc"
        ? new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        : new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    }
    return 0;
  });

  const displayProducts = sortedProducts;

  // Debug log để kiểm tra dữ liệu
  console.log("🔍 ProductsPage Debug:", {
    allProducts: allProducts?.length || 0,
    filteredProducts: filteredProducts?.length || 0,
    displayProducts: displayProducts?.length || 0,
    filters: {
      categoryFilter,
      priceMin,
      priceMax,
      ratingFilter,
      availabilityFilter,
      searchTerm,
    },
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

  const handleClearFilters = () => {
    setCategoryFilter("all");
    setPriceMin("");
    setPriceMax("");
    setRatingFilter("all");
    setAvailabilityFilter("all");
    setCurrentPage(1);
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, priceMin, priceMax, ratingFilter, availabilityFilter]);

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
            <div className="flex items-center space-x-4">
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
                    Xóa tìm kiếm
                  </button>
                </div>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden btn-secondary flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Bộ lọc</span>
              </button>
            </div>
          </div>

          {/* Search and Sort */}
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

        {/* Content with Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filter Sidebar */}
          <aside
            className={`lg:col-span-1 space-y-4 ${
              showFilters ? "block" : "hidden lg:block"
            }`}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowFilters(false);
              }
            }}
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 relative">
              {/* Mobile Close Button */}
              <button
                onClick={() => setShowFilters(false)}
                className="lg:hidden absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
              <h4 className="font-semibold text-gray-900 mb-3">Danh mục</h4>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 cursor-pointer"
              >
                <option value="all">Tất cả danh mục</option>
                <option value="Món Việt">Món Việt</option>
                <option value="Món ăn nhanh">Món ăn nhanh</option>
                <option value="Đồ uống">Đồ uống</option>
                <option value="Tráng miệng">Tráng miệng</option>
                <option value="Món chay">Món chay</option>
                <option value="Món nướng">Món nướng</option>
              </select>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3">
                Khoảng giá (VND)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Tối thiểu"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  min="0"
                />
                <input
                  type="number"
                  placeholder="Tối đa"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  min="0"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Đánh giá</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="rating"
                    checked={ratingFilter === "all"}
                    onChange={() => setRatingFilter("all")}
                  />
                  <span>Tất cả</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="rating"
                    checked={ratingFilter === "4+"}
                    onChange={() => setRatingFilter("4+")}
                  />
                  <div className="flex items-center">
                    {[...Array(4)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 text-yellow-400 fill-current"
                      />
                    ))}
                    <span className="ml-1">trở lên</span>
                  </div>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="rating"
                    checked={ratingFilter === "3+"}
                    onChange={() => setRatingFilter("3+")}
                  />
                  <div className="flex items-center">
                    {[...Array(3)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 text-yellow-400 fill-current"
                      />
                    ))}
                    <span className="ml-1">trở lên</span>
                  </div>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="rating"
                    checked={ratingFilter === "2+"}
                    onChange={() => setRatingFilter("2+")}
                  />
                  <div className="flex items-center">
                    {[...Array(2)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 text-yellow-400 fill-current"
                      />
                    ))}
                    <span className="ml-1">trở lên</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Tình trạng</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="availability"
                    checked={availabilityFilter === "all"}
                    onChange={() => setAvailabilityFilter("all")}
                  />
                  <span>Tất cả</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="availability"
                    checked={availabilityFilter === "in_stock"}
                    onChange={() => setAvailabilityFilter("in_stock")}
                  />
                  <span>Còn hàng</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="availability"
                    checked={availabilityFilter === "on_sale"}
                    onChange={() => setAvailabilityFilter("on_sale")}
                  />
                  <span>Đang giảm giá</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="availability"
                    checked={availabilityFilter === "new"}
                    onChange={() => setAvailabilityFilter("new")}
                  />
                  <span>Mới</span>
                </label>
              </div>
            </div>

            <button
              onClick={handleClearFilters}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              Đặt lại bộ lọc
            </button>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Results Info */}
            <div className="mb-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Hiển thị {displayProducts?.length || 0} sản phẩm
                {searchTerm && (
                  <span className="ml-2">
                    cho từ khóa "
                    <span className="font-semibold text-orange-600">
                      {searchTerm}
                    </span>
                    "
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {categoryFilter !== "all" && `Danh mục: ${categoryFilter}`}
                {priceMin && ` • Từ ${Number(priceMin).toLocaleString()}đ`}
                {priceMax && ` • Đến ${Number(priceMax).toLocaleString()}đ`}
                {ratingFilter !== "all" && ` • ${ratingFilter} sao`}
                {availabilityFilter !== "all" &&
                  ` • ${
                    availabilityFilter === "in_stock"
                      ? "Còn hàng"
                      : availabilityFilter === "on_sale"
                      ? "Đang giảm giá"
                      : "Mới"
                  }`}
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
                          Thêm
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
                {displayProducts?.length > 0 && totalPages > 1 && (
                  <div className="mt-12 flex flex-col items-center">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Trước
                      </button>

                      {/* Page Numbers */}
                      <div className="flex items-center space-x-1">
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              // Show all pages if 5 or less
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              // Show first 5 pages
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              // Show last 5 pages
                              pageNum = totalPages - 4 + i;
                            } else {
                              // Show pages around current page
                              pageNum = currentPage - 2 + i;
                            }

                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                  currentPage === pageNum
                                    ? "bg-primary-600 text-white"
                                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                        )}
                      </div>

                      <button
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage >= totalPages}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Sau
                      </button>
                    </div>
                    <div className="mt-4 text-sm text-gray-600">
                      Trang {currentPage} / {totalPages} ({total} sản phẩm)
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
