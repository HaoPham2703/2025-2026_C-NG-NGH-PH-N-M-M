import { useState } from "react";
import { paymentApi } from "../api/paymentApi";
import toast from "react-hot-toast";
import { CreditCard, Loader2 } from "lucide-react";

const VNPayTestPage = () => {
  const [formData, setFormData] = useState({
    orderType: "other",
    amount: 10000,
    orderInfo: `Thanh toan don hang thoi gian: ${new Date().toLocaleString(
      "vi-VN"
    )}`,
    bankCode: "",
    locale: "vn",
  });

  const [isLoading, setIsLoading] = useState(false);

  // Loại hàng hóa
  const orderTypes = [
    { value: "other", label: "Merchant bán vé" },
    { value: "topup", label: "Nạp tiền điện thoại" },
    { value: "billpayment", label: "Thanh toán hóa đơn" },
    { value: "fashion", label: "Thời trang" },
  ];

  // Danh sách ngân hàng (theo trang demo VNPay)
  const banks = [
    { value: "", label: "Không chọn" },
    { value: "QRONLY", label: "Thanh toan QRONLY" },
    { value: "VNBANK", label: "Ung dung MobileBanking" },
    { value: "VNPAYQR", label: "VNPAYQR" },
    { value: "LOCAL", label: "LOCAL BANK" },
    { value: "IB", label: "INTERNET BANKING" },
    { value: "ATM", label: "ATM CARD" },
    { value: "INTCARD", label: "INTERNATIONAL CARD" },
    { value: "VISA", label: "VISA" },
    { value: "MASTERCARD", label: "MASTERCARD" },
    { value: "JCB", label: "JCB" },
    { value: "UPI", label: "UPI" },
    { value: "VIB", label: "VIB" },
    { value: "VIETCAPITALBANK", label: "VIETCAPITALBANK" },
    { value: "SCB", label: "Ngan hang SCB" },
    { value: "NCB", label: "Ngan hang NCB" },
    { value: "SACOMBANK", label: "Ngan hang SacomBank" },
    { value: "EXIMBANK", label: "Ngan hang EximBank" },
    { value: "MSBANK", label: "Ngan hang MSBANK" },
    { value: "NAMABANK", label: "Ngan hang NamABank" },
    { value: "VNMART", label: "Vi dien tu VnMart" },
    { value: "VIETINBANK", label: "Ngan hang Vietinbank" },
    { value: "VIETCOMBANK", label: "Ngan hang VCB" },
    { value: "HDBANK", label: "Ngan hang HDBank" },
    { value: "DONGABANK", label: "Ngan hang Dong A" },
    { value: "TPBANK", label: "Ngân hàng TPBank" },
    { value: "OCEANBANK", label: "Ngân hàng OceanBank" },
    { value: "BIDV", label: "Ngân hàng BIDV" },
    { value: "TECHCOMBANK", label: "Ngân hàng Techcombank" },
    { value: "VPBANK", label: "Ngan hang VPBank" },
    { value: "AGRIBANK", label: "Ngan hang Agribank" },
    { value: "MBBANK", label: "Ngan hang MBBank" },
    { value: "ACB", label: "Ngan hang ACB" },
    { value: "OCB", label: "Ngan hang OCB" },
    { value: "IVB", label: "Ngan hang IVB" },
    { value: "SHB", label: "Ngan hang SHB" },
    { value: "APPLEPAY", label: "Apple Pay" },
    { value: "GOOGLEPAY", label: "Google Pay" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Tạo orderId ngẫu nhiên
      const orderId = `TEST${Date.now()}`;

      // Gọi API để tạo VNPay payment URL
      const paymentResponse = await paymentApi.createVNPayUrl({
        amount: Number(formData.amount),
        action: formData.orderInfo,
        bankCode: formData.bankCode || undefined,
        orderType: formData.orderType,
        locale: formData.locale,
      });

      if (paymentResponse.status === "success" && paymentResponse.vnpUrl) {
        // Redirect đến VNPay
        window.location.href = paymentResponse.vnpUrl;
      } else {
        toast.error("Không thể tạo link thanh toán VNPay");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("VNPay error:", error);
      toast.error(
        error.response?.data?.message ||
          "Có lỗi xảy ra khi tạo thanh toán VNPay"
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Tạo mới đơn hàng
            </h1>
            <p className="text-sm text-gray-600">
              VNPay Payment Test - Giống trang demo VNPay
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Loại hàng hóa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại hàng hóa
              </label>
              <select
                name="orderType"
                value={formData.orderType}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {orderTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Số tiền */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số tiền
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                min="1000"
                step="1000"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Nhập số tiền (VND)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Số tiền tối thiểu: 1,000 VND
              </p>
            </div>

            {/* Nội dung thanh toán */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nội dung thanh toán
              </label>
              <textarea
                name="orderInfo"
                value={formData.orderInfo}
                onChange={handleInputChange}
                rows={3}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Nhập nội dung thanh toán"
              />
            </div>

            {/* Ngân hàng */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngân hàng
              </label>
              <select
                name="bankCode"
                value={formData.bankCode}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {banks.map((bank) => (
                  <option key={bank.value} value={bank.value}>
                    {bank.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Chọn "Không chọn" để chọn ngân hàng sau trên trang VNPay
              </p>
            </div>

            {/* Ngôn ngữ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngôn ngữ
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="locale"
                    value="vn"
                    checked={formData.locale === "vn"}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span>Tiếng Việt</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="locale"
                    value="en"
                    checked={formData.locale === "en"}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span>English</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Thanh toán Redirect
                </>
              )}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">
              ℹ️ Thông tin
            </h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Trang này giống với trang demo VNPay</li>
              <li>• Sử dụng để test thanh toán VNPay</li>
              <li>
                • Sau khi click "Thanh toán Redirect", bạn sẽ được chuyển đến
                trang thanh toán VNPay
              </li>
              <li>
                • Tham khảo:{" "}
                <a
                  href="https://sandbox.vnpayment.vn/tryitnow/Home/CreateOrder"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  VNPay Demo
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VNPayTestPage;
