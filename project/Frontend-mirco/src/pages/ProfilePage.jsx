import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { User, Mail, Phone, MapPin, Edit, Save, X } from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";

const ProfilePage = () => {
  const { user, updateProfile, createAddress } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
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
    if (!newAddress.name || !newAddress.phone || !newAddress.province || !newAddress.district || !newAddress.ward || !newAddress.detail) {
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

  const breadcrumbItems = [
    { label: "Trang Chủ", path: "/" },
    { label: "Hồ Sơ Cá Nhân", path: "/profile" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb items={breadcrumbItems} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Hồ Sơ Cá Nhân
          </h1>
          <p className="text-gray-600">
            Quản lý thông tin cá nhân và địa chỉ giao hàng
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Thông tin cá nhân</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="btn-secondary"
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
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Họ và tên
                      </label>
                      <input
                        {...register("name", {
                          required: "Họ và tên là bắt buộc",
                        })}
                        type="text"
                        className="input-field"
                      />
                      {errors.name && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={user?.email}
                        disabled
                        className="input-field bg-gray-100"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Email không thể thay đổi
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số điện thoại
                      </label>
                      <input
                        {...register("phone")}
                        type="tel"
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giới tính
                      </label>
                      <select {...register("gender")} className="input-field">
                        <option value="">Chọn giới tính</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ngày sinh
                      </label>
                      <input
                        {...register("dateOfBirth")}
                        type="date"
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="btn-secondary"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary"
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
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{user?.name}</h3>
                      <p className="text-gray-600">{user?.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{user?.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Số điện thoại</p>
                        <p className="font-medium">
                          {user?.phone || "Chưa cập nhật"}
                        </p>
                      </div>
                    </div>

                    {user?.gender && (
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Giới tính</p>
                          <p className="font-medium">
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
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Ngày sinh</p>
                          <p className="font-medium">{user.dateOfBirth}</p>
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
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Địa chỉ giao hàng</h2>
                <button
                  onClick={() => setIsEditingAddress(!isEditingAddress)}
                  className="btn-primary text-sm"
                >
                  {isEditingAddress ? "Hủy" : "Thêm địa chỉ"}
                </button>
              </div>

              {isEditingAddress && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-4">Thêm địa chỉ mới</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Họ và tên"
                      value={newAddress.name}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, name: e.target.value })
                      }
                      className="input-field"
                    />
                    <input
                      type="tel"
                      placeholder="Số điện thoại"
                      value={newAddress.phone}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, phone: e.target.value })
                      }
                      className="input-field"
                    />
                    <div className="grid grid-cols-2 gap-2">
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
                        className="input-field"
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
                        className="input-field"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Phường/Xã"
                        value={newAddress.ward}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, ward: e.target.value })
                        }
                        className="input-field"
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
                        className="input-field"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleAddAddress}
                        className="btn-primary text-sm"
                      >
                        Thêm địa chỉ
                      </button>
                      <button
                        onClick={() => setIsEditingAddress(false)}
                        className="btn-secondary text-sm"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {user?.address?.length > 0 ? (
                  user.address.map((addr, index) => (
                    <div
                      key={index}
                      className={`p-4 border rounded-lg ${
                        addr.setDefault
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{addr.name}</span>
                            {addr.setDefault && (
                              <span className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded">
                                Mặc định
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{addr.phone}</p>
                          <p className="text-sm text-gray-600">
                            {addr.detail}, {addr.ward}, {addr.district},{" "}
                            {addr.province}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button className="text-sm text-primary-600 hover:text-primary-700">
                            Sửa
                          </button>
                          <button className="text-sm text-red-600 hover:text-red-700">
                            Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Chưa có địa chỉ nào</p>
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
