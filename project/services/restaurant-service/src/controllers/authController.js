const jwt = require('jsonwebtoken');
const Restaurant = require('../models/restaurantModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Generate JWT Token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Send Token Response
const createSendToken = (restaurant, statusCode, res) => {
  const token = signToken(restaurant._id);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      restaurant,
    },
  });
};

// @desc    Register new restaurant
// @route   POST /api/restaurant/signup
// @access  Public
exports.signup = catchAsync(async (req, res, next) => {
  const {
    restaurantName,
    ownerName,
    email,
    password,
    phone,
    cuisine,
    description,
    address,
    city,
    district,
    ward,
  } = req.body;

  // Check if restaurant already exists
  const existingRestaurant = await Restaurant.findOne({ email });
  if (existingRestaurant) {
    return next(new AppError('Email already registered', 400));
  }

  // Create new restaurant
  const restaurant = await Restaurant.create({
    restaurantName,
    ownerName,
    email,
    password,
    phone,
    cuisine,
    description,
    address: {
      detail: address,
      ward,
      district,
      city,
    },
  });

  createSendToken(restaurant, 201, res);
});

// @desc    Login restaurant
// @route   POST /api/restaurant/login
// @access  Public
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Check if restaurant exists && password is correct
  const restaurant = await Restaurant.findOne({ email }).select('+password');

  if (!restaurant || !(await restaurant.comparePassword(password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // Check if restaurant is active
  if (restaurant.status === 'suspended') {
    return next(new AppError('Your account has been suspended', 403));
  }

  createSendToken(restaurant, 200, res);
});

// @desc    Logout restaurant
// @route   POST /api/restaurant/logout
// @access  Private
exports.logout = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
});

// @desc    Change password
// @route   POST /api/restaurant/change-password
// @access  Private
exports.changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // Get restaurant with password
  const restaurant = await Restaurant.findById(req.restaurant.id).select('+password');

  // Check if current password is correct
  if (!(await restaurant.comparePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect', 401));
  }

  // Update password
  restaurant.password = newPassword;
  await restaurant.save();

  createSendToken(restaurant, 200, res);
});

// @desc    Get current restaurant
// @route   GET /api/restaurant/me
// @access  Private
exports.getMe = catchAsync(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.restaurant.id);

  res.status(200).json({
    status: 'success',
    data: {
      restaurant,
    },
  });
});

