import { Users, Search, UserPlus } from "lucide-react";

const CustomersManagementPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý khách hàng</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          <UserPlus size={20} />
          Thêm khách hàng
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Tính năng đang phát triển
        </h3>
        <p className="text-gray-600">
          Quản lý khách hàng sẽ được cập nhật sớm
        </p>
      </div>
    </div>
  );
};

export default CustomersManagementPage;

