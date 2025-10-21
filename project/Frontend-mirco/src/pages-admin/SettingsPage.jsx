import { Settings as SettingsIcon, Save } from "lucide-react";

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Cài đặt hệ thống</h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <SettingsIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Tính năng đang phát triển
        </h3>
        <p className="text-gray-600">
          Cài đặt hệ thống sẽ được cập nhật sớm
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;

