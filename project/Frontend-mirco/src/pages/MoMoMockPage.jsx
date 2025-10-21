import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Smartphone, CheckCircle, XCircle, Scan } from "lucide-react";
import toast from "react-hot-toast";

const MoMoMockPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [step, setStep] = useState(1); // 1: QR, 2: OTP

  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const orderDescription = searchParams.get("orderDescription");

  const [otp, setOtp] = useState("");

  const handleScanQR = () => {
    toast.success("Đã quét mã QR!");
    setStep(2);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      if (otp === "123456") {
        setPaymentSuccess(true);
        toast.success("Thanh toán MoMo thành công!");
        
        setTimeout(() => {
          navigate(`/orders/${orderId}?payment=success`);
        }, 2000);
      } else {
        setPaymentSuccess(false);
        toast.error("Mã OTP không đúng!");
      }
      setIsProcessing(false);
    }, 1500);
  };

  const handleCancel = () => {
    toast.error("Đã hủy thanh toán");
    navigate(`/checkout`);
  };

  if (paymentSuccess === true) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-pink-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Thanh toán MoMo thành công!
          </h2>
          <p className="text-gray-600 mb-6">
            Đơn hàng của bạn đã được thanh toán qua Ví MoMo
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Mã đơn hàng:</span>
              <span className="font-semibold">#{orderId?.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Số tiền:</span>
              <span className="font-semibold text-pink-600">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(amount || 0)}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-500">Đang chuyển hướng...</p>
        </div>
      </div>
    );
  }

  if (paymentSuccess === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Thanh toán thất bại!
          </h2>
          <p className="text-gray-600 mb-6">Mã OTP không chính xác.</p>
          <button
            onClick={() => setPaymentSuccess(null)}
            className="w-full px-4 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
            <Smartphone className="w-8 h-8 text-pink-600" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">MoMo Mock</h2>
          <p className="text-pink-100">Ví điện tử giả lập cho development</p>
        </div>

        {/* Payment Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {/* Order Info */}
          <div className="mb-6 p-4 bg-pink-50 rounded-lg border border-pink-200">
            <h3 className="font-semibold text-gray-900 mb-3">Thông tin thanh toán</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Mã đơn hàng:</span>
                <span className="font-semibold">#{orderId?.slice(-8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Số tiền:</span>
                <span className="font-semibold text-pink-600">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(amount || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code Step */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-64 h-64 mx-auto bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 mb-4">
                  <div className="text-center">
                    <Scan className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Mã QR giả lập</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Quét mã QR bằng ứng dụng MoMo
                </p>
              </div>

              <button
                type="button"
                onClick={handleScanQR}
                className="w-full px-4 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors font-medium"
              >
                Giả lập quét QR
              </button>

              <button
                type="button"
                onClick={handleCancel}
                className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
              >
                Hủy thanh toán
              </button>
            </div>
          )}

          {/* OTP Step */}
          {step === 2 && (
            <form onSubmit={handlePayment} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nhập mã OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Nhập mã OTP từ ứng dụng MoMo"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 text-center text-2xl font-bold tracking-widest"
                  maxLength="6"
                  required
                />
                <p className="text-xs text-pink-600 mt-2 font-medium text-center">
                  ⚠️ Test OTP: 123456
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || otp.length < 6}
                  className="flex-1 px-4 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Smartphone size={20} />
                      Xác nhận
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">
            🧪 Mock Payment - Development Only
          </h3>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li>• Đây là trang thanh toán giả lập MoMo</li>
            <li>• Sử dụng OTP: <strong>123456</strong> để thanh toán thành công</li>
            <li>• Không có giao dịch thật nào được thực hiện</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MoMoMockPage;

