import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-600">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Trang không tìm thấy
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="btn-primary inline-flex items-center"
          >
            <Home className="w-5 h-5 mr-2" />
            Về trang chủ
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn-secondary inline-flex items-center"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Quay lại
          </button>
        </div>
        
        <div className="mt-12 text-sm text-gray-500">
          <p>Nếu bạn nghĩ đây là lỗi, vui lòng liên hệ với chúng tôi.</p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
