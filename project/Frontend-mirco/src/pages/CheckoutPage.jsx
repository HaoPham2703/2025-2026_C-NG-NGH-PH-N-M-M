import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../contexts/CartContext";
import { orderApi } from "../api/orderApi";
import { paymentApi } from "../api/paymentApi";
import { CreditCard, Banknote, Smartphone, MapPin } from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";
import toast from "react-hot-toast";

const CheckoutPage = () => {
  const { user } = useAuth();
  const { items: cartItems, clearCart, getTotalPrice } = useCart();
  const navigate = useNavigate();
  const [selectedPayment, setSelectedPayment] = useState("cash");
  const [selectedAddress, setSelectedAddress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // Group cart items by restaurant
  const groupCartByRestaurant = () => {
    const grouped = {};

    cartItems.forEach((item) => {
      // Get restaurant identifier (restaurantId string or restaurant ObjectId or restaurantName)
      const restaurantId =
        item.product?.restaurantId ||
        item.product?.restaurant?._id ||
        item.product?.restaurant ||
        item.product?.restaurantName ||
        "unknown";

      const restaurantName =
        item.product?.restaurantName ||
        item.product?.restaurant?.restaurantName ||
        item.product?.restaurant?.name ||
        `Cửa hàng ${restaurantId}` ||
        "Cửa hàng chưa xác định";

      if (!grouped[restaurantId]) {
        grouped[restaurantId] = {
          restaurantId,
          restaurantName,
          items: [],
          totalPrice: 0,
        };
      }

      const itemPrice =
        (item.product.promotion || item.product.price) * item.quantity;
      grouped[restaurantId].items.push(item);
      grouped[restaurantId].totalPrice += itemPrice;
    });

    return Object.values(grouped);
  };

  const restaurantGroups = groupCartByRestaurant();

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
      setIsSubmitting(true);

      // Map payment method to backend format
      const paymentMapping = {
        cash: "tiền mặt",
        vnpay: "vnpay",
        momo: "momo",
      };

      const address = user?.address?.[selectedAddress]?.detail || data.address;
      const receiver = user?.address?.[selectedAddress]?.name || data.receiver;
      const phone = user?.address?.[selectedAddress]?.phone || data.phone;
      const paymentMethod = paymentMapping[selectedPayment] || "tiền mặt";

      // Create orders for each restaurant group
      const orderPromises = restaurantGroups.map(async (group) => {
        const orderData = {
          address,
          receiver,
          phone,
          cart: group.items,
          totalPrice: group.totalPrice,
          payments: paymentMethod,
          restaurant: group.restaurantId,
        };

        console.log(`Creating order for ${group.restaurantName}:`, orderData);
        return orderApi.createOrder(orderData);
      });

      // Create all orders in parallel
      const orderResponses = await Promise.allSettled(orderPromises);
      console.log("All order responses:", orderResponses);

      // Check if all orders were created successfully
      const successfulOrders = orderResponses
        .filter((response) => {
          if (response.status === "fulfilled") {
            return (
              response.value?.status === "success" &&
              response.value?.data?.order
            );
          }
          return false;
        })
        .map((response) => response.value);

      const failedOrders = orderResponses.filter(
        (response) => response.status === "rejected"
      );

      // Show detailed error messages for failed orders
      if (failedOrders.length > 0) {
        failedOrders.forEach((failed) => {
          const error = failed.reason;
          const errorMessage =
            error?.response?.data?.message ||
            error?.message ||
            "Không thể tạo đơn hàng";
          toast.error(errorMessage, { duration: 5000 });
        });
      }

      if (successfulOrders.length === 0) {
        toast.error("Không thể tạo đơn hàng. Vui lòng kiểm tra lại giỏ hàng.");
        setIsSubmitting(false);
        return;
      }

      if (successfulOrders.length < restaurantGroups.length) {
        toast(
          `Đã tạo ${successfulOrders.length}/${restaurantGroups.length} đơn hàng thành công.`,
          {
            icon: "⚠️",
            duration: 4000,
          }
        );
      } else {
        toast.success(`Đã tạo ${successfulOrders.length} đơn hàng thành công!`);
      }

      // Clear cart after successful orders
      clearCart();

      // Handle payment based on payment method
      if (selectedPayment === "vnpay" || selectedPayment === "momo") {
        // For multiple orders, redirect to a payment summary page or first order
        const firstOrder = successfulOrders[0].data.order;
        const totalAmount = successfulOrders.reduce(
          (sum, response) => sum + (response.data?.order?.totalPrice || 0),
          0
        );

        const orderIds = successfulOrders
          .map((response) => response.data?.order?._id)
          .filter(Boolean)
          .join(",");

        const paymentUrl = `/payment/${selectedPayment}?orderId=${orderIds}&amount=${totalAmount}&orderDescription=${encodeURIComponent(
          `Thanh toán ${successfulOrders.length} đơn hàng`
        )}`;
        navigate(paymentUrl);
      } else {
        // COD - redirect to first order success page or orders list
        const firstOrder = successfulOrders[0].data.order;
        navigate(`/orders/${firstOrder._id}`);
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
      setIsSubmitting(false);
    }
  };

  const breadcrumbItems = [
    { label: "Trang Chủ", path: "/" },
    { label: "Giỏ Hàng", path: "/cart" },
    { label: "Thanh Toán", path: "/checkout" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb items={breadcrumbItems} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Thanh Toán</h1>
          <p className="text-gray-600">Hoàn tất đơn hàng của bạn</p>
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
                      <div className="font-medium">VNPay</div>
                      <div className="text-sm text-gray-600">
                        Thanh toán qua VNPay
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

                <div className="space-y-6 mb-6">
                  {restaurantGroups.map((group, groupIndex) => (
                    <div
                      key={group.restaurantId}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      {/* Restaurant Header */}
                      <div className="mb-3 pb-2 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">
                          {group.restaurantName}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {group.items.length} sản phẩm
                        </p>
                      </div>

                      {/* Products in this restaurant */}
                      <div className="space-y-2 mb-3">
                        {group.items.map((item) => (
                          <div
                            key={item.product._id}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-gray-700">
                              {item.product.title} x {item.quantity}
                            </span>
                            <span className="text-gray-900 font-medium">
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
                      </div>

                      {/* Restaurant Subtotal */}
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between font-semibold">
                          <span>Tạm tính:</span>
                          <span className="text-primary-600">
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(group.totalPrice)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Phí vận chuyển:</span>
                          <span className="text-green-600">Miễn phí</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Total Summary */}
                  <div className="border-t-2 pt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Số cửa hàng:</span>
                      <span className="font-medium">
                        {restaurantGroups.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Tổng sản phẩm:</span>
                      <span className="font-medium">
                        {getTotalItems()} sản phẩm
                      </span>
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
                    {restaurantGroups.length > 1 && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        ⚠️ Bạn sẽ thanh toán {restaurantGroups.length} đơn hàng
                        riêng biệt
                      </p>
                    )}
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
                    `Đặt hàng${
                      restaurantGroups.length > 1
                        ? ` (${restaurantGroups.length} đơn)`
                        : ""
                    }`
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
      </div>
    </div>
  );
};

export default CheckoutPage;
