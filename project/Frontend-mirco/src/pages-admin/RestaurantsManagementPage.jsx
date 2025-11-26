import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { restaurantApi } from "../api/restaurantApi";
import {
  Store,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Ban,
  Filter,
} from "lucide-react";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import RestaurantModal from "./components/RestaurantModal";
import Pagination from "./components/Pagination";
import toast from "react-hot-toast";

const RestaurantsManagementPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'view', 'edit', 'create'
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [restaurantToDelete, setRestaurantToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Fetch restaurants with filters
  const { data: restaurantsData, isLoading } = useQuery(
    ["restaurants", currentPage, statusFilter, searchTerm],
    () =>
      restaurantApi.getRestaurants({
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchTerm || undefined,
      })
  );

  // Fetch stats
  const { data: statsData } = useQuery(
    "restaurantStats",
    restaurantApi.getRestaurantStats
  );

  const restaurants = restaurantsData?.data?.restaurants || [];
  const pagination = restaurantsData?.data?.pagination;

  const handleView = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setModalMode("view");
  };

  const handleEdit = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setModalMode("edit");
  };

  const handleCreate = () => {
    setSelectedRestaurant(null);
    setModalMode("create");
  };

  const handleDeleteClick = (restaurant) => {
    setRestaurantToDelete(restaurant);
    setShowDeleteModal(true);
  };

  // Delete mutation
  const deleteMutation = useMutation(
    (restaurantId) => restaurantApi.deleteRestaurant(restaurantId),
    {
      onSuccess: (data) => {
        toast.success("Xóa nhà hàng thành công!");
        
        // Show info about order handling if available
        if (data?.data?.orderHandling) {
          const handling = data.data.orderHandling;
          if (handling.totalOrders > 0) {
            toast.success(
              `Đã xử lý ${handling.ordersProcessed || 0} đơn hàng và hoàn tiền ${handling.refundsProcessed || 0} đơn.`,
              { duration: 5000 }
            );
          }
        }
        
        queryClient.invalidateQueries("restaurants");
        queryClient.invalidateQueries("restaurantStats");
        setShowDeleteModal(false);
        setRestaurantToDelete(null);
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Xóa nhà hàng thất bại!"
        );
      },
    }
  );

  const handleDeleteConfirm = () => {
    if (restaurantToDelete) {
      deleteMutation.mutate(restaurantToDelete._id);
    }
  };

  // Status update mutation
  const statusMutation = useMutation(
    ({ id, status }) => restaurantApi.updateRestaurantStatus(id, status),
    {
      onSuccess: () => {
        toast.success("Cập nhật trạng thái thành công!");
        queryClient.invalidateQueries("restaurants");
        queryClient.invalidateQueries("restaurantStats");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Cập nhật trạng thái thất bại!"
        );
      },
    }
  );

  // Verify mutation
  const verifyMutation = useMutation(
    (id) => restaurantApi.verifyRestaurant(id),
    {
      onSuccess: () => {
        toast.success("Xác minh nhà hàng thành công!");
        queryClient.invalidateQueries("restaurants");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Xác minh nhà hàng thất bại!"
        );
      },
    }
  );

  const handleStatusChange = (restaurant, newStatus) => {
    statusMutation.mutate({ id: restaurant._id, status: newStatus });
  };

  const handleVerify = (restaurant) => {
    verifyMutation.mutate(restaurant._id);
  };

  const closeModal = () => {
    setSelectedRestaurant(null);
    setModalMode(null);
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: CheckCircle,
        label: "Đang hoạt động",
      },
      inactive: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        icon: XCircle,
        label: "Ngừng hoạt động",
      },
      suspended: {
        bg: "bg-red-100",
        text: "text-red-800",
        icon: Ban,
        label: "Bị khóa",
      },
    };

    const badge = badges[status] || badges.inactive;
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
      >
        <Icon size={12} />
        {badge.label}
      </span>
    );
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
      {/* Header with Stats */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Quản lý nhà hàng
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {pagination?.total || 0} nhà hàng trong hệ thống
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Thêm nhà hàng</span>
          </button>
        </div>

        {/* Stats Cards */}
        {statsData?.data?.stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Tổng số</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsData.data.stats.total}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Đang hoạt động</p>
              <p className="text-2xl font-bold text-green-600">
                {statsData.data.stats.active}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Ngừng hoạt động</p>
              <p className="text-2xl font-bold text-gray-600">
                {statsData.data.stats.inactive}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Bị khóa</p>
              <p className="text-2xl font-bold text-red-600">
                {statsData.data.stats.suspended}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Đã xác minh</p>
              <p className="text-2xl font-bold text-blue-600">
                {statsData.data.stats.verified}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm kiếm nhà hàng..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div className="relative">
          <Filter
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Ngừng hoạt động</option>
            <option value="suspended">Bị khóa</option>
          </select>
        </div>
      </div>

      {/* Restaurants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.map((restaurant) => (
          <div
            key={restaurant._id}
            className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100"
          >
            {/* Logo/Image */}
            <div className="relative h-48 bg-gray-100 overflow-hidden">
              {restaurant.logo ? (
                <img
                  src={restaurant.logo}
                  alt={restaurant.restaurantName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Store className="w-16 h-16 text-gray-300" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                {getStatusBadge(restaurant.status)}
              </div>
              {restaurant.verified && (
                <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                  <CheckCircle size={12} />
                  Đã xác minh
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1 truncate">
                {restaurant.restaurantName}
              </h3>
              <p className="text-sm text-gray-600 mb-2">{restaurant.email}</p>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                {restaurant.description || "Không có mô tả"}
              </p>

              {/* Meta Info */}
              <div className="space-y-2 mb-4">
                <div className="text-xs text-gray-600">
                  <strong>Chủ sở hữu:</strong> {restaurant.ownerName}
                </div>
                <div className="text-xs text-gray-600">
                  <strong>Điện thoại:</strong> {restaurant.phone}
                </div>
                {restaurant.address?.city && (
                  <div className="text-xs text-gray-600">
                    <strong>Địa chỉ:</strong> {restaurant.address.city}
                  </div>
                )}
                {restaurant.cuisine && (
                  <div className="text-xs text-gray-600">
                    <strong>Loại hình:</strong> {restaurant.cuisine}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleView(restaurant)}
                  className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-1 text-xs"
                >
                  <Eye size={14} />
                  Xem
                </button>
                <button
                  onClick={() => handleEdit(restaurant)}
                  className="flex-1 px-3 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg transition-colors flex items-center justify-center gap-1 text-xs"
                >
                  <Edit size={14} />
                  Sửa
                </button>
                {!restaurant.verified && (
                  <button
                    onClick={() => handleVerify(restaurant)}
                    className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-xs"
                    title="Xác minh"
                  >
                    <CheckCircle size={14} />
                  </button>
                )}
                <button
                  onClick={() => handleDeleteClick(restaurant)}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors"
                  title="Xóa"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Status Actions */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-600 mb-2">Thay đổi trạng thái:</div>
                <div className="flex gap-2 flex-wrap">
                  {restaurant.status !== "active" && (
                    <button
                      onClick={() => handleStatusChange(restaurant, "active")}
                      className="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded text-xs"
                    >
                      Kích hoạt
                    </button>
                  )}
                  {restaurant.status !== "inactive" && (
                    <button
                      onClick={() => handleStatusChange(restaurant, "inactive")}
                      className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded text-xs"
                    >
                      Ngừng
                    </button>
                  )}
                  {restaurant.status !== "suspended" && (
                    <button
                      onClick={() => handleStatusChange(restaurant, "suspended")}
                      className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-xs"
                    >
                      Khóa
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.pages}
          onPageChange={setCurrentPage}
          totalItems={pagination.total}
          itemsPerPage={itemsPerPage}
        />
      )}

      {/* Empty State */}
      {restaurants.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Không tìm thấy nhà hàng
          </h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== "all"
              ? "Không có nhà hàng nào khớp với bộ lọc"
              : "Chưa có nhà hàng nào trong hệ thống"}
          </p>
        </div>
      )}

      {/* Modals */}
      <RestaurantModal
        key={`${modalMode}-${selectedRestaurant?._id || "new"}`}
        isOpen={modalMode !== null}
        onClose={closeModal}
        restaurant={selectedRestaurant}
        mode={modalMode}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        itemName={restaurantToDelete?.restaurantName}
        itemType="nhà hàng"
        isLoading={deleteMutation.isLoading}
        warningMessage="Việc xóa nhà hàng sẽ tự động hủy các đơn hàng chưa hoàn thành và hoàn tiền cho khách hàng nếu đã thanh toán."
      />
    </div>
  );
};

export default RestaurantsManagementPage;
