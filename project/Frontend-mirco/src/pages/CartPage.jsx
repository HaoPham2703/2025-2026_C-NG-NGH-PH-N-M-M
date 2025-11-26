import { Link } from "react-router-dom";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { useCart } from "../contexts/CartContext";
import Breadcrumb from "../components/Breadcrumb";
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { orderApi } from "../api/orderApi";
import { restaurantApi } from "../api/restaurantApi";
import toast from "react-hot-toast";

const CartPage = () => {
  const {
    items: cartItems,
    updateQuantity,
    removeFromCart,
    getTotalPrice,
    getTotalItems,
  } = useCart();
  const { user } = useAuth();

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null, // 'remove' or 'zero'
    productId: null,
    productName: null,
  });

  // Group cart items by restaurant to calculate shipping fee
  const restaurantGroups = useMemo(() => {
    const grouped = {};

    cartItems.forEach((item) => {
      const restaurantId =
        item.product?.restaurant?._id ||
        item.product?.restaurant ||
        item.product?.restaurantId ||
        "unknown";

      // Get restaurant name
      const restaurantName =
        item.product?.restaurantName ||
        item.product?.restaurant?.restaurantName ||
        item.product?.restaurant?.name ||
        item.product?.restaurantInfo?.restaurantName ||
        `Nhà hàng ${restaurantId}`;

      if (!grouped[restaurantId]) {
        grouped[restaurantId] = {
          restaurantId,
          restaurantName,
          items: [],
        };
      }
      grouped[restaurantId].items.push(item);
    });

    return Object.values(grouped);
  }, [cartItems]);

  // State for shipping fees calculation
  const [shippingFees, setShippingFees] = useState({});
  const [shippingDetails, setShippingDetails] = useState({}); // Store detailed info: distance, addresses
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  // Calculate actual shipping fee based on user's default address
  useEffect(() => {
    const calculateShippingFees = async () => {
      // If user doesn't have a default address, use estimated fee
      if (!user?.address || user.address.length === 0) {
        setShippingFees({});
        return;
      }

      // Find default address or use first address
      const defaultAddressIndex = user.address.findIndex(
        (addr) => addr.isDefault
      );
      const selectedAddressIndex =
        defaultAddressIndex >= 0 ? defaultAddressIndex : 0;
      const selectedAddress = user.address[selectedAddressIndex];

      if (!selectedAddress) {
        setShippingFees({});
        return;
      }

      // Build full address string
      const userFullAddress = `${selectedAddress.detail}, ${selectedAddress.ward}, ${selectedAddress.district}, ${selectedAddress.province}`;

      setIsCalculatingShipping(true);

      // Calculate shipping fee for each restaurant group
      const feePromises = restaurantGroups.map(async (group) => {
        // Try to get restaurant address from product info first
        let restaurantFullAddress =
          group.items[0]?.product?.restaurantInfo?.address;

        // Handle different address formats
        if (
          typeof restaurantFullAddress === "object" &&
          restaurantFullAddress !== null
        ) {
          restaurantFullAddress = [
            restaurantFullAddress.detail,
            restaurantFullAddress.ward,
            restaurantFullAddress.district,
            restaurantFullAddress.city || restaurantFullAddress.province,
          ]
            .filter(Boolean)
            .join(", ");
        } else if (typeof restaurantFullAddress !== "string") {
          // Try alternative paths for restaurant address
          const restaurantObj = group.items[0]?.product?.restaurant;
          if (restaurantObj && typeof restaurantObj === "object") {
            const addr = restaurantObj.address;
            if (addr) {
              if (typeof addr === "string") {
                restaurantFullAddress = addr;
              } else if (typeof addr === "object") {
                restaurantFullAddress = [
                  addr.detail,
                  addr.ward,
                  addr.district,
                  addr.city || addr.province,
                ]
                  .filter(Boolean)
                  .join(", ");
              }
            }
          }
        }

        // If restaurant address not found in product, try to fetch from Restaurant Service
        if (!restaurantFullAddress || restaurantFullAddress.trim() === "") {
          // Try to fetch restaurant info from Restaurant Service if restaurantId is valid ObjectId
          const isValidObjectId = (str) => {
            if (!str || typeof str !== "string") return false;
            return /^[0-9a-fA-F]{24}$/.test(str);
          };

          // Try to fetch restaurant info from public endpoint if restaurantId is valid ObjectId
          if (
            group.restaurantId &&
            group.restaurantId !== "unknown" &&
            isValidObjectId(group.restaurantId)
          ) {
            try {
              // Use public endpoint to get restaurant info (no admin required)
              const restaurantServiceUrl =
                process.env.RESTAURANT_SERVICE_URL || "http://localhost:4006";
              const apiGatewayUrl =
                process.env.API_GATEWAY_URL || "http://localhost:5001";

              // Try API Gateway first (recommended)
              let restaurantResponse;
              try {
                restaurantResponse = await fetch(
                  `${apiGatewayUrl}/api/v1/restaurants/${group.restaurantId}/public`,
                  {
                    method: "GET",
                    headers: {
                      "Content-Type": "application/json",
                    },
                  }
                );

                if (!restaurantResponse.ok) {
                  throw new Error(`HTTP ${restaurantResponse.status}`);
                }

                const data = await restaurantResponse.json();
                const restaurant = data?.data?.restaurant;

                if (restaurant?.address) {
                  const addr = restaurant.address;
                  if (typeof addr === "object" && addr !== null) {
                    restaurantFullAddress = [
                      addr.detail,
                      addr.ward,
                      addr.district,
                      addr.city || addr.province,
                    ]
                      .filter(Boolean)
                      .join(", ");

                    // Update restaurantName in group for later use
                    if (restaurant.restaurantName) {
                      group.restaurantName = restaurant.restaurantName;
                    }
                  } else if (typeof addr === "string") {
                    restaurantFullAddress = addr;
                  }
                }
              } catch (gatewayError) {
                // Fallback to direct service call
                console.warn(
                  `API Gateway failed, trying direct service call:`,
                  gatewayError.message
                );
                restaurantResponse = await fetch(
                  `${restaurantServiceUrl}/api/v1/restaurant/${group.restaurantId}/public`,
                  {
                    method: "GET",
                    headers: {
                      "Content-Type": "application/json",
                    },
                  }
                );

                if (restaurantResponse.ok) {
                  const data = await restaurantResponse.json();
                  const restaurant = data?.data?.restaurant;

                  if (restaurant?.address) {
                    const addr = restaurant.address;
                    if (typeof addr === "object" && addr !== null) {
                      restaurantFullAddress = [
                        addr.detail,
                        addr.ward,
                        addr.district,
                        addr.city || addr.province,
                      ]
                        .filter(Boolean)
                        .join(", ");

                      if (restaurant.restaurantName) {
                        group.restaurantName = restaurant.restaurantName;
                      }
                    } else if (typeof addr === "string") {
                      restaurantFullAddress = addr;
                    }
                  }
                }
              }
            } catch (fetchError) {
              console.warn(
                `Could not fetch restaurant ${group.restaurantId}:`,
                fetchError.message
              );
            }
          }
        }

        if (!restaurantFullAddress || restaurantFullAddress.trim() === "") {
          // Use default fee if restaurant address still not available
          console.warn(
            `Restaurant address not found for group ${group.restaurantId}. Using default shipping fee.`
          );
          return {
            restaurantId: group.restaurantId,
            restaurantName:
              group.restaurantName || `Nhà hàng ${group.restaurantId}`,
            fee: 20000,
            distance: null,
            restaurantAddress: null,
            deliveryAddress: userFullAddress,
          };
        }

        try {
          const response = await orderApi.calculateShippingFee({
            restaurantAddress: restaurantFullAddress,
            userAddress: userFullAddress,
          });

          console.log(
            `[CartPage] Shipping fee response for ${group.restaurantId}:`,
            response
          );

          // Use restaurantName from group (already set when grouping)
          // Try multiple sources for restaurant name
          const restaurantName =
            group.restaurantName ||
            group.items[0]?.product?.restaurantName ||
            group.items[0]?.product?.restaurant?.restaurantName ||
            group.items[0]?.product?.restaurantInfo?.restaurantName ||
            `Nhà hàng ${group.restaurantId}`;

          // Response interceptor returns response.data directly
          // Backend returns: { status: "success", data: { shippingFee, distance, ... } }
          // After interceptor, response = { status: "success", data: { shippingFee, distance, ... } }
          // So we need response.data to get the actual shipping data
          const shippingData = response?.data || {};

          console.log(
            `[CartPage] Shipping data for ${group.restaurantId}:`,
            shippingData
          );

          return {
            restaurantId: group.restaurantId,
            restaurantName,
            fee: shippingData?.shippingFee || 20000,
            distance:
              shippingData?.distance !== undefined &&
              shippingData?.distance !== null
                ? parseFloat(shippingData.distance)
                : null,
            restaurantAddress:
              shippingData?.restaurantAddress || restaurantFullAddress,
            deliveryAddress: shippingData?.deliveryAddress || userFullAddress,
          };
        } catch (error) {
          console.error(
            `Error calculating shipping for restaurant ${group.restaurantId}:`,
            error
          );
          console.error(
            "Error details:",
            error.response?.data || error.message
          );
          // Use default fee if calculation fails
          const fallbackRestaurantName =
            group.restaurantName ||
            group.items[0]?.product?.restaurantName ||
            group.items[0]?.product?.restaurant?.restaurantName ||
            group.items[0]?.product?.restaurantInfo?.restaurantName ||
            `Nhà hàng ${group.restaurantId}`;

          return {
            restaurantId: group.restaurantId,
            restaurantName: fallbackRestaurantName,
            fee: 20000,
            distance: null,
            restaurantAddress: restaurantFullAddress || null,
            deliveryAddress: userFullAddress,
          };
        }
      });

      try {
        const results = await Promise.all(feePromises);
        const feesMap = results.reduce((acc, curr) => {
          acc[curr.restaurantId] = curr.fee;
          return acc;
        }, {});

        const detailsMap = results.reduce((acc, curr) => {
          acc[curr.restaurantId] = {
            restaurantName:
              curr.restaurantName || `Nhà hàng ${curr.restaurantId}`,
            distance: curr.distance,
            restaurantAddress: curr.restaurantAddress,
            deliveryAddress: curr.deliveryAddress,
          };
          return acc;
        }, {});

        setShippingFees(feesMap);
        setShippingDetails(detailsMap);
      } catch (error) {
        console.error("Error calculating shipping fees:", error);
        setShippingFees({});
        setShippingDetails({});
      } finally {
        setIsCalculatingShipping(false);
      }
    };

    calculateShippingFees();
  }, [user?.address, restaurantGroups, user]);

  // Calculate total shipping fee
  const totalShippingFee = useMemo(() => {
    if (Object.keys(shippingFees).length === 0) {
      // Fallback to estimated fee if calculation not available
      return restaurantGroups.length * 20000;
    }

    // Sum up all shipping fees
    return Object.values(shippingFees).reduce((sum, fee) => sum + fee, 0);
  }, [shippingFees, restaurantGroups.length]);

  // Calculate estimated shipping fee (fallback)
  const estimatedShippingFee = useMemo(() => {
    return restaurantGroups.length * 20000;
  }, [restaurantGroups.length]);

  // Calculate total with shipping
  const totalWithShipping = useMemo(() => {
    const subtotal = getTotalPrice();
    return subtotal + totalShippingFee;
  }, [cartItems, totalShippingFee]);

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity === 0) {
      // Tìm tên sản phẩm để hiển thị trong modal
      const item = cartItems.find((item) => item.product._id === productId);
      if (item) {
        setConfirmModal({
          isOpen: true,
          type: "zero",
          productId,
          productName: item.product.title,
        });
      }
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleRemoveItem = (productId) => {
    // Tìm tên sản phẩm để hiển thị trong modal
    const item = cartItems.find((item) => item.product._id === productId);
    if (item) {
      setConfirmModal({
        isOpen: true,
        type: "remove",
        productId,
        productName: item.product.title,
      });
    }
  };

  const handleConfirmDelete = () => {
    if (confirmModal.productId) {
      removeFromCart(confirmModal.productId);
    }
    setConfirmModal({
      isOpen: false,
      type: null,
      productId: null,
      productName: null,
    });
  };

  const handleCloseModal = () => {
    setConfirmModal({
      isOpen: false,
      type: null,
      productId: null,
      productName: null,
    });
  };

  const breadcrumbItems = [
    { label: "Trang Chủ", path: "/" },
    { label: "Giỏ Hàng", path: "/cart" },
  ];

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Breadcrumb items={breadcrumbItems} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Giỏ hàng trống
            </h3>
            <p className="text-gray-600 mb-6">
              Thêm sản phẩm vào giỏ hàng để bắt đầu mua sắm
            </p>
            <Link to="/products" className="btn-primary">
              Xem Sản Phẩm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb items={breadcrumbItems} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Giỏ Hàng</h1>
          <p className="text-gray-600">
            {getTotalItems()} sản phẩm trong giỏ hàng
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.product._id}
                    className="flex items-center space-x-4 py-4 border-b border-gray-200 last:border-b-0"
                  >
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                      {item.product.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">No Image</span>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {item.product.title}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {item.product.promotion ? (
                          <>
                            <span className="text-lg font-bold text-primary-600">
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(item.product.promotion)}
                            </span>
                            <span className="text-sm text-gray-500 line-through">
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(item.product.price)}
                            </span>
                          </>
                        ) : (
                          <span className="text-lg font-bold text-primary-600">
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(item.product.price)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          handleUpdateQuantity(
                            item.product._id,
                            item.quantity - 1
                          )
                        }
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          handleUpdateQuantity(
                            item.product._id,
                            item.quantity + 1
                          )
                        }
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-primary-600">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(
                          (item.product.promotion || item.product.price) *
                            item.quantity
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.product._id)}
                        className="text-red-600 hover:text-red-700 text-sm mt-1"
                      >
                        <Trash2 className="w-4 h-4 inline mr-1" />
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Tóm tắt đơn hàng</h2>

              <div className="space-y-3 mb-6">
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
                  <span>
                    {isCalculatingShipping ? (
                      <span className="text-gray-500 flex items-center">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500 mr-1"></div>
                        Đang tính...
                      </span>
                    ) : totalShippingFee > 0 ? (
                      <span>
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(totalShippingFee)}
                      </span>
                    ) : (
                      <span className="text-green-600">Miễn phí</span>
                    )}
                  </span>
                </div>
                {restaurantGroups.length > 1 && (
                  <div className="text-xs text-gray-500 italic mb-2">
                    * Phí ship được tính theo từng nhà hàng (
                    {restaurantGroups.length} nhà hàng)
                  </div>
                )}

                {/* Detailed shipping information */}
                {Object.keys(shippingDetails).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs font-medium text-gray-700 mb-2">
                      Chi tiết phí vận chuyển:
                    </div>
                    {restaurantGroups.map((group) => {
                      const detail = shippingDetails[group.restaurantId];
                      const restaurantName =
                        detail?.restaurantName ||
                        group.restaurantName ||
                        `Nhà hàng ${group.restaurantId}`;

                      if (!detail) {
                        return null;
                      }

                      return (
                        <div
                          key={group.restaurantId}
                          className="mb-3 last:mb-0 p-2 bg-gray-50 rounded text-xs"
                        >
                          <div className="font-medium text-gray-800 mb-1">
                            {restaurantName}
                          </div>
                          {detail.distance !== null &&
                          detail.distance !== undefined &&
                          detail.distance > 0 ? (
                            <>
                              <div className="text-gray-600 mb-1">
                                <span className="font-medium">
                                  Địa chỉ nhà hàng:
                                </span>{" "}
                                {detail.restaurantAddress ||
                                  "Chưa có thông tin"}
                              </div>
                              <div className="text-gray-600 mb-1">
                                <span className="font-medium">
                                  Địa chỉ giao hàng:
                                </span>{" "}
                                {detail.deliveryAddress || "Chưa có thông tin"}
                              </div>
                              <div className="text-gray-700 mt-1">
                                <span className="font-medium">
                                  Khoảng cách:
                                </span>{" "}
                                {parseFloat(detail.distance).toFixed(2)} km
                                <span className="ml-2 text-primary-600">
                                  • Phí ship:{" "}
                                  {new Intl.NumberFormat("vi-VN", {
                                    style: "currency",
                                    currency: "VND",
                                  }).format(
                                    shippingFees[group.restaurantId] || 20000
                                  )}
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              {detail.restaurantAddress && (
                                <div className="text-gray-600 mb-1">
                                  <span className="font-medium">
                                    Địa chỉ nhà hàng:
                                  </span>{" "}
                                  {detail.restaurantAddress}
                                </div>
                              )}
                              {detail.deliveryAddress && (
                                <div className="text-gray-600 mb-1">
                                  <span className="font-medium">
                                    Địa chỉ giao hàng:
                                  </span>{" "}
                                  {detail.deliveryAddress}
                                </div>
                              )}
                              <div className="text-gray-600">
                                Phí ship ước tính:{" "}
                                {new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(
                                  shippingFees[group.restaurantId] || 20000
                                )}
                                {detail.distance === null && (
                                  <span className="ml-1 text-gray-500">
                                    (Không thể tính khoảng cách)
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {user?.address &&
                  user.address.length > 0 &&
                  Object.keys(shippingDetails).length === 0 && (
                    <div className="text-xs text-gray-500 italic mt-2">
                      * Tính dựa trên địa chỉ mặc định của bạn (
                      {user.address.find((addr) => addr.isDefault)?.detail ||
                        user.address[0]?.detail ||
                        "địa chỉ hiện tại"}
                      )
                    </div>
                  )}
                <div className="flex justify-between">
                  <span>Giảm giá:</span>
                  <span className="text-red-600">-0đ</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Tổng cộng:</span>
                    <span className="text-primary-600">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(totalWithShipping)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 italic">
                    {user?.address && user.address.length > 0
                      ? "* Phí ship đã được tính dựa trên địa chỉ mặc định (20k/km). Bạn có thể thay đổi địa chỉ tại trang thanh toán."
                      : "* Phí ship sẽ được tính tại trang thanh toán dựa trên địa chỉ giao hàng (20k/km)"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  to="/checkout"
                  className="w-full btn-primary text-center block"
                >
                  Thanh toán
                </Link>
                <Link
                  to="/checkout-2"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors text-center"
                >
                  <AlertCircle className="w-4 h-4" />
                  Thanh toán (Test VNPay)
                </Link>
                <Link
                  to="/products"
                  className="w-full btn-secondary text-center block"
                >
                  Tiếp tục mua sắm
                </Link>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Lợi ích khi mua hàng:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Giao hàng nhanh bằng drone</li>
                  <li>• Đổi trả trong 7 ngày</li>
                  <li>• Hỗ trợ 24/7</li>
                  <li>• Bảo hành chính hãng</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={handleCloseModal}
            ></div>

            {/* Modal */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              {/* Icon */}
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {confirmModal.type === "remove"
                        ? "Xác nhận xóa sản phẩm"
                        : "Xác nhận xóa sản phẩm"}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {confirmModal.type === "remove" ? (
                          <>
                            Bạn có chắc chắn muốn xóa{" "}
                            <span className="font-semibold text-gray-900">
                              "{confirmModal.productName}"
                            </span>{" "}
                            khỏi giỏ hàng?
                          </>
                        ) : (
                          <>
                            Số lượng đang là 0. Bạn có muốn xóa{" "}
                            <span className="font-semibold text-gray-900">
                              "{confirmModal.productName}"
                            </span>{" "}
                            khỏi giỏ hàng không?
                          </>
                        )}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Hành động này không thể hoàn tác.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                <button
                  onClick={handleConfirmDelete}
                  className="w-full inline-flex justify-center items-center gap-2 rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                >
                  Xóa
                </button>
                <button
                  onClick={handleCloseModal}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
