import React from 'react';
import RatingStars from './RatingStars';
import { User, Calendar, Edit2, Trash2 } from 'lucide-react';

/**
 * ReviewCard Component
 * Hiển thị một review card với thông tin user, rating, comment
 * 
 * @param {Object} props
 * @param {Object} props.review - Review object
 * @param {boolean} props.showRestaurant - Hiển thị tên restaurant
 * @param {boolean} props.showOrder - Hiển thị order ID
 * @param {boolean} props.canEdit - Cho phép edit/delete
 * @param {function} props.onEdit - Callback khi click edit
 * @param {function} props.onDelete - Callback khi click delete
 */
const ReviewCard = ({ 
  review, 
  showRestaurant = false, 
  showOrder = false,
  canEdit = false,
  onEdit = null,
  onDelete = null
}) => {
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 hover:shadow-lg transition-shadow">
      {/* Header với user info */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <User className="text-white" size={20} />
          </div>
          <div>
            <p className="font-semibold text-gray-800">
              {review.user?.name || 'Người dùng'}
            </p>
            <div className="flex items-center text-sm text-gray-500">
              <Calendar size={14} className="mr-1" />
              {formatDate(review.createdAt)}
            </div>
          </div>
        </div>

        {/* Edit/Delete buttons */}
        {canEdit && (
          <div className="flex space-x-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="text-blue-600 hover:text-blue-800 transition-colors"
                title="Chỉnh sửa"
              >
                <Edit2 size={18} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="text-red-600 hover:text-red-800 transition-colors"
                title="Xóa"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Restaurant name nếu cần */}
      {showRestaurant && review.restaurant && (
        <div className="mb-2">
          <span className="text-sm text-gray-600">Nhà hàng: </span>
          <span className="text-sm font-semibold text-gray-800">
            {review.restaurant.name}
          </span>
        </div>
      )}

      {/* Order ID nếu cần */}
      {showOrder && review.order && (
        <div className="mb-2">
          <span className="text-sm text-gray-600">Đơn hàng: </span>
          <span className="text-sm font-mono text-gray-800">
            #{review.order}
          </span>
        </div>
      )}

      {/* Rating cho order/restaurant */}
      {review.orderRating && (
        <div className="mb-3">
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">Đánh giá chung:</span>
            <RatingStars value={review.orderRating} readonly size="small" showValue />
          </div>
        </div>
      )}

      {/* Order comment */}
      {review.orderComment && (
        <div className="mb-3">
          <p className="text-gray-700 text-sm leading-relaxed">
            {review.orderComment}
          </p>
        </div>
      )}

      {/* Individual product ratings nếu có */}
      {review.items && review.items.length > 0 && (
        <div className="border-t pt-3 mt-3">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            Đánh giá sản phẩm:
          </p>
          {review.items.map((item, index) => (
            <div key={index} className="mb-2 pl-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {item.product?.name || 'Sản phẩm'}
                </span>
                <RatingStars value={item.rating} readonly size="small" />
              </div>
              {item.comment && (
                <p className="text-xs text-gray-500 mt-1 italic">
                  "{item.comment}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Rating cho product (legacy, nếu không có items) */}
      {!review.items?.length && review.product && review.rating && (
        <div className="border-t pt-3 mt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {review.product.name}
            </span>
            <RatingStars value={review.rating} readonly size="small" />
          </div>
          {review.comment && (
            <p className="text-sm text-gray-600 mt-2 italic">
              "{review.comment}"
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
