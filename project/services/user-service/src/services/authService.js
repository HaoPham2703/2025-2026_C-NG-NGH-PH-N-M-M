const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');
const User = require('../models/userModel');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const createSendToken = async (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRE) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);
  res.locals.user = user;

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

const changeState = async (user, state, statusCode, res) => {
  user.active = state;
  const message = "Cập nhật trạng thái user thành công!!!";
  await user.save({ validateBeforeSave: false });
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    data: {
      user,
    },
    message,
  });
};

const sendVerifyToken = async (user, statusCode, res) => {
  // Bỏ gửi email, trực tiếp active user
  user.active = "active";
  await user.save({ validateBeforeSave: false });

  // Gửi token JWT luôn
  createSendToken(user, statusCode, res);
};

const verifyToken = async (token) => {
  try {
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.id);
    
    if (!currentUser) {
      return { success: false, message: 'User not found' };
    }

    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return { success: false, message: 'Password changed after token issued' };
    }

    return { success: true, user: currentUser };
  } catch (error) {
    return { success: false, message: 'Invalid token' };
  }
};

module.exports = {
  signToken,
  createSendToken,
  changeState,
  sendVerifyToken,
  verifyToken
};
