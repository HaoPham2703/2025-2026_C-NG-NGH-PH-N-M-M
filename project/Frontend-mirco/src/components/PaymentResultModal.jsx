import { useEffect } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PaymentResultModal = ({ isOpen, onClose, status, orderId, amount, bankCode, message }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    if (status === "success" && orderId) {
      navigate(`/orders/${orderId}?payment=success`);
    } else if (status === "error") {
      navigate("/orders");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
        {/* Header */}
        <div className="flex justify-end p-4">
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 pb-8 text-center">
          {status === "success" ? (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Thanh toán thành công!
              </h2>
              <p className="text-gray-600 mb-6">{message || "Đơn hàng của bạn đã được thanh toán thành công"}</p>
              
              {(orderId || amount || bankCode) && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
                  {orderId && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Mã đơn hàng:</span>
                      <span className="font-semibold">
                        #{orderId.slice(-8).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {amount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Số tiền:</span>
                      <span className="font-semibold text-green-600">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(Number(amount) / 100)}
                      </span>
                    </div>
                  )}
                  {bankCode && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Ngân hàng:</span>
                      <span className="font-semibold">{bankCode}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Thanh toán thất bại!
              </h2>
              <p className="text-gray-600 mb-6">{message || "Có lỗi xảy ra khi thanh toán"}</p>
              
              {orderId && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Mã đơn hàng:</span>
                    <span className="font-semibold">
                      #{orderId.slice(-8).toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                status === "success"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              {status === "success" ? "Xem đơn hàng" : "Về trang đơn hàng"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentResultModal;

