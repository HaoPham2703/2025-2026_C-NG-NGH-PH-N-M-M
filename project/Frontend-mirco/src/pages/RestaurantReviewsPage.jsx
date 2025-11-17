import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { reviewApi } from '../api';
import { Star, TrendingUp, Users, Filter as FilterIcon } from 'lucide-react';
import ReviewList from '../components/ReviewList';
import RatingStars from '../components/RatingStars';
import Breadcrumb from '../components/Breadcrumb';

const RestaurantReviewsPage = () => {
  const { restaurantId } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const limit = 10;

  // Get restaurant stats
  const { data: statsData, isLoading: isLoadingStats } = useQuery(
    ['restaurantStats', restaurantId],
    () => reviewApi.getRestaurantStats(restaurantId),
    {
      refetchOnWindowFocus: false,
    }
  );

  // Get reviews
  const { data: reviewsData, isLoading: isLoadingReviews } = useQuery(
    ['restaurantReviews', restaurantId, currentPage, ratingFilter, sortBy],
    () => reviewApi.getRestaurantReviews(restaurantId, {
      page: currentPage,
      limit,
      ...(ratingFilter && { rating: ratingFilter }),
      sort: sortBy,
    }),
    {
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );

  const stats = statsData?.data;
  const reviews = reviewsData?.data?.reviews || [];
  const pagination = reviewsData?.pagination;

  const breadcrumbItems = [
    { label: 'Trang Chủ', path: '/' },
    { label: 'Đánh giá nhà hàng', path: `/restaurants/${restaurantId}/reviews` },
  ];

  const handleFilterChange = (rating) => {
    setRatingFilter(rating);
    setCurrentPage(1);
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb items={breadcrumbItems} />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Đánh giá nhà hàng
          </h1>
          <p className="text-gray-600">
            Xem những đánh giá từ khách hàng
          </p>
        </div>

        {/* Statistics Section */}
        {isLoadingStats ? (
          <div className="bg-white rounded-xl shadow-md p-8 mb-8">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ) : stats ? (
          <div className="bg-white rounded-xl shadow-md p-8 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Overall Rating */}
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start mb-4">
                  <div className="text-6xl font-bold text-yellow-500">
                    {stats.averageRating.toFixed(1)}
                  </div>
                  <div className="ml-4">
                    <RatingStars 
                      value={stats.averageRating} 
                      readonly 
                      size="large" 
                    />
                    <p className="text-gray-600 mt-2 flex items-center">
                      <Users size={16} className="mr-1" />
                      {stats.totalReviews} đánh giá
                    </p>
                  </div>
                </div>
              </div>

              {/* Rating Distribution */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-4">Phân bố đánh giá</h3>
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = stats.distribution[rating] || 0;
                  const percentage = stats.totalReviews > 0
                    ? (count / stats.totalReviews) * 100
                    : 0;

                  return (
                    <div key={rating} className="flex items-center mb-2">
                      <span className="text-sm text-gray-600 w-12">{rating} ⭐</span>
                      <div className="flex-1 mx-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {/* Filters and Sort */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Rating Filter */}
            <div className="flex items-center space-x-2 flex-wrap">
              <FilterIcon size={20} className="text-gray-600" />
              <span className="text-sm text-gray-600 mr-2">Lọc:</span>
              
              <button
                onClick={() => handleFilterChange(null)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  ratingFilter === null 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Tất cả
              </button>
              
              {[5, 4, 3, 2, 1].map(rating => (
                <button
                  key={rating}
                  onClick={() => handleFilterChange(rating)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    ratingFilter === rating 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {rating} ⭐
                </button>
              ))}
            </div>

            {/* Sort Options */}
            <div className="flex items-center space-x-2">
              <TrendingUp size={20} className="text-gray-600" />
              <span className="text-sm text-gray-600 mr-2">Sắp xếp:</span>
              
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="highest">Rating cao nhất</option>
                <option value="lowest">Rating thấp nhất</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Tất cả đánh giá ({pagination?.total || 0})
          </h2>

          <ReviewList
            reviews={reviews}
            loading={isLoadingReviews}
            showRestaurant={false}
            showOrder={false}
            canEdit={false}
          />

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
    </div>
  );
};

export default RestaurantReviewsPage;
