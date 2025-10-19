import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { orderApi } from '../api/orderApi';
import { Package, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';

const OrdersPage = () => {
  const { data: orders, isLoading, error } = useQuery(
    'orders',
    orderApi.getOrders,
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Lỗi tải đơn hàng</h2>
          <p className="text-gray-600">Vui lòng thử lại sau</p>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: "Trang Chủ", path: "/" },
    { label: "Đơn Hàng", path: "/orders" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb items={breadcrumbItems} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Đơn Hàng Của Tôi</h1>
          <p className="text-gray-600">
            Quản lý và theo dõi tất cả đơn hàng của bạn
          </p>
        </div>

        {orders?.data?.orders?.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Chưa có đơn hàng nào
            </h3>
            <p className="text-gray-600 mb-6">
              Bắt đầu mua sắm để xem đơn hàng của bạn ở đây
            </p>
            <Link to="/products" className="btn-primary">
              Xem Sản Phẩm
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders?.data?.orders?.map((order) => (
              <div key={order._id} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(order.status)}
                      <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Đơn hàng #{order._id.slice(-8).toUpperCase()}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Thông tin giao hàng</h4>
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">{order.receiver}</p>
                      <p>{order.phone}</p>
                      <p className="mt-1">{order.address}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Sản phẩm</h4>
                    <div className="space-y-2">
                      {order.cart?.slice(0, 2).map((item, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          <p>{item.product?.title} x {item.quantity}</p>
                        </div>
                      ))}
                      {order.cart?.length > 2 && (
                        <p className="text-sm text-gray-500">
                          và {order.cart.length - 2} sản phẩm khác...
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Thanh toán</h4>
                    <div className="text-sm text-gray-600">
                      <p>Phương thức: {order.payments}</p>
                      <p className="text-lg font-bold text-primary-600 mt-1">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(order.totalPrice)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Tổng cộng: {order.cart?.length || 0} sản phẩm
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      to={`/orders/${order._id}`}
                      className="btn-secondary text-sm"
                    >
                      Xem chi tiết
                    </Link>
                    {order.status === 'Processed' && (
                      <button className="btn-primary text-sm">
                        Hủy đơn hàng
                      </button>
                    )}
                    {order.status === 'Success' && (
                      <button className="btn-primary text-sm">
                        Đặt lại
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
