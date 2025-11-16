import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../contexts/CartContext";
import { orderApi } from "../api/orderApi";
import { paymentApi2 } from "../api/paymentApi2";
import {
  CreditCard,
  Banknote,
  Smartphone,
  MapPin,
  AlertCircle,
} from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";
import toast from "react-hot-toast";

const CheckoutPage_2 = () => {
  const { user, createAddress } = useAuth();
  const { items: cartItems, clearCart, getTotalPrice } = useCart();
  const navigate = useNavigate();
  const [selectedPayment, setSelectedPayment] = useState("cash");
  const [selectedAddress, setSelectedAddress] = useState(0);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: "",
    phone: "",
    province: "",
    district: "",
    ward: "",
    detail: "",
    setDefault: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    if (
      !newAddress.name ||
      !newAddress.phone ||
      !newAddress.province ||
      !newAddress.district ||
      !newAddress.ward ||
      !newAddress.detail
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin địa chỉ");
      return;
    }
    const res = await createAddress(newAddress);
    if (res?.success) {
      setShowAddAddress(false);
      // Chọn địa chỉ mới nhất
      const newIndex = user?.address?.length || 0;
      setSelectedAddress(newIndex);
      // Reset form
      setNewAddress({
        name: "",
        phone: "",
        province: "",
        district: "",
        ward: "",
        detail: "",
        setDefault: false,
      });
    }
  };

  // Check if cart is empty
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Giỏ hàng trống
          </h1>
          <p className="text-gray-600 mb-6">
            Bạn cần thêm sản phẩm vào giỏ hàng trước khi thanh toán
          </p>
          <Link to="/products" className="btn-primary">
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (data) => {
    try {
      // Map payment method to backend format
      const paymentMapping = {
        cash: "tiền mặt",
        vnpay: "vnpay",
        momo: "momo",
      };

      const orderData = {
        address: user?.address?.[selectedAddress]?.detail || data.address,
        receiver: user?.address?.[selectedAddress]?.name || data.receiver,
        phone: user?.address?.[selectedAddress]?.phone || data.phone,
        cart: cartItems,
        totalPrice: getTotalPrice(),
        payments: paymentMapping[selectedPayment] || "tiền mặt",
      };

      console.log("Order data:", orderData);

      // Create order
      const orderResponse = await orderApi.createOrder(orderData);

      console.log("Order response:", orderResponse);

      // Backend returns { status: "success", data: { order: ... } }
      if (orderResponse.status === "success" && orderResponse.data?.order) {
        toast.success("Đặt hàng thành công!");

        // Clear cart after successful order
        clearCart();

        const order = orderResponse.data.order;

        // Handle different payment methods
        if (selectedPayment === "vnpay") {
          try {
            // Gọi Payment Service 2 để tạo VNPay payment URL
            const paymentResponse = await paymentApi2.createVNPayUrl({
              orderId: order._id,
              amount: getTotalPrice(),
              orderInfo: `Thanh toán đơn hàng #${order._id}`,
              action: `Thanh toán đơn hàng #${order._id}`,
            });

            if (
              paymentResponse.status === "success" &&
              paymentResponse.vnpUrl
            ) {
              // Mở VNPay Sandbox trong tab mới
              window.open(paymentResponse.vnpUrl, "_blank");
            } else {
              toast.error("Không thể tạo link thanh toán VNPay");
            }
          } catch (error) {
            console.error("VNPay error:", error);
            console.error("Error details:", {
              message: error.message,
              response: error.response?.data,
              status: error.response?.status,
              config: error.config,
            });

            let errorMessage =
              "Có lỗi xảy ra khi tạo thanh toán VNPay. Vui lòng thử lại.";

            if (
              error.code === "ECONNREFUSED" ||
              error.message?.includes("Network Error")
            ) {
              errorMessage =
                "Không thể kết nối đến Payment Service 2 (port 3005).\nVui lòng:\n1. Kiểm tra Payment Service 2 có đang chạy không\n2. Chạy: cd services/payment-service-2 && npm start\n3. Kiểm tra: http://localhost:3005/health";
            } else if (
              error.code === "ETIMEDOUT" ||
              error.message?.includes("timeout")
            ) {
              errorMessage =
                "Kết nối đến Payment Service 2 bị timeout. Vui lòng kiểm tra service.";
            } else if (error.response?.data?.message) {
              errorMessage = error.response.data.message;
            } else if (error.response?.status === 500) {
              errorMessage =
                "Lỗi server. Vui lòng kiểm tra cấu hình VNPay trong Payment Service 2.";
            } else if (error.message) {
              errorMessage = error.message;
            }

            console.error("Full error object:", error);
            toast.error(errorMessage, { duration: 5000 });
          }
        } else if (selectedPayment === "momo") {
          // Redirect to MoMo Mock Page
          const paymentUrl = `/payment/momo?orderId=${
            order._id
          }&amount=${getTotalPrice()}&orderDescription=${encodeURIComponent(
            `Thanh toán đơn hàng #${order._id}`
          )}`;
          navigate(paymentUrl);
        } else {
          // COD - redirect to order success page
          navigate(`/orders/${order._id}`);
        }
      } else {
        toast.error(orderResponse.message || "Có lỗi xảy ra khi đặt hàng");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      // Show more specific error message
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.status === 400) {
        toast.error("Dữ liệu đơn hàng không hợp lệ. Vui lòng kiểm tra lại.");
      } else if (error.response?.status === 401) {
        toast.error("Bạn cần đăng nhập để đặt hàng.");
        navigate("/login");
      } else if (error.response?.status === 500) {
        toast.error("Lỗi server. Vui lòng thử lại sau.");
      } else {
        toast.error("Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.");
      }
    }
  };

  const breadcrumbItems = [
    { label: "Trang Chủ", path: "/" },
    { label: "Giỏ Hàng", path: "/cart" },
    { label: "Thanh Toán (Test VNPay)", path: "/checkout-2" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb items={breadcrumbItems} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Test Zone Banner */}
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <div>
              <h3 className="text-sm font-semibold text-yellow-800">
                🧪 Test Zone - Payment Service 2
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Trang này sử dụng Payment Service 2 (port 3005) với VNPay
                Sandbox API thật
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Thanh Toán (Test VNPay)
          </h1>
          <p className="text-gray-600">
            Hoàn tất đơn hàng của bạn - Test với VNPay Sandbox
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Address */}
              <div className="card">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Địa chỉ giao hàng
                </h2>

                {user?.address?.length > 0 ? (
                  <div className="space-y-3">
                    {user.address.map((addr, index) => (
                      <label
                        key={index}
                        className={`flex items-start p-4 border rounded-lg cursor-pointer ${
                          selectedAddress === index
                            ? "border-primary-500 bg-primary-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          value={index}
                          checked={selectedAddress === index}
                          onChange={(e) =>
                            setSelectedAddress(parseInt(e.target.value))
                          }
                          className="mt-1 mr-3"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
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
                      </label>
                    ))}

                    <button
                      type="button"
                      onClick={() => setShowAddAddress(true)}
                      className="mt-2 text-primary-600 hover:underline text-sm"
                    >
                      + Thêm địa chỉ mới
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Họ và tên người nhận
                        </label>
                        <input
                          {...register("receiver", {
                            required: "Họ và tên là bắt buộc",
                          })}
                          type="text"
                          className="input-field"
                          placeholder="Nhập họ và tên"
                        />
                        {errors.receiver && (
                          <p className="text-sm text-red-600 mt-1">
                            {errors.receiver.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Số điện thoại
                        </label>
                        <input
                          {...register("phone", {
                            required: "Số điện thoại là bắt buộc",
                          })}
                          type="tel"
                          className="input-field"
                          placeholder="Nhập số điện thoại"
                        />
                        {errors.phone && (
                          <p className="text-sm text-red-600 mt-1">
                            {errors.phone.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Địa chỉ giao hàng
                      </label>
                      <textarea
                        {...register("address", {
                          required: "Địa chỉ là bắt buộc",
                        })}
                        rows={3}
                        className="input-field"
                        placeholder="Nhập địa chỉ giao hàng chi tiết"
                      />
                      {errors.address && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.address.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">
                  Phương thức thanh toán
                </h2>

                <div className="space-y-3">
                  <label
                    className={`flex items-center p-4 border rounded-lg cursor-pointer ${
                      selectedPayment === "cash"
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="cash"
                      checked={selectedPayment === "cash"}
                      onChange={(e) => setSelectedPayment(e.target.value)}
                      className="mr-3"
                    />
                    <Banknote className="w-5 h-5 mr-3 text-gray-600" />
                    <div>
                      <div className="font-medium">
                        Thanh toán khi nhận hàng (COD)
                      </div>
                      <div className="text-sm text-gray-600">
                        Thanh toán bằng tiền mặt khi nhận hàng
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center p-4 border rounded-lg cursor-pointer ${
                      selectedPayment === "vnpay"
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="vnpay"
                      checked={selectedPayment === "vnpay"}
                      onChange={(e) => setSelectedPayment(e.target.value)}
                      className="mr-3"
                    />
                    <CreditCard className="w-5 h-5 mr-3 text-gray-600" />
                    <div>
                      <div className="font-medium">VNPay (Sandbox API)</div>
                      <div className="text-sm text-gray-600">
                        Thanh toán qua VNPay Sandbox - Payment Service 2
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center p-4 border rounded-lg cursor-pointer ${
                      selectedPayment === "momo"
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="momo"
                      checked={selectedPayment === "momo"}
                      onChange={(e) => setSelectedPayment(e.target.value)}
                      className="mr-3"
                    />
                    <Smartphone className="w-5 h-5 mr-3 text-gray-600" />
                    <div>
                      <div className="font-medium">MoMo</div>
                      <div className="text-sm text-gray-600">
                        Thanh toán qua ví MoMo
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="card sticky top-8">
                <h2 className="text-xl font-semibold mb-4">Tóm tắt đơn hàng</h2>

                <div className="space-y-3 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.product.title} x {item.quantity}
                      </span>
                      <span>
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(
                          (item.product.promotion || item.product.price) *
                            item.quantity
                        )}
                      </span>
                    </div>
                  ))}

                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span>Tạm tính:</span>
                      <span>
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(getTotalPrice())}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phí vận chuyển:</span>
                      <span className="text-green-600">Miễn phí</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-3 mt-3">
                      <span>Tổng cộng:</span>
                      <span className="text-primary-600">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(getTotalPrice())}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                  ) : (
                    "Đặt hàng"
                  )}
                </button>

                <div className="mt-4 text-xs text-gray-500 text-center">
                  Bằng cách đặt hàng, bạn đồng ý với{" "}
                  <a href="/terms" className="text-primary-600 hover:underline">
                    điều khoản sử dụng
                  </a>{" "}
                  của chúng tôi
                </div>
              </div>
            </div>
          </div>
        </form>

        {showAddAddress && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Thêm địa chỉ mới</h3>
                <button
                  type="button"
                  onClick={() => setShowAddAddress(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateAddress} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={newAddress.name}
                      onChange={(e) =>
                        setNewAddress((s) => ({ ...s, name: e.target.value }))
                      }
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      className="input-field"
                      value={newAddress.phone}
                      onChange={(e) =>
                        setNewAddress((s) => ({ ...s, phone: e.target.value }))
                      }
                      placeholder="0912345678"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tỉnh/TP
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={newAddress.province}
                      onChange={(e) =>
                        setNewAddress((s) => ({
                          ...s,
                          province: e.target.value,
                        }))
                      }
                      placeholder="TP. Hồ Chí Minh"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quận/Huyện
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={newAddress.district}
                      onChange={(e) =>
                        setNewAddress((s) => ({
                          ...s,
                          district: e.target.value,
                        }))
                      }
                      placeholder="Quận 1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phường/Xã
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={newAddress.ward}
                      onChange={(e) =>
                        setNewAddress((s) => ({ ...s, ward: e.target.value }))
                      }
                      placeholder="Phường Bến Nghé"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa chỉ chi tiết
                  </label>
                  <textarea
                    rows={3}
                    className="input-field"
                    value={newAddress.detail}
                    onChange={(e) =>
                      setNewAddress((s) => ({ ...s, detail: e.target.value }))
                    }
                    placeholder="Số nhà, đường, khu phố..."
                  />
                </div>

                <label className="inline-flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newAddress.setDefault}
                    onChange={(e) =>
                      setNewAddress((s) => ({
                        ...s,
                        setDefault: e.target.checked,
                      }))
                    }
                  />
                  <span className="text-sm">Đặt làm địa chỉ mặc định</span>
                </label>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(false)}
                    className="btn-secondary"
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn-primary">
                    Lưu địa chỉ
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage_2;
