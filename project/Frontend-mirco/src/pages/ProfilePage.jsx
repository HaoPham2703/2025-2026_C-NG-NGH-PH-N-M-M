import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  Save,
  X,
  Calendar,
  Trash2,
  Star,
  Plus,
} from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";

const ProfilePage = () => {
  const {
    user,
    updateProfile,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [newAddress, setNewAddress] = useState({
    name: "",
    phone: "",
    province: "",
    district: "",
    ward: "",
    detail: "",
  });
  const [editingAddress, setEditingAddress] = useState({
    name: "",
    phone: "",
    province: "",
    district: "",
    ward: "",
    detail: "",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      gender: user?.gender || "",
      dateOfBirth: user?.dateOfBirth || "",
    },
  });

  const onSubmit = async (data) => {
    try {
      const result = await updateProfile(data);
      if (result.success) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Update profile error:", error);
    }
  };

  const handleAddAddress = async () => {
    // Validate required fields
    if (
      !newAddress.name ||
      !newAddress.phone ||
      !newAddress.province ||
      !newAddress.district ||
      !newAddress.ward ||
      !newAddress.detail
    ) {
      alert("Vui lòng điền đầy đủ thông tin địa chỉ");
      return;
    }

    try {
      const result = await createAddress(newAddress);
      if (result.success) {
        setNewAddress({
          name: "",
          phone: "",
          province: "",
          district: "",
          ward: "",
          detail: "",
        });
        setIsEditingAddress(false);
      }
    } catch (error) {
      console.error("Add address error:", error);
    }
  };

  const handleEditAddress = (address, index) => {
    setIsEditingAddress(false); // Close add form if open
    setEditingAddressId(index); // Store index instead of addressId
    setEditingAddress({
      name: address.name || "",
      phone: address.phone || "",
      province: address.province || "",
      district: address.district || "",
      ward: address.ward || "",
      detail: address.detail || "",
    });
  };

  const handleUpdateAddress = async () => {
    // Validate required fields
    if (
      !editingAddress.name ||
      !editingAddress.phone ||
      !editingAddress.province ||
      !editingAddress.district ||
      !editingAddress.ward ||
      !editingAddress.detail
    ) {
      alert("Vui lòng điền đầy đủ thông tin địa chỉ");
      return;
    }

    try {
      const result = await updateAddress({
        id: editingAddressId, // Backend expects 'id' (index), not 'addressId'
        ...editingAddress,
      });
      if (result.success) {
        setEditingAddressId(null);
        setEditingAddress({
          name: "",
          phone: "",
          province: "",
          district: "",
          ward: "",
          detail: "",
        });
      }
    } catch (error) {
      console.error("Update address error:", error);
    }
  };

  const handleDeleteAddress = async (index) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) {
      return;
    }

    try {
      await deleteAddress(index);
    } catch (error) {
      console.error("Delete address error:", error);
    }
  };

  const handleSetDefaultAddress = async (index) => {
    try {
      await setDefaultAddress(index);
    } catch (error) {
      console.error("Set default address error:", error);
    }
  };

  const cancelEditAddress = () => {
    setEditingAddressId(null);
    setEditingAddress({
      name: "",
      phone: "",
      province: "",
      district: "",
      ward: "",
      detail: "",
    });
  };

  const breadcrumbItems = [
    { label: "Trang Chủ", path: "/" },
    { label: "Hồ Sơ Cá Nhân", path: "/profile" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Breadcrumb items={breadcrumbItems} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Hồ Sơ Cá Nhân
          </h1>
          <p className="text-gray-600 text-lg">
            Quản lý thông tin cá nhân và địa chỉ giao hàng
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  Thông tin cá nhân
                </h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  {isEditing ? (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      Hủy
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Chỉnh sửa
                    </>
                  )}
                </button>
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Họ và tên
                      </label>
                      <input
                        {...register("name", {
                          required: "Họ và tên là bắt buộc",
                        })}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      />
                      {errors.name && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={user?.email}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Email không thể thay đổi
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Số điện thoại
                      </label>
                      <input
                        {...register("phone")}
                        type="tel"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Giới tính
                      </label>
                      <select
                        {...register("gender")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Chọn giới tính</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Ngày sinh
                      </label>
                      <input
                        {...register("dateOfBirth")}
                        type="date"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex items-center px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Lưu thay đổi
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center space-x-5 pb-6 border-b border-gray-200">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
                      <User className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {user?.name}
                      </h3>
                      <p className="text-gray-600 mt-1">{user?.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Mail className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Email
                        </p>
                        <p className="font-semibold text-gray-900 mt-1">
                          {user?.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Phone className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Số điện thoại
                        </p>
                        <p className="font-semibold text-gray-900 mt-1">
                          {user?.phone || "Chưa cập nhật"}
                        </p>
                      </div>
                    </div>

                    {user?.gender && (
                      <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <User className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Giới tính
                          </p>
                          <p className="font-semibold text-gray-900 mt-1">
                            {user.gender === "male"
                              ? "Nam"
                              : user.gender === "female"
                              ? "Nữ"
                              : "Khác"}
                          </p>
                        </div>
                      </div>
                    )}

                    {user?.dateOfBirth && (
                      <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <Calendar className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Ngày sinh
                          </p>
                          <p className="font-semibold text-gray-900 mt-1">
                            {user.dateOfBirth}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Addresses */}
          <div>
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  Địa chỉ giao hàng
                </h2>
                <button
                  onClick={() => {
                    if (isEditingAddress) {
                      setIsEditingAddress(false);
                    } else {
                      setEditingAddressId(null); // Close any editing address
                      setIsEditingAddress(true);
                    }
                  }}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors duration-200"
                >
                  {isEditingAddress ? (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      Hủy
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Thêm địa chỉ
                    </>
                  )}
                </button>
              </div>

              {isEditingAddress && (
                <div className="mb-6 p-5 bg-gradient-to-br from-primary-50 to-white rounded-lg border border-primary-100">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Plus className="w-5 h-5 mr-2 text-primary-600" />
                    Thêm địa chỉ mới
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Họ và tên"
                      value={newAddress.name}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, name: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    />
                    <input
                      type="tel"
                      placeholder="Số điện thoại"
                      value={newAddress.phone}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, phone: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Tỉnh/Thành phố"
                        value={newAddress.province}
                        onChange={(e) =>
                          setNewAddress({
                            ...newAddress,
                            province: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      />
                      <input
                        type="text"
                        placeholder="Quận/Huyện"
                        value={newAddress.district}
                        onChange={(e) =>
                          setNewAddress({
                            ...newAddress,
                            district: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Phường/Xã"
                        value={newAddress.ward}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, ward: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      />
                      <input
                        type="text"
                        placeholder="Địa chỉ chi tiết"
                        value={newAddress.detail}
                        onChange={(e) =>
                          setNewAddress({
                            ...newAddress,
                            detail: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div className="flex space-x-3 pt-2">
                      <button
                        onClick={handleAddAddress}
                        className="flex-1 flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors duration-200"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Thêm địa chỉ
                      </button>
                      <button
                        onClick={() => setIsEditingAddress(false)}
                        className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {user?.address?.length > 0 ? (
                  user.address.map((addr, index) => {
                    const isEditingThis = editingAddressId === index;

                    return (
                      <div
                        key={index}
                        className={`p-5 border-2 rounded-xl transition-all duration-300 ${
                          addr.setDefault
                            ? "border-primary-500 bg-gradient-to-br from-primary-50 to-white shadow-md"
                            : "border-gray-200 bg-white hover:border-primary-300 hover:shadow-md"
                        }`}
                      >
                        {isEditingThis ? (
                          <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                              <Edit className="w-5 h-5 mr-2 text-primary-600" />
                              Chỉnh sửa địa chỉ
                            </h4>
                            <input
                              type="text"
                              placeholder="Họ và tên"
                              value={editingAddress.name}
                              onChange={(e) =>
                                setEditingAddress({
                                  ...editingAddress,
                                  name: e.target.value,
                                })
                              }
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                            />
                            <input
                              type="tel"
                              placeholder="Số điện thoại"
                              value={editingAddress.phone}
                              onChange={(e) =>
                                setEditingAddress({
                                  ...editingAddress,
                                  phone: e.target.value,
                                })
                              }
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="text"
                                placeholder="Tỉnh/Thành phố"
                                value={editingAddress.province}
                                onChange={(e) =>
                                  setEditingAddress({
                                    ...editingAddress,
                                    province: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                              />
                              <input
                                type="text"
                                placeholder="Quận/Huyện"
                                value={editingAddress.district}
                                onChange={(e) =>
                                  setEditingAddress({
                                    ...editingAddress,
                                    district: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="text"
                                placeholder="Phường/Xã"
                                value={editingAddress.ward}
                                onChange={(e) =>
                                  setEditingAddress({
                                    ...editingAddress,
                                    ward: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                              />
                              <input
                                type="text"
                                placeholder="Địa chỉ chi tiết"
                                value={editingAddress.detail}
                                onChange={(e) =>
                                  setEditingAddress({
                                    ...editingAddress,
                                    detail: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                              />
                            </div>
                            <div className="flex space-x-3 pt-3">
                              <button
                                onClick={handleUpdateAddress}
                                className="flex-1 flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors duration-200"
                              >
                                <Save className="w-4 h-4 mr-2" />
                                Lưu
                              </button>
                              <button
                                onClick={cancelEditAddress}
                                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                              >
                                <X className="w-4 h-4 mr-2 inline" />
                                Hủy
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-3">
                                <div className="p-2 bg-primary-100 rounded-lg">
                                  <MapPin className="w-5 h-5 text-primary-600" />
                                </div>
                                <div>
                                  <span className="font-bold text-gray-900 text-lg">
                                    {addr.name}
                                  </span>
                                  {addr.setDefault && (
                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-600 text-white">
                                      <Star className="w-3 h-3 mr-1" />
                                      Mặc định
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="ml-12 space-y-3">
                                {/* Số điện thoại */}
                                <div className="flex items-center">
                                  <Phone className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                                  <span className="text-sm font-medium text-gray-700">
                                    {addr.phone}
                                  </span>
                                </div>
                                {/* Địa chỉ */}
                                <div className="flex items-start">
                                  <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                                  <div className="flex flex-col space-y-1">
                                    <span className="text-sm text-gray-900 font-medium">
                                      {addr.detail}
                                    </span>
                                    <span className="text-sm text-gray-600">
                                      {addr.ward}, {addr.district},{" "}
                                      {addr.province}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col space-y-2 ml-4">
                              {!addr.setDefault && (
                                <button
                                  onClick={() => handleSetDefaultAddress(index)}
                                  className="flex items-center text-xs font-medium text-primary-600 hover:text-primary-700 px-3 py-1.5 border border-primary-300 rounded-lg hover:bg-primary-50 transition-colors duration-200"
                                >
                                  <Star className="w-3 h-3 mr-1" />
                                  Đặt mặc định
                                </button>
                              )}
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditAddress(addr, index)}
                                  className="flex items-center px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Sửa
                                </button>
                                <button
                                  onClick={() => handleDeleteAddress(index)}
                                  className="flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Xóa
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-700 font-medium mb-1">
                      Chưa có địa chỉ nào
                    </p>
                    <p className="text-sm text-gray-500">
                      Thêm địa chỉ để giao hàng
                    </p>
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

export default ProfilePage;
