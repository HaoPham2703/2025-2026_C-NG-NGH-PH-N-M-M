import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingCart, AlertCircle, AlertTriangle } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import Breadcrumb from "../components/Breadcrumb";
import { useState } from "react";

const CartPage = () => {
  const {
    items: cartItems,
    updateQuantity,
    removeFromCart,
    getTotalPrice,
    getTotalItems,
  } = useCart();

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null, // 'remove' or 'zero'
    productId: null,
    productName: null,
  });

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
    setConfirmModal({ isOpen: false, type: null, productId: null, productName: null });
  };

  const handleCloseModal = () => {
    setConfirmModal({ isOpen: false, type: null, productId: null, productName: null });
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
                  <span className="text-green-600">Miễn phí</span>
                </div>
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
                      }).format(getTotalPrice())}
                    </span>
                  </div>
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
                  <li>• Giao hàng miễn phí</li>
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
