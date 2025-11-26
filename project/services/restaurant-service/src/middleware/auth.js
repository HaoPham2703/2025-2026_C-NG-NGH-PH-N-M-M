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

// Admin authentication middleware
// This is used when API Gateway forwards admin requests with x-user header
exports.requireAdmin = catchAsync(async (req, res, next) => {
  // Check if user info is passed from API Gateway
  let user = null;

  // Try to get user from x-user header (from API Gateway)
  if (req.headers["x-user"]) {
    try {
      const userJson = Buffer.from(req.headers["x-user"], "base64").toString(
        "utf-8"
      );
      user = JSON.parse(userJson);
    } catch (error) {
      console.error("[Admin Auth] Error parsing x-user header:", error);
    }
  }

  // If no user from header, try to verify token directly (fallback)
  if (!user) {
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

    try {
      const jwt = require("jsonwebtoken");
      const axios = require("axios");

      // Verify token with User Service
      const userServiceUrl =
        process.env.USER_SERVICE_URL || "http://localhost:4001";
      
      try {
        const response = await axios.get(`${userServiceUrl}/verify`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 5000,
        });

        if (response.data.status === "success") {
          user = response.data.data.user;
        }
      } catch (error) {
        console.error("[Admin Auth] Error verifying token:", error.message);
        return next(new AppError("Token verification failed.", 401));
      }
    } catch (error) {
      return next(new AppError("Authentication error.", 401));
    }
  }

  // Check if user exists and is admin
  if (!user) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  if (user.role !== "admin") {
    return next(
      new AppError(
        "You do not have permission to perform this action. Admin access required.",
        403
      )
    );
  }

  // Grant access to protected route
  req.user = user;
  req.admin = user;
  next();
});