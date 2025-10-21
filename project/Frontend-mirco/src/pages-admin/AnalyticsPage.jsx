import { TrendingUp, BarChart3 } from "lucide-react";

const AnalyticsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Thống kê & Báo cáo</h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Tính năng đang phát triển
        </h3>
        <p className="text-gray-600">
          Thống kê chi tiết sẽ được cập nhật sớm
        </p>
      </div>
    </div>
  );
};

export default AnalyticsPage;

