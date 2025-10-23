const jwt = require("jsonwebtoken");
const Restaurant = require("../models/restaurantModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Get token
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  // 2) Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 3) Check if restaurant still exists
  const restaurant = await Restaurant.findById(decoded.id);
  if (!restaurant) {
    return next(
      new AppError(
        "The restaurant belonging to this token no longer exists.",
        401
      )
    );
  }

  // 4) Check if restaurant is active
  if (restaurant.status === "suspended") {
    return next(new AppError("Your account has been suspended.", 403));
  }

  // Grant access to protected route
  req.restaurant = restaurant;
  next();
});

