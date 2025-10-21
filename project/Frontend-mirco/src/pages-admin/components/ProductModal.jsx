import { X } from "lucide-react";

const ProductModal = ({ isOpen, onClose, product, mode = "view" }) => {
  if (!isOpen) return null;

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isCreateMode = mode === "create";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 px-6 py-4 border-b border-primary-200 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">
              {isViewMode && "Chi tiết sản phẩm"}
              {isEditMode && "Chỉnh sửa sản phẩm"}
              {isCreateMode && "Thêm sản phẩm mới"}
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/50 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {isViewMode && product && (
              <div className="space-y-4">
                {/* Image */}
                {product.images?.[0] && (
                  <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Tên sản phẩm
                    </label>
                    <p className="text-base font-semibold text-gray-900">
                      {product.title}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Giá
                    </label>
                    <p className="text-base font-semibold text-gray-900">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(product.price)}
                    </p>
                  </div>
                  {product.promotion && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Giá khuyến mãi
                      </label>
                      <p className="text-base font-semibold text-red-600">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(product.promotion)}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Kho
                    </label>
                    <p className="text-base font-semibold text-gray-900">
                      {product.inventory}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Đánh giá
                    </label>
                    <p className="text-base font-semibold text-gray-900">
                      ⭐ {product.ratingsAverage || 0} (
                      {product.ratingsQuantity || 0} reviews)
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Xuất xứ
                    </label>
                    <p className="text-base text-gray-900">{product.origin}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Mô tả
                  </label>
                  <p className="text-base text-gray-900 mt-1">
                    {product.description}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Thành phần
                  </label>
                  <p className="text-base text-gray-900 mt-1">
                    {product.ingredients}
                  </p>
                </div>
              </div>
            )}

            {(isEditMode || isCreateMode) && (
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên sản phẩm
                  </label>
                  <input
                    type="text"
                    defaultValue={product?.title}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Nhập tên sản phẩm..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá
                    </label>
                    <input
                      type="number"
                      defaultValue={product?.price}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá khuyến mãi
                    </label>
                    <input
                      type="number"
                      defaultValue={product?.promotion}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kho hàng
                  </label>
                  <input
                    type="number"
                    defaultValue={product?.inventory}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    defaultValue={product?.description}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Nhập mô tả sản phẩm..."
                  />
                </div>

                <div className="text-center text-sm text-gray-500 py-4 border-2 border-dashed border-gray-300 rounded-lg">
                  Tính năng lưu dữ liệu đang được phát triển
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
            >
              {isViewMode ? "Đóng" : "Hủy"}
            </button>
            {!isViewMode && (
              <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
                {isEditMode ? "Lưu thay đổi" : "Tạo sản phẩm"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
