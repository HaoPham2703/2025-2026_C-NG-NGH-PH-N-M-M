import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { restaurantClient } from "../api/axiosClients";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Filter,
  MoreVertical,
  Package,
} from "lucide-react";
import toast from "react-hot-toast";
import ProductModal from "./components/ProductModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";

const ProductsManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [stockFilter, setStockFilter] = useState("all"); // all | in_stock | out_of_stock
  const [sortOption, setSortOption] = useState("newest"); // newest | price_asc | price_desc | sold_desc
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const queryClient = useQueryClient();

  // Fetch products scoped to current restaurant
  const { data: products, isLoading } = useQuery(
    "restaurantProducts",
    async () => {
      const res = await restaurantClient.get("/restaurant/menu");
      // restaurantClient returns response.data, which has shape:
      // { status, results, data: { menuItems, pagination } }
      return res?.data?.menuItems || [];
    }
  );

  const deleteProductMutation = useMutation(
    async (productId) => {
      return restaurantClient.delete(`/restaurant/menu/${productId}`);
    },
    {
      onSuccess: () => {
        toast.success("Đã xóa món ăn!");
        queryClient.invalidateQueries("restaurantProducts");
        setShowDeleteModal(false);
        setProductToDelete(null);
      },
      onError: () => {
        toast.error("Xóa thất bại!");
      },
    }
  );

  const filteredProducts = products
    ?.filter((product) => {
      const matchesSearch =
        product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const productCategory = product.category?.name || product.category;
      const matchesCategory =
        categoryFilter === "all" || productCategory === categoryFilter;

      const matchesStatus =
        statusFilter === "all" || product.status === statusFilter;

      const price = Number(product.price) || 0;
      const minOk = priceMin === "" || price >= Number(priceMin);
      const maxOk = priceMax === "" || price <= Number(priceMax);

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "in_stock" && (product.stock ?? 0) > 0) ||
        (stockFilter === "out_of_stock" && (product.stock ?? 0) === 0);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus &&
        minOk &&
        maxOk &&
        matchesStock
      );
    })
    ?.slice()
    ?.sort((a, b) => {
      if (sortOption === "price_asc") return (a.price || 0) - (b.price || 0);
      if (sortOption === "price_desc") return (b.price || 0) - (a.price || 0);
      if (sortOption === "sold_desc") return (b.sold || 0) - (a.sold || 0);
      // newest: fall back to createdAt or _id as heuristic
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    });

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    deleteProductMutation.mutate(productToDelete._id);
  };

  const getStatusBadge = (status, stock) => {
    if (stock === 0)
      return { label: "Hết hàng", color: "bg-red-100 text-red-800" };
    if (status === "active")
      return { label: "Đang bán", color: "bg-green-100 text-green-800" };
    return { label: "Tạm ngưng", color: "bg-gray-100 text-gray-800" };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý món ăn</h2>
          <p className="text-sm text-gray-600 mt-1">
            Hiển thị {filteredProducts?.length || 0} / {products?.length || 0}{" "}
            món ăn
          </p>
        </div>
        <button
          onClick={handleAddProduct}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Thêm món mới</span>
        </button>
      </div>
      {/* Content with Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm món ăn..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
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
            </select>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Trạng thái</h4>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 cursor-pointer"
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang bán</option>
              <option value="inactive">Tạm ngưng</option>
            </select>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Kho hàng</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="stock"
                  checked={stockFilter === "all"}
                  onChange={() => setStockFilter("all")}
                />
                <span>Tất cả</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="stock"
                  checked={stockFilter === "in_stock"}
                  onChange={() => setStockFilter("in_stock")}
                />
                <span>Còn hàng</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="stock"
                  checked={stockFilter === "out_of_stock"}
                  onChange={() => setStockFilter("out_of_stock")}
                />
                <span>Hết hàng</span>
              </label>
            </div>
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
            <h4 className="font-semibold text-gray-900 mb-3">Sắp xếp</h4>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 cursor-pointer"
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
              <option value="sold_desc">Bán chạy</option>
            </select>
          </div>

          <button
            onClick={() => {
              setSearchTerm("");
              setCategoryFilter("all");
              setStatusFilter("all");
              setPriceMin("");
              setPriceMax("");
              setStockFilter("all");
              setSortOption("newest");
            }}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            Đặt lại bộ lọc
          </button>
        </aside>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts?.map((product) => {
              const statusBadge = getStatusBadge(product.status, product.stock);
              return (
                <div
                  key={product._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Product Image */}
                  <div className="relative h-48 bg-gray-100">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${statusBadge.color}`}
                      >
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                      {product.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-orange-600">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(product.price)}
                      </span>
                      <span className="text-sm text-gray-500">
                        Đã bán: {product.sold}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <span>Kho: {product.stock}</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {product.category?.name || product.category}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-600 py-2 rounded-lg transition-colors flex items-center justify-center space-x-1"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Sửa</span>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(product)}
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg transition-colors flex items-center justify-center space-x-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredProducts?.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Không tìm thấy món ăn
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || categoryFilter !== "all" || statusFilter !== "all"
              ? "Không có món ăn nào khớp với bộ lọc"
              : "Chưa có món ăn nào trong thực đơn"}
          </p>
          <button
            onClick={handleAddProduct}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Thêm món đầu tiên
          </button>
        </div>
      )}

      {/* Modals */}
      {showProductModal && (
        <ProductModal
          product={selectedProduct}
          onClose={() => {
            setShowProductModal(false);
            setSelectedProduct(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries("restaurantProducts");
            setShowProductModal(false);
            setSelectedProduct(null);
          }}
        />
      )}

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setProductToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        itemName={productToDelete?.title}
        itemType="món ăn"
      />
    </div>
  );
};

export default ProductsManagementPage;
