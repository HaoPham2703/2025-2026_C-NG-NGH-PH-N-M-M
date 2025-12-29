import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { userApi } from "../api/userApi";
import {
  Users,
  Search,
  UserPlus,
  Eye,
  Edit,
  Trash2,
  Shield,
  Ban,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import Pagination from "./components/Pagination";

const CustomersManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery("allUsers", () =>
    userApi.getTableUser()
  );

  const deleteUserMutation = useMutation(
    (userId) => userApi.deleteUser(userId),
    {
      onSuccess: () => {
        toast.success("Đã xóa người dùng!");
        queryClient.invalidateQueries("allUsers");
        setShowDeleteModal(false);
        setUserToDelete(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Xóa thất bại!");
      },
    }
  );

  const filteredUsers = users?.data?.users?.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Pagination
  const totalPages = Math.ceil((filteredUsers?.length || 0) / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredUsers?.slice(start, end);
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Reset to page 1 when filter changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    deleteUserMutation.mutate(userToDelete._id);
  };

  const getRoleBadge = (role) => {
    if (role === "admin") return "bg-purple-100 text-purple-800";
    return "bg-blue-100 text-blue-800";
  };

  const getRoleText = (role) => {
    if (role === "admin") return "Quản trị viên";
    return "Người dùng";
  };

  const getStatusBadge = (active) => {
    if (active === "active") return "bg-green-100 text-green-800";
    if (active === "ban") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  const getStatusText = (active) => {
    if (active === "active") return "Hoạt động";
    if (active === "ban") return "Bị khóa";
    return active;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Quản lý khách hàng
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Hiển thị {filteredUsers?.length || 0} /{" "}
            {users?.data?.users?.length || 0} người dùng
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, email..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full sm:w-64"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
          >
            <option value="all">Tất cả</option>
            <option value="user">Người dùng</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người dùng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vai trò
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số dư
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUsers?.map((user) => (
                <tr
                  key={user._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-semibold text-sm">
                            {user.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        {user.phone && (
                          <div className="text-xs text-gray-500">
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadge(
                        user.role
                      )}`}
                    >
                      {getRoleText(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                        user.active
                      )}`}
                    >
                      {getStatusText(user.active)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(user.balance || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="text-primary-600 hover:text-primary-900 transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredUsers?.length || 0}
            itemsPerPage={itemsPerPage}
          />
        </div>

        {/* Empty State */}
        {filteredUsers?.length === 0 && (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không tìm thấy người dùng
            </h3>
            <p className="text-gray-600">
              {searchTerm || roleFilter !== "all"
                ? "Không có người dùng nào khớp với bộ lọc"
                : "Chưa có người dùng nào trong hệ thống"}
            </p>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setSelectedUser(null)}
            ></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-gradient-to-r from-primary-50 to-primary-100 px-6 py-4 border-b border-primary-200">
                <h3 className="text-lg font-bold text-gray-900">
                  Chi tiết người dùng
                </h3>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-6">
                  {/* Avatar & Name */}
                  <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
                    <div className="h-20 w-20 rounded-full bg-primary-200 flex items-center justify-center">
                      <span className="text-primary-600 font-bold text-2xl">
                        {selectedUser.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900">
                        {selectedUser.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {selectedUser.email}
                      </p>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Vai trò</p>
                      <span
                        className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${getRoleBadge(
                          selectedUser.role
                        )}`}
                      >
                        {getRoleText(selectedUser.role)}
                      </span>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Trạng thái</p>
                      <span
                        className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${getStatusBadge(
                          selectedUser.active
                        )}`}
                      >
                        {getStatusText(selectedUser.active)}
                      </span>
                    </div>

                    {selectedUser.phone && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">
                          Số điện thoại
                        </p>
                        <p className="font-semibold text-gray-900">
                          {selectedUser.phone}
                        </p>
                      </div>
                    )}

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Số dư</p>
                      <p className="font-semibold text-gray-900">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(selectedUser.balance || 0)}
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Ngày tạo</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(selectedUser.createdAt).toLocaleDateString(
                          "vi-VN"
                        )}
                      </p>
                    </div>

                    {selectedUser.gender && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Giới tính</p>
                        <p className="font-semibold text-gray-900">
                          {selectedUser.gender}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Addresses */}
                  {selectedUser.address && selectedUser.address.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Địa chỉ ({selectedUser.address.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedUser.address.map((addr, index) => (
                          <div
                            key={index}
                            className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex items-start justify-between mb-1">
                              <span className="font-medium text-sm">
                                {addr.name}
                              </span>
                              {addr.setDefault && (
                                <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">
                                  Mặc định
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600">
                              {addr.phone}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {addr.detail}, {addr.ward}, {addr.district},{" "}
                              {addr.province}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        itemName={userToDelete?.name}
        itemType="người dùng"
      />
    </div>
  );
};

export default CustomersManagementPage;
