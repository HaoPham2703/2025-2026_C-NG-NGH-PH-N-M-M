const jwt = require("jsonwebtoken");
const { services } = require("../config/services");
const axios = require("axios");

// JWT verification middleware
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Access token is required",
      });
    }

    // Verify token with user service
    try {
      const response = await axios.get(`${services.user}/verify`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.status === "success") {
        req.user = response.data.data.user;
        next();
      } else {
        return res.status(401).json({
          status: "error",
          message: "Invalid token",
        });
      }
    } catch (error) {
      return res.status(401).json({
        status: "error",
        message: "Token verification failed",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Authentication error",
    });
  }
};

// Optional authentication middleware
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (token) {
      try {
        const response = await axios.get(`${services.user}/verify`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.status === "success") {
          req.user = response.data.data.user;
        }
      } catch (error) {
        // Token invalid, but continue without user
      }
    }

    next();
  } catch (error) {
    next();
  }
};

// Admin role check middleware
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Admin access required",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Authorization error",
    });
  }
};

// Restaurant token verification middleware
// For restaurant routes, we just check token exists and forward to restaurant service
// Restaurant service's protect middleware will verify the token with its own JWT_SECRET
const verifyRestaurantToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Access token is required",
      });
    }

    // Just check token exists (basic format check)
    // Don't verify JWT here - let restaurant service verify with its own JWT_SECRET
    // This prevents "jwt malformed" errors due to different JWT_SECRETs
    if (typeof token !== "string" || token.length < 10) {
      return res.status(401).json({
        status: "error",
        message: "Invalid token format",
      });
    }

    // Forward request to restaurant service
    // Restaurant service's protect middleware will verify the token
    next();
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Authentication error",
    });
  }
};

// Verify user or restaurant token - for order routes that need both
const verifyUserOrRestaurantToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Access token is required",
      });
    }

    // Try to verify as user token first
    try {
      const response = await axios.get(`${services.user}/verify`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 3000,
      });

      if (response.data.status === "success") {
        req.user = response.data.data.user;
        next();
        return;
      }
    } catch (userError) {
      // User token verification failed, try restaurant token
      console.log(
        "[verifyUserOrRestaurantToken] User token verification failed, trying restaurant token"
      );
    }

    // Try to verify as restaurant token
    // Get restaurant info from token (decode JWT to get restaurant ID)
    try {
      const jwt = require("jsonwebtoken");
      const decoded = jwt.decode(token);

      if (decoded && decoded.id) {
        // Try to get restaurant info from Restaurant Service
        const restaurantServiceUrl =
          services.restaurant || "http://localhost:4006";

        try {
          const restaurantResponse = await axios.get(
            `${restaurantServiceUrl}/api/v1/restaurant/profile`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              timeout: 3000,
            }
          );

          if (restaurantResponse.data.status === "success") {
            const restaurant = restaurantResponse.data.data.restaurant;
            req.user = {
              id: restaurant._id,
              _id: restaurant._id,
              role: "restaurant",
              restaurantId: restaurant._id,
            };
            next();
            return;
          }
        } catch (restaurantError) {
          // Restaurant verification failed too
          console.log(
            "[verifyUserOrRestaurantToken] Restaurant token verification failed"
          );
        }
      }
    } catch (restaurantTokenError) {
      // Token decode failed
      console.log("[verifyUserOrRestaurantToken] Token decode failed");
    }

    // Both verifications failed
    return res.status(401).json({
      status: "error",
      message: "Invalid token - must be user or restaurant token",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Authentication error",
    });
  }
};

module.exports = {
  verifyToken,
  verifyRestaurantToken,
  verifyUserOrRestaurantToken,
  optionalAuth,
  requireAdmin,
};
