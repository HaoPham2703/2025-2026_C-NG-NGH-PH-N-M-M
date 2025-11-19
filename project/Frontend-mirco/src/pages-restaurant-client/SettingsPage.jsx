import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import AddressAutocomplete from "../components/AddressAutocomplete";
import {
  User,
  Store,
  Lock,
  Bell,
  MapPin,
  Phone,
  Mail,
  Save,
  Camera,
  Clock,
  DollarSign,
} from "lucide-react";
import toast from "react-hot-toast";

const SettingsPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  const [restaurantData, setRestaurantData] = useState(
    JSON.parse(localStorage.getItem("restaurant_data") || "{}")
  );

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    restaurantName: restaurantData.restaurantName || "",
    ownerName: restaurantData.ownerName || "",
    email: restaurantData.email || "",
    phone: restaurantData.phone || "",
    description: restaurantData.description || "",
    cuisine: restaurantData.cuisine || "",
  });

  // Address form state
  const [addressForm, setAddressForm] = useState({
    address: restaurantData.address?.detail || "",
    ward: restaurantData.address?.ward || "",
    district: restaurantData.address?.district || "",
    city: restaurantData.address?.city || "",
  });

  // Handlers cho AddressAutocomplete
  const handleCityChange = (value) => {
    setAddressForm({
      ...addressForm,
      city: value,
      district: "",
      ward: "",
    });
  };

  const handleDistrictChange = (value) => {
    setAddressForm({
      ...addressForm,
      district: value,
      ward: "",
    });
  };

  const handleWardChange = (value) => {
    setAddressForm({
      ...addressForm,
      ward: value,
    });
  };

  // Business hours state
  const [businessHours, setBusinessHours] = useState({
    monday: { open: "08:00", close: "22:00", closed: false },
    tuesday: { open: "08:00", close: "22:00", closed: false },
    wednesday: { open: "08:00", close: "22:00", closed: false },
    thursday: { open: "08:00", close: "22:00", closed: false },
    friday: { open: "08:00", close: "22:00", closed: false },
    saturday: { open: "08:00", close: "23:00", closed: false },
    sunday: { open: "09:00", close: "23:00", closed: false },
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Notifications state
  const [notifications, setNotifications] = useState({
    newOrder: true,
    orderCancelled: true,
    lowStock: true,
    customerReview: false,
    emailNotifications: true,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation(
    async (data) => {
      const response = await fetch(
        "http://localhost:4006/api/restaurant/profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("restaurant_token")}`,
          },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Cập nhật thất bại");
      }
      return response.json();
    },
    {
      onSuccess: (data) => {
        toast.success("Cập nhật thông tin thành công!");
        // Cập nhật localStorage với dữ liệu mới từ server
        localStorage.setItem(
          "restaurant_data",
          JSON.stringify(data.data.restaurant)
        );
        // Cập nhật state để UI hiển thị dữ liệu mới ngay lập tức
        setRestaurantData(data.data.restaurant);
        // Cập nhật form với dữ liệu mới
        if (data.data.restaurant.address) {
          setAddressForm({
            address: data.data.restaurant.address.detail || "",
            ward: data.data.restaurant.address.ward || "",
            district: data.data.restaurant.address.district || "",
            city: data.data.restaurant.address.city || "",
          });
        }
        queryClient.invalidateQueries("restaurantProfile");
      },
      onError: (error) => {
        toast.error(error.message || "Cập nhật thất bại!");
      },
    }
  );

  // Change password mutation
  const changePasswordMutation = useMutation(
    async (data) => {
      const response = await fetch(
        "http://localhost:4006/api/restaurant/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("restaurant_token")}`,
          },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Đổi mật khẩu thất bại");
      }
      return response.json();
    },
    {
      onSuccess: () => {
        toast.success("Đổi mật khẩu thành công!");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      },
      onError: (error) => {
        toast.error(error.message || "Đổi mật khẩu thất bại!");
      },
    }
  );

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    // Gửi dữ liệu địa chỉ theo format API mong đợi
    updateProfileMutation.mutate({
      address: addressForm.address,
      ward: addressForm.ward,
      district: addressForm.district,
      city: addressForm.city,
    });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  const handleNotificationChange = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    // TODO: Save to backend
    toast.success("Đã cập nhật cài đặt thông báo!");
  };

  const tabs = [
    { id: "profile", label: "Thông tin cơ bản", icon: Store },
    { id: "address", label: "Địa chỉ", icon: MapPin },
    { id: "hours", label: "Giờ mở cửa", icon: Clock },
    { id: "password", label: "Đổi mật khẩu", icon: Lock },
    { id: "notifications", label: "Thông báo", icon: Bell },
  ];

  const daysOfWeek = [
    { key: "monday", label: "Thứ 2" },
    { key: "tuesday", label: "Thứ 3" },
    { key: "wednesday", label: "Thứ 4" },
    { key: "thursday", label: "Thứ 5" },
    { key: "friday", label: "Thứ 6" },
    { key: "saturday", label: "Thứ 7" },
    { key: "sunday", label: "Chủ nhật" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Cài đặt</h2>
        <p className="text-sm text-gray-600 mt-1">
          Quản lý thông tin nhà hàng và tài khoản
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabs Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? "bg-orange-50 text-orange-600 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Thông tin nhà hàng
                  </h3>

                  {/* Restaurant Logo */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo nhà hàng
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="w-24 h-24 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Store className="h-12 w-12 text-orange-600" />
                      </div>
                      <button
                        type="button"
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <Camera className="h-5 w-5" />
                        <span>Tải lên logo</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên nhà hàng *
                      </label>
                      <input
                        type="text"
                        value={profileForm.restaurantName}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            restaurantName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên chủ nhà hàng *
                      </label>
                      <input
                        type="text"
                        value={profileForm.ownerName}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            ownerName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            email: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số điện thoại *
                      </label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            phone: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Loại ẩm thực
                      </label>
                      <select
                        value={profileForm.cuisine}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            cuisine: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 cursor-pointer"
                      >
                        <option value="">Chọn loại ẩm thực</option>
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

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mô tả
                      </label>
                      <textarea
                        value={profileForm.description}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            description: e.target.value,
                          })
                        }
                        rows="4"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Giới thiệu về nhà hàng của bạn..."
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isLoading}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Save className="h-5 w-5" />
                    <span>
                      {updateProfileMutation.isLoading
                        ? "Đang lưu..."
                        : "Lưu thay đổi"}
                    </span>
                  </button>
                </div>
              </form>
            )}

            {/* Address Tab */}
            {activeTab === "address" && (
              <form onSubmit={handleAddressSubmit} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Địa chỉ nhà hàng
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Địa chỉ chi tiết *
                      </label>
                      <textarea
                        value={addressForm.address}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            address: e.target.value,
                          })
                        }
                        rows="2"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Số nhà, tên đường..."
                        required
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tỉnh/Thành phố *
                        </label>
                        <AddressAutocomplete
                          type="province"
                          value={addressForm.city}
                          onChange={handleCityChange}
                          placeholder="Tỉnh/Thành phố"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quận/Huyện *
                        </label>
                        <AddressAutocomplete
                          type="district"
                          value={addressForm.district}
                          onChange={handleDistrictChange}
                          placeholder="Quận/Huyện"
                          selectedProvince={addressForm.city}
                          disabled={!addressForm.city}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phường/Xã *
                        </label>
                        <AddressAutocomplete
                          type="ward"
                          value={addressForm.ward}
                          onChange={handleWardChange}
                          placeholder="Phường/Xã"
                          selectedProvince={addressForm.city}
                          selectedDistrict={addressForm.district}
                          disabled={!addressForm.district}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isLoading}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Save className="h-5 w-5" />
                    <span>Lưu thay đổi</span>
                  </button>
                </div>
              </form>
            )}

            {/* Business Hours Tab */}
            {activeTab === "hours" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Giờ mở cửa
                  </h3>
                  <div className="space-y-3">
                    {daysOfWeek.map((day) => (
                      <div
                        key={day.key}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <span className="font-medium text-gray-900 w-24">
                            {day.label}
                          </span>
                          {businessHours[day.key].closed ? (
                            <span className="text-red-600 font-medium">
                              Đóng cửa
                            </span>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <input
                                type="time"
                                value={businessHours[day.key].open}
                                onChange={(e) =>
                                  setBusinessHours({
                                    ...businessHours,
                                    [day.key]: {
                                      ...businessHours[day.key],
                                      open: e.target.value,
                                    },
                                  })
                                }
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                              />
                              <span className="text-gray-600">-</span>
                              <input
                                type="time"
                                value={businessHours[day.key].close}
                                onChange={(e) =>
                                  setBusinessHours({
                                    ...businessHours,
                                    [day.key]: {
                                      ...businessHours[day.key],
                                      close: e.target.value,
                                    },
                                  })
                                }
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                              />
                            </div>
                          )}
                        </div>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={businessHours[day.key].closed}
                            onChange={(e) =>
                              setBusinessHours({
                                ...businessHours,
                                [day.key]: {
                                  ...businessHours[day.key],
                                  closed: e.target.checked,
                                },
                              })
                            }
                            className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-600">
                            Đóng cửa
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => toast.success("Đã lưu giờ mở cửa!")}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Save className="h-5 w-5" />
                    <span>Lưu thay đổi</span>
                  </button>
                </div>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === "password" && (
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Đổi mật khẩu
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mật khẩu hiện tại *
                      </label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            currentPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mật khẩu mới *
                      </label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            newPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Xác nhận mật khẩu mới *
                      </label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={changePasswordMutation.isLoading}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Lock className="h-5 w-5" />
                    <span>
                      {changePasswordMutation.isLoading
                        ? "Đang cập nhật..."
                        : "Đổi mật khẩu"}
                    </span>
                  </button>
                </div>
              </form>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Cài đặt thông báo
                  </h3>

                  <div className="space-y-4">
                    {[
                      {
                        key: "newOrder",
                        label: "Đơn hàng mới",
                        description: "Nhận thông báo khi có đơn hàng mới",
                      },
                      {
                        key: "orderCancelled",
                        label: "Đơn hàng bị hủy",
                        description: "Nhận thông báo khi khách hủy đơn",
                      },
                      {
                        key: "lowStock",
                        label: "Sắp hết hàng",
                        description: "Nhận thông báo khi món ăn sắp hết",
                      },
                      {
                        key: "customerReview",
                        label: "Đánh giá mới",
                        description:
                          "Nhận thông báo khi có đánh giá từ khách hàng",
                      },
                      {
                        key: "emailNotifications",
                        label: "Thông báo qua Email",
                        description: "Nhận thông báo qua email",
                      },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.label}
                          </p>
                          <p className="text-sm text-gray-600">
                            {item.description}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications[item.key]}
                            onChange={() => handleNotificationChange(item.key)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;


