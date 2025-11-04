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
  let decoded;
  try {
    // Basic token format check
    if (!token || typeof token !== "string" || token.split(".").length !== 3) {
      return next(
        new AppError("Invalid token format. Please log in again.", 401)
      );
    }

    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error("[Restaurant Auth] JWT verification error:", error.message);
    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Invalid token. Please log in again.", 401));
    }
    if (error.name === "TokenExpiredError") {
      return next(
        new AppError("Your token has expired. Please log in again.", 401)
      );
    }
    return next(new AppError("Token verification failed.", 401));
  }

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
