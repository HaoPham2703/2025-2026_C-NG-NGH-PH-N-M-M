import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { productApi } from "../api/productApi";
import { Package, Search, Plus, Edit, Trash2, Eye } from "lucide-react";
import ProductModal from "./components/ProductModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import Pagination from "./components/Pagination";
import toast from "react-hot-toast";

const ProductsManagementPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'view', 'edit', 'create'
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const { data: products, isLoading } = useQuery("allProducts", () =>
    productApi.getProducts()
  );

  const handleView = (product) => {
    setSelectedProduct(product);
    setModalMode("view");
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setModalMode("edit");
  };

  const handleCreate = () => {
    setSelectedProduct(null);
    setModalMode("create");
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  // Delete mutation
  const deleteMutation = useMutation(
    (productId) => productApi.deleteProduct(productId),
    {
      onSuccess: () => {
        toast.success("Xóa sản phẩm thành công!");
        queryClient.invalidateQueries("allProducts");
        setShowDeleteModal(false);
        setProductToDelete(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Xóa sản phẩm thất bại!");
      },
    }
  );

  const handleDeleteConfirm = () => {
    if (productToDelete) {
      deleteMutation.mutate(productToDelete._id);
    }
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setModalMode(null);
  };

  const filteredProducts = products?.data?.products?.filter((product) =>
    product.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil((filteredProducts?.length || 0) / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredProducts?.slice(start, end);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Reset to page 1 when filter changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý sản phẩm</h2>
          <p className="text-sm text-gray-600 mt-1">
            Tổng số: {products?.data?.products?.length || 0} sản phẩm
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
            />
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Thêm sản phẩm</span>
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {paginatedProducts?.map((product) => (
          <div
            key={product._id}
            className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:border-primary-200 group"
          >
            {/* Product Image */}
            <div className="relative h-48 bg-gray-100 overflow-hidden">
              {product.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-16 h-16 text-gray-300" />
                </div>
              )}
              {product.promotion && (
                <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                  -
                  {Math.round(
                    ((product.price - product.promotion) / product.price) * 100
                  )}
                  %
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2 truncate">
                {product.title}
              </h3>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                {product.description}
              </p>

              {/* Price */}
              <div className="mb-3">
                {product.promotion ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary-600">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(product.promotion)}
                    </span>
                    <span className="text-sm text-gray-400 line-through">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(product.price)}
                    </span>
                  </div>
                ) : (
                  <span className="text-lg font-bold text-primary-600">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(product.price)}
                  </span>
                )}
              </div>

              {/* Meta Info */}
              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Package size={14} />
                  <span>Kho: {product.inventory}</span>
                </div>
                <div className="flex items-center gap-1">
                  ⭐ {product.ratingsAverage || 0} (
                  {product.ratingsQuantity || 0})
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleView(product)}
                  className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Eye size={16} />
                  <span className="text-xs font-medium">Xem</span>
                </button>
                <button
                  onClick={() => handleEdit(product)}
                  className="flex-1 px-3 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Edit size={16} />
                  <span className="text-xs font-medium">Sửa</span>
                </button>
                <button
                  onClick={() => handleDeleteClick(product)}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {filteredProducts && filteredProducts.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredProducts.length}
          itemsPerPage={itemsPerPage}
        />
      )}

      {/* Empty State */}
      {filteredProducts?.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Không tìm thấy sản phẩm
          </h3>
          <p className="text-gray-600">
            {searchTerm
              ? `Không có sản phẩm nào khớp với "${searchTerm}"`
              : "Chưa có sản phẩm nào trong hệ thống"}
          </p>
        </div>
      )}

      {/* Modals */}
      <ProductModal
        key={`${modalMode}-${selectedProduct?._id || "new"}`}
        isOpen={modalMode !== null}
        onClose={closeModal}
        product={selectedProduct}
        mode={modalMode}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        itemName={productToDelete?.title}
        itemType="sản phẩm"
        isLoading={deleteMutation.isLoading}
      />
    </div>
  );
};

export default ProductsManagementPage;
