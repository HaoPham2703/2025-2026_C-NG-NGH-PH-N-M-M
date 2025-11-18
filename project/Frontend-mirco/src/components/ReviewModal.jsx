import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import RatingStars from './RatingStars';

/**
 * ReviewModal Component
 * Modal để tạo hoặc chỉnh sửa review cho order
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal mở/đóng
 * @param {function} props.onClose - Callback khi đóng modal
 * @param {Object} props.order - Order object (bao gồm items)
 * @param {Object} props.restaurant - Restaurant object
 * @param {Object} props.existingReview - Review hiện tại (nếu edit)
 * @param {function} props.onSubmit - Callback khi submit review
 * @param {boolean} props.loading - Đang submit
 */
const ReviewModal = ({ 
  isOpen, 
  onClose, 
  order, 
  restaurant,
  existingReview = null,
  onSubmit,
  loading = false 
}) => {
  // State cho rating tổng thể và comment
  const [orderRating, setOrderRating] = useState(existingReview?.orderRating || 0);
  const [orderComment, setOrderComment] = useState(existingReview?.orderComment || '');

  // State cho rating từng sản phẩm
  const [itemRatings, setItemRatings] = useState(() => {
    if (existingReview?.items) {
      // Nếu đang edit, load ratings có sẵn
      const ratingsMap = {};
      existingReview.items.forEach(item => {
        ratingsMap[item.product] = {
          rating: item.rating,
          comment: item.comment || ''
        };
      });
      return ratingsMap;
    }
    // Khởi tạo ratings cho từng sản phẩm trong order
    const ratingsMap = {};
    order?.items?.forEach(item => {
      ratingsMap[item.product._id] = {
        rating: 0,
        comment: ''
      };
    });
    return ratingsMap;
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleItemRatingChange = (productId, field, value) => {
    setItemRatings(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Bắt buộc phải có rating tổng thể
    if (!orderRating || orderRating < 1) {
      newErrors.orderRating = 'Vui lòng đánh giá nhà hàng';
    }

    // Comment không được quá dài
    if (orderComment.length > 500) {
      newErrors.orderComment = 'Nhận xét không được quá 500 ký tự';
    }

    // Kiểm tra comment từng sản phẩm
    Object.values(itemRatings).forEach((item, index) => {
      if (item.comment.length > 200) {
        newErrors[`item_${index}`] = 'Nhận xét sản phẩm không được quá 200 ký tự';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Chuẩn bị data để submit
    const reviewData = {
      orderRating,
      orderComment: orderComment.trim(),
      items: Object.entries(itemRatings)
        .filter(([_, data]) => data.rating > 0) // Chỉ gửi những items có rating
        .map(([productId, data]) => ({
          product: productId,
          rating: data.rating,
          comment: data.comment.trim()
        }))
    };

    onSubmit(reviewData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            {existingReview ? 'Chỉnh sửa đánh giá' : 'Đánh giá đơn hàng'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Restaurant info */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-2">Nhà hàng</h3>
            <p className="text-gray-900">{restaurant?.name || order?.restaurant?.name}</p>
          </div>

          {/* Rating tổng thể cho order/restaurant */}
          <div className="mb-6">
            <label className="block font-semibold text-gray-700 mb-2">
              Đánh giá chung <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center space-x-2">
              <RatingStars 
                value={orderRating} 
                onChange={setOrderRating}
                size="large"
              />
              {orderRating > 0 && (
                <span className="text-gray-600">
                  {orderRating === 5 ? 'Tuyệt vời!' : 
                   orderRating === 4 ? 'Rất tốt' : 
                   orderRating === 3 ? 'Tốt' : 
                   orderRating === 2 ? 'Tạm được' : 'Cần cải thiện'}
                </span>
              )}
            </div>
            {errors.orderRating && (
              <p className="text-red-500 text-sm mt-1">{errors.orderRating}</p>
            )}
          </div>

          {/* Comment tổng thể */}
          <div className="mb-6">
            <label className="block font-semibold text-gray-700 mb-2">
              Nhận xét về đơn hàng
            </label>
            <textarea
              value={orderComment}
              onChange={(e) => setOrderComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn về đơn hàng này..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">
                {orderComment.length}/500 ký tự
              </span>
              {errors.orderComment && (
                <p className="text-red-500 text-sm">{errors.orderComment}</p>
              )}
            </div>
          </div>

          {/* Đánh giá từng sản phẩm */}
          {order?.items && order.items.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">
                Đánh giá sản phẩm <span className="text-gray-500 text-sm">(Tùy chọn)</span>
              </h3>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={item.product._id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{item.product.name}</p>
                        <p className="text-sm text-gray-500">Số lượng: {item.quantity}</p>
                      </div>
                      {item.product.image && (
                        <img 
                          src={item.product.image} 
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded ml-2"
                        />
                      )}
                    </div>
                    
                    <div className="mt-3">
                      <RatingStars 
                        value={itemRatings[item.product._id]?.rating || 0}
                        onChange={(rating) => handleItemRatingChange(item.product._id, 'rating', rating)}
                        size="medium"
                      />
                    </div>

                    {itemRatings[item.product._id]?.rating > 0 && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={itemRatings[item.product._id]?.comment || ''}
                          onChange={(e) => handleItemRatingChange(item.product._id, 'comment', e.target.value)}
                          placeholder="Nhận xét về sản phẩm..."
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          maxLength={200}
                        />
                        {errors[`item_${index}`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`item_${index}`]}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || orderRating === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Đang gửi...</span>
                </>
              ) : (
                <span>{existingReview ? 'Cập nhật' : 'Gửi đánh giá'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
