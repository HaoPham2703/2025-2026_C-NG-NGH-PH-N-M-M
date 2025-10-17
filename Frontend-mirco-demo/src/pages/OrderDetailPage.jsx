import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { orderApi } from '../api/orderApi';
import { Package, Clock, CheckCircle, XCircle, Truck, MapPin, Phone, User } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';

const OrderDetailPage = () => {
  const { id } = useParams();

  const { data: order, isLoading, error } = useQuery(
    ['order', id],
    () => orderApi.getOrder(id),
    {
      refetchOnWindowFocus: false,
    }
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Processed':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'Waiting Goods':
        return <Package className="w-5 h-5 text-yellow-500" />;
      case 'Delivery':
        return <Truck className="w-5 h-5 text-purple-500" />;
      case 'Success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'Cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Processed':
        return 'Đã xử lý';
      case 'Waiting Goods':
        return 'Chờ hàng';
      case 'Delivery':
        return 'Đang giao';
      case 'Success':
        return 'Thành công';
      case 'Cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Processed':
        return 'bg-blue-100 text-blue-800';
      case 'Waiting Goods':
        return 'bg-yellow-100 text-yellow-800';
      case 'Delivery':
        return 'bg-purple-100 text-purple-800';
      case 'Success':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !order?.data?.order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Đơn hàng không tồn tại</h2>
          <p className="text-gray-600">Vui lòng thử lại sau</p>
        </div>
      </div>
    );
  }

  const orderData = order.data.order;

  const breadcrumbItems = [
    { label: "Trang Chủ", path: "/" },
    { label: "Đơn Hàng", path: "/orders" },
    { label: `Đơn hàng #${orderData._id.slice(-8).toUpperCase()}`, path: `/orders/${id}` },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb items={breadcrumbItems} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Chi tiết đơn hàng #{orderData._id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-gray-600">
            Đặt hàng lúc {new Date(orderData.createdAt).toLocaleString('vi-VN')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Trạng thái đơn hàng</h2>
              <div className="flex items-center space-x-4">
                {getStatusIcon(orderData.status)}
                <div>
                  <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(orderData.status)}`}>
                    {getStatusText(orderData.status)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Cập nhật lần cuối: {new Date(orderData.updatedAt || orderData.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Sản phẩm đã đặt</h2>
              <div className="space-y-4">
                {orderData.cart?.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 py-4 border-b border-gray-200 last:border-b-0">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                      {item.product?.images?.[0] ? (
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
                      <h3 className="font-medium text-gray-900">{item.product?.title}</h3>
                      <p className="text-sm text-gray-600">
                        Số lượng: {item.quantity}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-medium text-primary-600">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format((item.product?.promotion || item.product?.price || 0) * item.quantity)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(item.product?.promotion || item.product?.price || 0)} / sản phẩm
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Info */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Thông tin giao hàng</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{orderData.receiver}</p>
                    <p className="text-sm text-gray-600">Người nhận</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{orderData.phone}</p>
                    <p className="text-sm text-gray-600">Số điện thoại</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">{orderData.address}</p>
                    <p className="text-sm text-gray-600">Địa chỉ giao hàng</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="card sticky top-8">
              <h2 className="text-xl font-semibold mb-4">Tóm tắt đơn hàng</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span>Tạm tính:</span>
                  <span>
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(orderData.totalPrice)}
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
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(orderData.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-1">Phương thức thanh toán</p>
                  <p className="text-sm text-gray-600">
                    {orderData.payments === 'cash' ? 'Thanh toán khi nhận hàng' : 
                     orderData.payments === 'vnpay' ? 'VNPay' :
                     orderData.payments === 'momo' ? 'MoMo' : orderData.payments}
                  </p>
                </div>

                {orderData.status === 'Processed' && (
                  <button className="w-full btn-primary">
                    Hủy đơn hàng
                  </button>
                )}
                
                {orderData.status === 'Success' && (
                  <button className="w-full btn-primary">
                    Đặt lại
                  </button>
                )}

                <button className="w-full btn-secondary">
                  Liên hệ hỗ trợ
                </button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Thông tin hỗ trợ</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>Hotline: 1900 1234</p>
                  <p>Email: support@foodfast.com</p>
                  <p>Thời gian: 24/7</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
