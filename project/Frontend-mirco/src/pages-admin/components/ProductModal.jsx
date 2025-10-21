import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import { productApi } from "../../api";
import toast from "react-hot-toast";

const ProductModal = ({ isOpen, onClose, product, mode = "view" }) => {
  const queryClient = useQueryClient();

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isCreateMode = mode === "create";

  const defaultFormValues = {
    title: "",
    price: "",
    promotion: "",
    inventory: "",
    origin: "",
    images: "",
    description: "",
    ingredients: "",
    weight: "",
    shelfLife: "",
    storage: "",
    calories: "",
    allergen: "",
    nutrition: "",
    demand: "Trung bình",
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: product
      ? { ...defaultFormValues, ...product }
      : defaultFormValues,
  });

  if (!isOpen) return null;

  // Create mutation
  const createMutation = useMutation((data) => productApi.createProduct(data), {
    onSuccess: () => {
      toast.success("Tạo sản phẩm thành công!");
      queryClient.invalidateQueries("allProducts");
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Tạo sản phẩm thất bại!");
    },
  });

  // Update mutation
  const updateMutation = useMutation(
    (data) => productApi.updateProduct(product?._id, data),
    {
      onSuccess: () => {
        toast.success("Cập nhật sản phẩm thành công!");
        queryClient.invalidateQueries("allProducts");
        onClose();
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Cập nhật sản phẩm thất bại!"
        );
      },
    }
  );

  const onSubmit = (data) => {
    // Convert images string to array if provided
    if (data.images && typeof data.images === "string") {
      data.images = [data.images.trim()];
    }

    // Convert numeric fields
    data.price = Number(data.price);
    data.promotion = data.promotion ? Number(data.promotion) : undefined;
    data.inventory = Number(data.inventory);
    data.weight = data.weight ? Number(data.weight) : undefined;
    data.calories = data.calories ? Number(data.calories) : undefined;

    if (isCreateMode) {
      createMutation.mutate(data);
    } else if (isEditMode) {
      updateMutation.mutate(data);
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
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên sản phẩm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("title", {
                      required: "Tên sản phẩm là bắt buộc",
                    })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                      errors.title ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Nhập tên sản phẩm..."
                  />
                  {errors.title && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      {...register("price", {
                        required: "Giá là bắt buộc",
                        min: 0,
                      })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                        errors.price ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="0"
                    />
                    {errors.price && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.price.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá khuyến mãi
                    </label>
                    <input
                      type="number"
                      {...register("promotion", { min: 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kho hàng <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      {...register("inventory", {
                        required: "Kho hàng là bắt buộc",
                        min: 0,
                      })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                        errors.inventory ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="0"
                    />
                    {errors.inventory && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.inventory.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Xuất xứ
                    </label>
                    <input
                      type="text"
                      {...register("origin")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Việt Nam"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link ảnh sản phẩm
                  </label>
                  <input
                    type="text"
                    {...register("images")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Nhập URL hình ảnh sản phẩm
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register("description", {
                      required: "Mô tả là bắt buộc",
                    })}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                      errors.description ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Nhập mô tả sản phẩm..."
                  />
                  {errors.description && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thành phần
                  </label>
                  <textarea
                    {...register("ingredients")}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Thịt gà, bột chiên, gia vị..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Khối lượng (kg)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("weight")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hạn sử dụng
                    </label>
                    <input
                      type="text"
                      {...register("shelfLife")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="1 ngày"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bảo quản
                    </label>
                    <input
                      type="text"
                      {...register("storage")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Nóng"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Calories
                    </label>
                    <input
                      type="number"
                      {...register("calories")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chất gây dị ứng
                    </label>
                    <input
                      type="text"
                      {...register("allergen")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Gluten, Sữa..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dinh dưỡng
                  </label>
                  <input
                    type="text"
                    {...register("nutrition")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Protein: 30g, Carb: 20g, Fat: 15g"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mức độ phổ biến
                  </label>
                  <select
                    {...register("demand")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Thấp">Thấp</option>
                    <option value="Trung bình">Trung bình</option>
                    <option value="Cao">Cao</option>
                  </select>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isViewMode ? "Đóng" : "Hủy"}
            </button>
            {!isViewMode && (
              <button
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
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
