import { useState, useEffect } from "react";
import { useMutation } from "react-query";
import { X, Upload, Package, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

const ProductModal = ({ product, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    promotion: "",
    category: "",
    stock: "",
    images: [],
    status: "active",
  });
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title || "",
        description: product.description || "",
        price: product.price || "",
        promotion: product.promotion || "",
        category: product.category?.name || "",
        stock: product.stock || "",
        images: product.images || [],
        status: product.status || "active",
      });
      if (product.images?.[0]) {
        setImagePreview(product.images[0]);
      }
    }
  }, [product]);

  // TODO: Replace with actual API call
  const saveProductMutation = useMutation(
    async (data) => {
      const url = product
        ? `http://localhost:3002/api/products/${product._id}`
        : "http://localhost:3002/api/products";
      const method = product ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("restaurant_token")}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Lưu thất bại");
      return response.json();
    },
    {
      onSuccess: () => {
        toast.success(
          product ? "Cập nhật món ăn thành công!" : "Thêm món ăn thành công!"
        );
        onSuccess();
      },
      onError: () => {
        toast.error("Lưu thất bại!");
      },
    }
  );

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Vui lòng nhập tên món ăn";
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = "Vui lòng nhập giá hợp lệ";
    }

    if (!formData.category) {
      newErrors.category = "Vui lòng chọn danh mục";
    }

    if (!formData.stock || formData.stock < 0) {
      newErrors.stock = "Vui lòng nhập số lượng hợp lệ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      saveProductMutation.mutate({
        ...formData,
        price: Number(formData.price),
        promotion: formData.promotion ? Number(formData.promotion) : null,
        stock: Number(formData.stock),
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // TODO: Upload to server and get URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData((prev) => ({
          ...prev,
          images: [reader.result],
        }));
      };
      reader.readAsDataURL(file);
    }
  };

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
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-orange-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {product ? "Chỉnh sửa món ăn" : "Thêm món ăn mới"}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hình ảnh món ăn
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-32 h-32 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-16 w-16 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <label className="bg-orange-50 hover:bg-orange-100 text-orange-600 px-4 py-2 rounded-lg cursor-pointer transition-colors flex items-center space-x-2">
                      <Upload className="h-5 w-5" />
                      <span>Tải lên hình ảnh</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      PNG, JPG tối đa 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên món ăn *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 ${
                    errors.title ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Phở Bò, Bánh Mì..."
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Mô tả về món ăn..."
                ></textarea>
              </div>

              {/* Price & Promotion */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá gốc (VNĐ) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 ${
                      errors.price ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="50000"
                    min="0"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.price}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá khuyến mãi (VNĐ)
                  </label>
                  <input
                    type="number"
                    name="promotion"
                    value={formData.promotion}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="45000"
                    min="0"
                  />
                </div>
              </div>

              {/* Category & Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Danh mục *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 cursor-pointer ${
                      errors.category ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Chọn danh mục</option>
                    <option value="Món Việt">Món Việt</option>
                    <option value="Món ăn nhanh">Món ăn nhanh</option>
                    <option value="Đồ uống">Đồ uống</option>
                    <option value="Tráng miệng">Tráng miệng</option>
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.category}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số lượng trong kho *
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 ${
                      errors.stock ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="100"
                    min="0"
                  />
                  {errors.stock && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.stock}
                    </p>
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 cursor-pointer"
                >
                  <option value="active">Đang bán</option>
                  <option value="inactive">Tạm ngưng</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saveProductMutation.isLoading}
                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {saveProductMutation.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <span>{product ? "Cập nhật" : "Thêm món"}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;


