import React, { useState } from "react";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import { restaurantApi } from "../../api/restaurantApi";
import toast from "react-hot-toast";
import AddressAutocomplete from "../../components/AddressAutocomplete";

const RestaurantModal = ({ isOpen, onClose, restaurant, mode = "view" }) => {
  const queryClient = useQueryClient();

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isCreateMode = mode === "create";

  // State cho address data
  const [addressData, setAddressData] = useState({
    address: "",
    city: "",
    district: "",
    ward: "",
  });

  const defaultFormValues = {
    restaurantName: "",
    ownerName: "",
    email: "",
    password: "",
    phone: "",
    cuisine: "",
    description: "",
    address: "",
    city: "",
    district: "",
    ward: "",
    status: "active",
    verified: false,
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm({
    defaultValues: restaurant
      ? {
          ...defaultFormValues,
          restaurantName: restaurant.restaurantName || "",
          ownerName: restaurant.ownerName || "",
          email: restaurant.email || "",
          phone: restaurant.phone || "",
          cuisine: restaurant.cuisine || "",
          description: restaurant.description || "",
          address: restaurant.address?.detail || "",
          city: restaurant.address?.city || "",
          district: restaurant.address?.district || "",
          ward: restaurant.address?.ward || "",
          status: restaurant.status || "active",
          verified: restaurant.verified || false,
        }
      : defaultFormValues,
  });

  // Reset form when restaurant changes or modal opens
  React.useEffect(() => {
    if (!isOpen) return;

    if (restaurant) {
      const newAddressData = {
        address: restaurant.address?.detail || "",
        city: restaurant.address?.city || "",
        district: restaurant.address?.district || "",
        ward: restaurant.address?.ward || "",
      };
      setAddressData(newAddressData);

      reset({
        ...defaultFormValues,
        restaurantName: restaurant.restaurantName || "",
        ownerName: restaurant.ownerName || "",
        email: restaurant.email || "",
        phone: restaurant.phone || "",
        cuisine: restaurant.cuisine || "",
        description: restaurant.description || "",
        address: restaurant.address?.detail || "",
        city: restaurant.address?.city || "",
        district: restaurant.address?.district || "",
        ward: restaurant.address?.ward || "",
        status: restaurant.status || "active",
        verified: restaurant.verified || false,
      });
    } else {
      setAddressData({
        address: "",
        city: "",
        district: "",
        ward: "",
      });
      reset(defaultFormValues);
    }
  }, [restaurant, reset, isOpen]);

  // Handlers cho address changes
  const handleProvinceChange = (value) => {
    setAddressData({
      ...addressData,
      city: value,
      district: "",
      ward: "",
    });
    setValue("city", value);
    setValue("district", "");
    setValue("ward", "");
  };

  const handleDistrictChange = (value) => {
    setAddressData({
      ...addressData,
      district: value,
      ward: "",
    });
    setValue("district", value);
    setValue("ward", "");
  };

  const handleWardChange = (value) => {
    setAddressData({
      ...addressData,
      ward: value,
    });
    setValue("ward", value);
  };

  if (!isOpen) return null;

  // Create mutation
  const createMutation = useMutation(
    (data) => restaurantApi.createRestaurant(data),
    {
      onSuccess: () => {
        toast.success("Tạo nhà hàng thành công!");
        queryClient.invalidateQueries("restaurants");
        queryClient.invalidateQueries("restaurantStats");
        onClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Tạo nhà hàng thất bại!");
      },
    }
  );

  // Update mutation
  const updateMutation = useMutation(
    (data) => restaurantApi.updateRestaurant(restaurant?._id, data),
    {
      onSuccess: () => {
        toast.success("Cập nhật nhà hàng thành công!");
        queryClient.invalidateQueries("restaurants");
        queryClient.invalidateQueries("restaurantStats");
        onClose();
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Cập nhật nhà hàng thất bại!"
        );
      },
    }
  );

  const onSubmit = (data) => {
    // Prepare data for API
    const submitData = {
      restaurantName: data.restaurantName,
      ownerName: data.ownerName,
      email: data.email,
      phone: data.phone,
      cuisine: data.cuisine || undefined,
      description: data.description || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      district: data.district || undefined,
      ward: data.ward || undefined,
      status: data.status,
      verified: data.verified || false,
    };

    // Only include password on create
    if (isCreateMode && data.password) {
      submitData.password = data.password;
    }

    if (isCreateMode) {
      createMutation.mutate(submitData);
    } else if (isEditMode) {
      updateMutation.mutate(submitData);
    }
  };

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {isViewMode && "Chi tiết nhà hàng"}
                {isEditMode && "Chỉnh sửa nhà hàng"}
                {isCreateMode && "Thêm nhà hàng mới"}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pt-5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Restaurant Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên nhà hàng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("restaurantName", {
                      required: "Tên nhà hàng là bắt buộc",
                    })}
                    disabled={isViewMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                  />
                  {errors.restaurantName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.restaurantName.message}
                    </p>
                  )}
                </div>

                {/* Owner Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên chủ sở hữu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("ownerName", {
                      required: "Tên chủ sở hữu là bắt buộc",
                    })}
                    disabled={isViewMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                  />
                  {errors.ownerName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.ownerName.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    {...register("email", {
                      required: "Email là bắt buộc",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Email không hợp lệ",
                      },
                    })}
                    disabled={isViewMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password (only for create) */}
                {isCreateMode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      {...register("password", {
                        required: isCreateMode && "Mật khẩu là bắt buộc",
                        minLength: {
                          value: 6,
                          message: "Mật khẩu phải có ít nhất 6 ký tự",
                        },
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    {...register("phone", {
                      required: "Số điện thoại là bắt buộc",
                    })}
                    disabled={isViewMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {/* Cuisine */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại hình ẩm thực
                  </label>
                  <select
                    {...register("cuisine")}
                    disabled={isViewMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                  >
                    <option value="">Chọn loại hình</option>
                    <option value="Việt Nam">Việt Nam</option>
                    <option value="Trung Quốc">Trung Quốc</option>
                    <option value="Nhật Bản">Nhật Bản</option>
                    <option value="Hàn Quốc">Hàn Quốc</option>
                    <option value="Thái Lan">Thái Lan</option>
                    <option value="Âu">Âu</option>
                    <option value="Fast Food">Fast Food</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                {/* Status */}
                {!isViewMode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trạng thái
                    </label>
                    <select
                      {...register("status")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="active">Đang hoạt động</option>
                      <option value="inactive">Ngừng hoạt động</option>
                      <option value="suspended">Bị khóa</option>
                    </select>
                  </div>
                )}

                {/* Verified */}
                {!isViewMode && (
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        {...register("verified")}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Đã xác minh
                      </span>
                    </label>
                  </div>
                )}

                {/* Address Section */}
                <div className="md:col-span-2">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">
                    Địa chỉ nhà hàng
                  </h4>
                </div>

                {/* Address Detail */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa chỉ chi tiết
                  </label>
                  <textarea
                    value={addressData.address}
                    onChange={(e) => {
                      setAddressData({
                        ...addressData,
                        address: e.target.value,
                      });
                      setValue("address", e.target.value);
                    }}
                    disabled={isViewMode}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                    placeholder="Số nhà, tên đường..."
                  />
                  <input
                    type="hidden"
                    {...register("address")}
                    value={addressData.address || ""}
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tỉnh/Thành phố
                  </label>
                  {isViewMode ? (
                    <input
                      type="text"
                      value={addressData.city || ""}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  ) : (
                    <AddressAutocomplete
                      type="province"
                      value={addressData.city || ""}
                      onChange={handleProvinceChange}
                      placeholder="Tỉnh/Thành phố"
                    />
                  )}
                  <input
                    type="hidden"
                    {...register("city")}
                    value={addressData.city || ""}
                  />
                </div>

                {/* District */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quận/Huyện
                  </label>
                  {isViewMode ? (
                    <input
                      type="text"
                      value={addressData.district || ""}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  ) : (
                    <AddressAutocomplete
                      type="district"
                      value={addressData.district || ""}
                      onChange={handleDistrictChange}
                      placeholder="Quận/Huyện"
                      selectedProvince={addressData.city}
                      disabled={!addressData.city || isViewMode}
                    />
                  )}
                  <input
                    type="hidden"
                    {...register("district")}
                    value={addressData.district || ""}
                  />
                </div>

                {/* Ward */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phường/Xã
                  </label>
                  {isViewMode ? (
                    <input
                      type="text"
                      value={addressData.ward || ""}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  ) : (
                    <AddressAutocomplete
                      type="ward"
                      value={addressData.ward || ""}
                      onChange={handleWardChange}
                      placeholder="Phường/Xã"
                      selectedProvince={addressData.city}
                      selectedDistrict={addressData.district}
                      disabled={!addressData.district || isViewMode}
                    />
                  )}
                  <input
                    type="hidden"
                    {...register("ward")}
                    value={addressData.ward || ""}
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    {...register("description")}
                    disabled={isViewMode}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            {!isViewMode && (
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isLoading || isSubmitting}
                  className="w-full inline-flex justify-center items-center gap-2 rounded-lg border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {isLoading
                    ? "Đang xử lý..."
                    : isCreateMode
                    ? "Tạo nhà hàng"
                    : "Cập nhật"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading || isSubmitting}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
              </div>
            )}

            {isViewMode && (
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:w-auto sm:text-sm transition-colors"
                >
                  Đóng
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default RestaurantModal;
