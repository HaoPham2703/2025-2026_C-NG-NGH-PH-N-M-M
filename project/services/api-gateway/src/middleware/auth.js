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

module.exports = {
  verifyToken,
  optionalAuth,
  requireAdmin,
};
