import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { reviewApi } from '../api';
import { Star, History, AlertCircle } from 'lucide-react';
import ReviewList from '../components/ReviewList';
import ReviewModal from '../components/ReviewModal';
import Breadcrumb from '../components/Breadcrumb';
import { useAuth } from '../hooks/useAuth';

const UserReviewsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [editingReview, setEditingReview] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const limit = 10;

  // Get user's reviews
  const { data: reviewsData, isLoading } = useQuery(
    ['userReviews', user?._id, currentPage],
    () => reviewApi.getUserReviews(user._id, {
      page: currentPage,
      limit,
    }),
    {
      enabled: !!user?._id,
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );

  // Delete review mutation
  const deleteReviewMutation = useMutation(
    (reviewId) => reviewApi.deleteReview(reviewId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['userReviews', user?._id]);
        alert('Đã xóa đánh giá!');
      },
      onError: (error) => {
        console.error('Delete review error:', error);
        alert(error?.response?.data?.message || 'Có lỗi xảy ra khi xóa');
      },
    }
  );

  // Update review mutation
  const updateReviewMutation = useMutation(
    ({ reviewId, data }) => reviewApi.updateReview(reviewId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['userReviews', user?._id]);
        setIsModalOpen(false);
        setEditingReview(null);
        alert('Cập nhật đánh giá thành công!');
      },
      onError: (error) => {
        console.error('Update review error:', error);
        alert(error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật');
      },
    }
  );

  const reviews = reviewsData?.data?.reviews || [];
  const pagination = reviewsData?.pagination;

  const breadcrumbItems = [
    { label: 'Trang Chủ', path: '/' },
    { label: 'Hồ sơ', path: '/profile' },
    { label: 'Đánh giá của tôi', path: '/my-reviews' },
  ];

  const handleEditReview = (review) => {
    setEditingReview(review);
    setIsModalOpen(true);
  };

  const handleDeleteReview = (reviewId) => {
    if (window.confirm('Bạn có chắc muốn xóa đánh giá này?')) {
      deleteReviewMutation.mutate(reviewId);
    }
  };

  const handleSubmitEdit = (reviewData) => {
    if (editingReview) {
      updateReviewMutation.mutate({
        reviewId: editingReview._id,
        data: reviewData,
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-4">
            Vui lòng đăng nhập để xem đánh giá của bạn
          </p>
          <a
            href="/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Đăng nhập
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb items={breadcrumbItems} />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <History className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Đánh giá của tôi
              </h1>
              <p className="text-gray-600">
                Xem và quản lý các đánh giá bạn đã viết
              </p>
            </div>
          </div>

          {/* Stats */}
          {pagination && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {pagination.total}
                  </div>
                  <div className="text-sm text-gray-600">Tổng đánh giá</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-500">
                    <Star className="inline" size={32} />
                  </div>
                  <div className="text-sm text-gray-600">Đánh giá</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reviews List */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Lịch sử đánh giá
          </h2>

          <ReviewList
            reviews={reviews}
            loading={isLoading}
            showRestaurant={true}
            showOrder={true}
            canEdit={true}
            onEdit={handleEditReview}
            onDelete={handleDeleteReview}
          />

          {/* Empty State */}
          {!isLoading && reviews.length === 0 && (
            <div className="text-center py-12">
              <Star size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-4">
                Bạn chưa có đánh giá nào
              </p>
              <a
                href="/orders"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Xem đơn hàng của bạn →
              </a>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center items-center mt-8 space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>

              <span className="text-sm text-gray-600">
                Trang {currentPage} / {pagination.pages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                disabled={currentPage === pagination.pages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Review Modal */}
      {editingReview && (
        <ReviewModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingReview(null);
          }}
          order={{
            _id: editingReview.order,
            items: editingReview.items?.map(item => ({
              product: {
                _id: item.product,
                name: item.product?.name || 'Sản phẩm',
              },
              quantity: 1,
            })) || [],
          }}
          restaurant={editingReview.restaurant}
          existingReview={editingReview}
          onSubmit={handleSubmitEdit}
          loading={updateReviewMutation.isLoading}
        />
      )}
    </div>
  );
};

export default UserReviewsPage;
