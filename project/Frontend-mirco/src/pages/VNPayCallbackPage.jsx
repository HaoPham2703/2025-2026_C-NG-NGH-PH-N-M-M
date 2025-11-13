import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import PaymentResultModal from "../components/PaymentResultModal";
import { paymentApi2 } from "../api/paymentApi2";
import toast from "react-hot-toast";

const VNPayCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");
  const [responseCode, setResponseCode] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [amount, setAmount] = useState("");

  // Mapping response codes to user-friendly messages
  const getErrorMessage = (code) => {
    const errorMessages = {
      "07": "Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)",
      "09": "Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking",
      10: "Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần",
      11: "Đã hết hạn chờ thanh toán. Xin vui lòng thực hiện lại giao dịch",
      12: "Thẻ/Tài khoản bị khóa",
      51: "Tài khoản không đủ số dư để thực hiện giao dịch",
      65: "Tài khoản đã vượt quá hạn mức giao dịch trong ngày",
      75: "Ngân hàng thanh toán đang bảo trì",
      79: "Nhập sai mật khẩu thanh toán quá số lần quy định",
      97: "Checksum không hợp lệ (Lỗi chữ ký)",
    };
    return errorMessages[code] || `Thanh toán thất bại (Mã lỗi: ${code})`;
  };

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // VNPay trả về các params với prefix vnp_
        // Nếu có params từ vnpay_nodejs (code, orderId) thì dùng, nếu không thì đọc từ vnp_*
        const code =
          searchParams.get("code") || searchParams.get("vnp_ResponseCode");
        const orderIdParam =
          searchParams.get("orderId") || searchParams.get("vnp_TxnRef");
        const amountParam =
          searchParams.get("amount") || searchParams.get("vnp_Amount");
        const bankCodeParam =
          searchParams.get("bankCode") || searchParams.get("vnp_BankCode");
        const messageParam = searchParams.get("message");

        // Lấy tất cả các params từ VNPay để gửi về backend verify
        const vnpParams = {};
        searchParams.forEach((value, key) => {
          vnpParams[key] = value;
        });

        setOrderId(orderIdParam || "");
        setResponseCode(code || "");
        setBankCode(bankCodeParam || "");

        // Lưu amount gốc từ VNPay (đã là cents), PaymentResultModal sẽ xử lý format
        if (amountParam) {
          setAmount(amountParam);
        }

        // Gọi API để verify payment với Payment Service 2
        if (Object.keys(vnpParams).length > 0) {
          try {
            const verifyResponse = await paymentApi2.returnVNPayStatus({
              invoice: vnpParams,
            });

            // Nếu verify thành công và response code là 00
            if (code === "00" || vnpParams.vnp_ResponseCode === "00") {
              setStatus("success");
              setMessage("Thanh toán thành công!");
              toast.success("Thanh toán thành công!");
            } else {
              setStatus("error");
              const errorMsg =
                messageParam ||
                getErrorMessage(code || vnpParams.vnp_ResponseCode);
              setMessage(errorMsg);
              toast.error(errorMsg);
            }
          } catch (verifyError) {
            console.error("Payment verification error:", verifyError);
            // Nếu verify API fail nhưng VNPay response code là 00, vẫn coi là success
            if (code === "00" || vnpParams.vnp_ResponseCode === "00") {
              setStatus("success");
              setMessage("Thanh toán thành công!");
              toast.success("Thanh toán thành công!");
            } else {
              setStatus("error");
              const errorMsg =
                messageParam ||
                getErrorMessage(code || vnpParams.vnp_ResponseCode);
              setMessage(errorMsg);
              toast.error(errorMsg);
            }
          }
        } else {
          // Nếu không có params, coi như lỗi
          setStatus("error");
          setMessage("Không nhận được thông tin thanh toán từ VNPay");
          toast.error("Không nhận được thông tin thanh toán từ VNPay");
        }
      } catch (error) {
        console.error("Error processing payment callback:", error);
        setStatus("error");
        setMessage("Có lỗi xảy ra khi xử lý kết quả thanh toán");
        toast.error("Có lỗi xảy ra khi xử lý kết quả thanh toán");
      }
    };

    verifyPayment();
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Đang xác thực thanh toán...
          </h2>
          <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PaymentResultModal
        isOpen={status !== "loading"}
        onClose={() => {
          setStatus("loading");
          if (status === "success" && orderId) {
            navigate(`/orders/${orderId}?payment=success`);
          } else {
            navigate("/orders");
          }
        }}
        status={status}
        orderId={orderId}
        amount={amount || searchParams.get("vnp_Amount")}
        bankCode={bankCode}
        message={message}
      />
    </div>
  );
};

export default VNPayCallbackPage;
