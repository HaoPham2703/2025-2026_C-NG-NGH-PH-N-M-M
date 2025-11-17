import React from 'react';
import ReviewCard from './ReviewCard';
import { AlertCircle, Filter } from 'lucide-react';

/**
 * ReviewList Component
 * Hiển thị danh sách reviews với pagination và filter
 * 
 * @param {Object} props
 * @param {Array} props.reviews - Mảng reviews
 * @param {boolean} props.loading - Đang load
 * @param {boolean} props.showRestaurant - Hiển thị tên restaurant
 * @param {boolean} props.showOrder - Hiển thị order ID
 * @param {boolean} props.canEdit - Cho phép edit/delete
 * @param {function} props.onEdit - Callback khi edit review
 * @param {function} props.onDelete - Callback khi delete review
 * @param {function} props.onFilterChange - Callback khi thay đổi filter
 * @param {number} props.currentRating - Rating đang filter
 */
const ReviewList = ({ 
  reviews = [], 
  loading = false,
  showRestaurant = false,
  showOrder = false,
  canEdit = false,
  onEdit = null,
  onDelete = null,
  onFilterChange = null,
  currentRating = null
}) => {
  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Empty state
  if (!reviews || reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle size={48} className="text-gray-400 mb-4" />
        <p className="text-gray-500 text-lg">Chưa có đánh giá nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter buttons nếu có */}
      {onFilterChange && (
        <div className="flex items-center space-x-2 mb-6 flex-wrap">
          <Filter size={20} className="text-gray-600" />
          <span className="text-sm text-gray-600 mr-2">Lọc theo:</span>
          
          <button
            onClick={() => onFilterChange(null)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              currentRating === null 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Tất cả
          </button>
          
          {[5, 4, 3, 2, 1].map(rating => (
            <button
              key={rating}
              onClick={() => onFilterChange(rating)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                currentRating === rating 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {rating} ⭐
            </button>
          ))}
        </div>
      )}

      {/* List of reviews */}
      <div>
        {reviews.map((review) => (
          <ReviewCard
            key={review._id}
            review={review}
            showRestaurant={showRestaurant}
            showOrder={showOrder}
            canEdit={canEdit}
            onEdit={onEdit ? () => onEdit(review) : null}
            onDelete={onDelete ? () => onDelete(review._id) : null}
          />
        ))}
      </div>
    </div>
  );
};

export default ReviewList;
