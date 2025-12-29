import { useState, useMemo, useEffect } from "react";
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
import AddressAutocomplete from "../components/AddressAutocomplete";
import toast from "react-hot-toast";

const CheckoutPage_2 = () => {
  const { user, createAddress } = useAuth();
  const { items: cartItems, clearCart, getTotalPrice } = useCart();
  const navigate = useNavigate();
  const [selectedPayment, setSelectedPayment] = useState("cash");
  const [selectedAddress, setSelectedAddress] = useState(0);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: "",
    phone: "",
    province: "",
    district: "",
    ward: "",
    detail: "",
    setDefault: false,
  });

  // Handlers cho autocomplete
  const handleProvinceChange = (value) => {
    setNewAddress({
      ...newAddress,
      province: value,
      district: "",
      ward: "",
    });
  };

  const handleDistrictChange = (value) => {
    setNewAddress({
      ...newAddress,
      district: value,
      ward: "",
    });
  };

  const handleWardChange = (value) => {
    setNewAddress({
      ...newAddress,
      ward: value,
    });
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // Helper function to check if string is valid ObjectId
  const isValidObjectId = (str) => {
    if (!str || typeof str !== "string") return false;
    return /^[0-9a-fA-F]{24}$/.test(str);
  };

  // Group cart items by restaurant
  const groupCartByRestaurant = () => {
    const grouped = {};

    cartItems.forEach((item) => {
      // Get restaurant ObjectId - ưu tiên restaurant ObjectId trước restaurantId string
      // Chỉ lấy restaurantId nếu nó là ObjectId hợp lệ
      let restaurantId =
        item.product?.restaurant?._id || item.product?.restaurant || null;

      // Nếu không có restaurant ObjectId, kiểm tra restaurantId có phải ObjectId không
      if (!restaurantId && item.product?.restaurantId) {
        if (isValidObjectId(item.product.restaurantId)) {
          restaurantId = item.product.restaurantId;
        } else {
          // restaurantId là string không phải ObjectId (ví dụ: "restaurant_11")
          // Không sử dụng nó, để restaurantId = null
          console.warn(
            `Product ${item.product._id} has invalid restaurantId: ${item.product.restaurantId}`
          );
        }
      }

      // Nếu vẫn không có restaurantId hợp lệ, dùng "unknown"
      if (!restaurantId) {
        restaurantId = "unknown";
      }

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

  // Calculate estimated shipping fee per restaurant group
  // Default: 20,000 VND per restaurant
  // Backend will calculate accurate fee when order is created
  const estimatedShippingFeePerRestaurant = 20000;

  // Calculate total shipping fee (estimated)
  const totalShippingFee = useMemo(() => {
    return restaurantGroups.length * estimatedShippingFeePerRestaurant;
  }, [restaurantGroups.length]);

  // Calculate total with shipping
  const totalWithShipping = useMemo(() => {
    const subtotal = getTotalPrice();
    return subtotal + totalShippingFee;
  }, [cartItems, totalShippingFee]);

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

      // ============================================
      // BƯỚC 1: TẠO ORDER TRƯỚC (ghi vào Order DB)
      // ============================================
      // Order được tạo ngay lập tức, không phụ thuộc vào payment method
      // Đối với VNPay: Order được tạo trước, sau đó mới tạo transaction trong Payment Service
      // Đối với COD: Chỉ cần tạo order
      console.log(
        `[Checkout] Bắt đầu tạo ${restaurantGroups.length} đơn hàng với phương thức thanh toán: ${paymentMethod}`
      );

      // Create orders for each restaurant group
      const orderPromises = restaurantGroups.map(async (group) => {
        const orderData = {
          address,
          receiver,
          phone,
          cart: group.items,
          totalPrice: group.totalPrice,
          payments: paymentMethod, // Ghi phương thức thanh toán vào order
        };

        // Chỉ thêm restaurant nếu là ObjectId hợp lệ, không phải "unknown"
        if (
          group.restaurantId &&
          group.restaurantId !== "unknown" &&
          isValidObjectId(group.restaurantId)
        ) {
          orderData.restaurant = group.restaurantId;
        }
        // Nếu restaurantId là "unknown", không gửi field restaurant (sẽ là null/undefined)

        console.log(`[Checkout] Đang tạo order cho ${group.restaurantName}:`, {
          restaurantId: group.restaurantId,
          totalPrice: orderData.totalPrice,
          itemsCount: orderData.cart.length,
          payments: orderData.payments,
        });
        return orderApi.createOrder(orderData);
      });

      // Create all orders in parallel - GHI VÀO ORDER DB
      const orderResponses = await Promise.all(orderPromises);
      console.log(
        "[Checkout] Kết quả tạo orders:",
        orderResponses.map((r) => ({
          success: r.status === "success",
          orderId: r.data?.order?._id,
        }))
      );

      // Check if all orders were created successfully
      const successfulOrders = orderResponses.filter(
        (response) => response.status === "success" && response.data?.order
      );

      if (successfulOrders.length === 0) {
        toast.error("Không thể tạo đơn hàng. Vui lòng thử lại.");
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

      // Clear cart after successful orders (order đã được tạo thành công vào Order DB)
      clearCart();

      // ============================================
      // BƯỚC 2: TẠO TRANSACTION CHO TẤT CẢ PAYMENT METHODS
      // ============================================
      // LƯU Ý: Order đã được ghi vào Order DB ở BƯỚC 1
      // Bây giờ tạo transaction trong Payment Service cho TẤT CẢ payment methods
      // - COD (tiền mặt): status = "completed" ngay
      // - VNPay: tạo payment URL và transaction với status = "pending"
      // - MoMo: tạo transaction với status = "pending"
      // Nếu tạo transaction thất bại, order vẫn tồn tại trong Order DB

      // Map payment method từ frontend sang backend
      const paymentMethodMap = {
        cash: "tiền mặt",
        vnpay: "vnpay",
        momo: "momo",
      };

      const backendPaymentMethod =
        paymentMethodMap[selectedPayment] || selectedPayment;
      const userId = user?._id || user?.id || user?.userId;

      // Tạo transaction cho tất cả orders (trừ VNPay vì VNPay sẽ tạo transaction riêng với payment URL)
      if (selectedPayment !== "vnpay") {
        console.log(
          `[Checkout] Tạo transaction cho ${successfulOrders.length} orders với payment method: ${backendPaymentMethod}`
        );
        try {
          const transactionPromises = successfulOrders.map(async (response) => {
            const order = response.data.order;
            try {
              console.log(
                `[Checkout] Tạo transaction cho order ${order._id} với payment method: ${backendPaymentMethod}`
              );
              const transactionResponse = await paymentApi2.createTransaction({
                orderId: order._id,
                amount: order.totalPrice,
                userId: userId,
                paymentMethod: backendPaymentMethod,
                // COD = completed ngay, các payment khác = pending
                status:
                  backendPaymentMethod === "tiền mặt" ? "completed" : "pending",
              });

              if (transactionResponse.status === "success") {
                console.log(
                  `✅ Transaction created for order ${order._id}:`,
                  transactionResponse.data?.transaction?._id
                );
                return { orderId: order._id, success: true };
              } else {
                console.warn(
                  `⚠️ Transaction creation failed for order ${order._id}`
                );
                return { orderId: order._id, success: false };
              }
            } catch (transactionError) {
              console.error(
                `Error creating transaction for order ${order._id}:`,
                transactionError
              );
              return {
                orderId: order._id,
                success: false,
                error: transactionError,
              };
            }
          });

          const transactionResults = await Promise.all(transactionPromises);
          const successfulTransactions = transactionResults.filter(
            (r) => r.success
          );
          const failedTransactions = transactionResults.filter(
            (r) => !r.success
          );

          if (successfulTransactions.length > 0) {
            console.log(
              `✅ Created ${successfulTransactions.length} transactions successfully`
            );
          }

          if (failedTransactions.length > 0) {
            console.warn(
              `⚠️ Failed to create ${failedTransactions.length} transactions`
            );
            toast(
              `Đơn hàng đã được tạo thành công. ${failedTransactions.length} transaction chưa được tạo.`,
              {
                icon: "⚠️",
                duration: 4000,
              }
            );
          }
        } catch (error) {
          console.error("Error creating transactions:", error);
          // Không hiển thị toast để tránh spam, vì order đã được tạo thành công
        }
      }

      // Xử lý riêng cho VNPay (tạo payment URL và transaction)
      if (selectedPayment === "vnpay") {
        console.log(
          "[Checkout] Bắt đầu tạo payment URL và transaction cho VNPay"
        );
        // For multiple orders, save payment URLs to database for each order
        // Order đã được tạo vào Order DB, giờ tạo transaction trong Payment Service
        try {
          const paymentPromises = successfulOrders.map(async (response) => {
            const order = response.data.order;
            // Lấy userId từ user object
            const userId = user?._id || user?.id || user?.userId;

            try {
              console.log(
                `[Checkout] Tạo payment URL cho order ${order._id} (đã có trong Order DB)`
              );
              // Tạo transaction trong Payment Service (ghi vào Transaction DB)
              // Order đã được tạo ở BƯỚC 1, giờ chỉ cần tạo transaction
              const paymentResponse = await paymentApi2.createVNPayUrl({
                orderId: order._id, // Order ID đã có từ Order DB
                amount: order.totalPrice,
                userId: userId, // Gửi userId trong request body
                orderInfo: `Thanh toán đơn hàng #${order._id} - ${
                  restaurantGroups.find(
                    (g) => g.restaurantId === order.restaurant
                  )?.restaurantName || "Cửa hàng"
                }`,
                action: `Thanh toán đơn hàng #${order._id}`,
              });

              if (
                paymentResponse.status === "success" &&
                paymentResponse.vnpUrl
              ) {
                // Kiểm tra xem transaction có được tạo thành công không
                if (paymentResponse.transactionCreated) {
                  console.log(`✅ Transaction created for order ${order._id}`);
                } else {
                  console.warn(
                    `⚠️ Transaction NOT created for order ${order._id}`,
                    paymentResponse.transactionError
                      ? `Error: ${paymentResponse.transactionError}`
                      : "Missing userId or orderId"
                  );
                }
                return {
                  orderId: order._id,
                  success: true,
                  transactionCreated: paymentResponse.transactionCreated,
                };
              } else {
                console.warn(
                  `⚠️ Payment URL creation failed for order ${order._id}`
                );
                return { orderId: order._id, success: false };
              }
            } catch (paymentError) {
              // Nếu tạo payment URL thất bại, vẫn trả về success cho order
              // vì order đã được tạo rồi
              console.error(
                `Error creating payment URL for order ${order._id}:`,
                paymentError
              );
              return {
                orderId: order._id,
                success: false,
                error: paymentError,
              };
            }
          });

          const paymentResults = await Promise.all(paymentPromises);
          const successfulPayments = paymentResults.filter((r) => r.success);
          const failedPayments = paymentResults.filter((r) => !r.success);

          // Thông báo kết quả
          if (successfulPayments.length > 0) {
            toast.success(
              `Đã tạo ${successfulPayments.length} đơn hàng với link thanh toán VNPay. Bạn có thể thanh toán sau trong trang đơn hàng.`
            );
          }

          if (failedPayments.length > 0) {
            toast(
              `Đơn hàng đã được tạo thành công. ${failedPayments.length} link thanh toán chưa được tạo, bạn có thể tạo lại sau trong trang đơn hàng.`,
              {
                icon: "⚠️",
                duration: 5000,
              }
            );
          }
        } catch (error) {
          console.error("VNPay error:", error);
          console.error("Error details:", {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            config: error.config,
          });

          // Thông báo lỗi nhưng vẫn redirect vì order đã được tạo
          toast(
            "Đơn hàng đã được tạo thành công. Có lỗi khi tạo link thanh toán VNPay, bạn có thể tạo lại sau trong trang đơn hàng.",
            {
              icon: "⚠️",
              duration: 5000,
            }
          );
        }

        // LUÔN redirect đến đơn hàng đầu tiên (order đã được tạo)
        const firstOrder = successfulOrders[0].data.order;
        navigate(`/orders/${firstOrder._id}`);
      } else if (selectedPayment === "momo") {
        // For multiple orders, redirect to first order or show message
        if (successfulOrders.length > 1) {
          toast.info(
            `Đã tạo ${successfulOrders.length} đơn hàng. Bạn sẽ được chuyển đến thanh toán đơn hàng đầu tiên.`
          );
        }
        const firstOrder = successfulOrders[0].data.order;
        const paymentUrl = `/payment/momo?orderId=${firstOrder._id}&amount=${
          firstOrder.totalPrice
        }&orderDescription=${encodeURIComponent(
          `Thanh toán đơn hàng #${firstOrder._id}`
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
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-gray-500">Phí vận chuyển:</span>
                          <span className="text-gray-700 font-medium">
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(estimatedShippingFeePerRestaurant)}
                          </span>
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
                        {cartItems.reduce(
                          (sum, item) => sum + item.quantity,
                          0
                        )}{" "}
                        sản phẩm
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Tổng phí vận chuyển:</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(totalShippingFee)}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-3 mt-3">
                      <span>Tổng cộng:</span>
                      <span className="text-primary-600">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(totalWithShipping)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 italic">
                      * Phí ship được tính dựa trên khoảng cách từ nhà hàng đến địa chỉ giao hàng
                    </p>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tỉnh/Thành phố
                    </label>
                    <AddressAutocomplete
                      type="province"
                      value={newAddress.province}
                      onChange={handleProvinceChange}
                      placeholder="Tỉnh/Thành phố"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quận/Huyện
                    </label>
                    <AddressAutocomplete
                      type="district"
                      value={newAddress.district}
                      onChange={handleDistrictChange}
                      placeholder="Quận/Huyện"
                      selectedProvince={newAddress.province}
                      disabled={!newAddress.province}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phường/Xã
                    </label>
                    <AddressAutocomplete
                      type="ward"
                      value={newAddress.ward}
                      onChange={handleWardChange}
                      placeholder="Phường/Xã"
                      selectedProvince={newAddress.province}
                      selectedDistrict={newAddress.district}
                      disabled={!newAddress.district}
                    />
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
