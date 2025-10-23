const Restaurant = require('../models/restaurantModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// @desc    Get restaurant profile
// @route   GET /api/restaurant/profile
// @access  Private
exports.getProfile = catchAsync(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.restaurant.id);

  if (!restaurant) {
    return next(new AppError('Restaurant not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      restaurant,
    },
  });
});

// @desc    Update restaurant profile
// @route   PUT /api/restaurant/profile
// @access  Private
exports.updateProfile = catchAsync(async (req, res, next) => {
  const {
    restaurantName,
    ownerName,
    phone,
    cuisine,
    description,
    address,
    ward,
    district,
    city,
  } = req.body;

  const updateData = {};

  if (restaurantName) updateData.restaurantName = restaurantName;
  if (ownerName) updateData.ownerName = ownerName;
  if (phone) updateData.phone = phone;
  if (cuisine) updateData.cuisine = cuisine;
  if (description !== undefined) updateData.description = description;

  if (address || ward || district || city) {
    updateData.address = {
      detail: address,
      ward,
      district,
      city,
    };
  }

  const restaurant = await Restaurant.findByIdAndUpdate(
    req.restaurant.id,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!restaurant) {
    return next(new AppError('Restaurant not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      restaurant,
    },
  });
});

// @desc    Update business hours
// @route   PUT /api/restaurant/business-hours
// @access  Private
exports.updateBusinessHours = catchAsync(async (req, res, next) => {
  const { businessHours } = req.body;

  const restaurant = await Restaurant.findByIdAndUpdate(
    req.restaurant.id,
    { businessHours },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!restaurant) {
    return next(new AppError('Restaurant not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      restaurant,
    },
  });
});

// @desc    Update notification settings
// @route   PUT /api/restaurant/notification-settings
// @access  Private
exports.updateNotificationSettings = catchAsync(async (req, res, next) => {
  const { notificationSettings } = req.body;

  const restaurant = await Restaurant.findByIdAndUpdate(
    req.restaurant.id,
    { notificationSettings },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!restaurant) {
    return next(new AppError('Restaurant not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      restaurant,
    },
  });
});

// @desc    Get restaurant stats
// @route   GET /api/restaurant/stats
// @access  Private
exports.getStats = catchAsync(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.restaurant.id);

  if (!restaurant) {
    return next(new AppError('Restaurant not found', 404));
  }

  const stats = {
    totalOrders: restaurant.totalOrders,
    totalRevenue: restaurant.totalRevenue,
    rating: restaurant.rating,
    status: restaurant.status,
  };

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

