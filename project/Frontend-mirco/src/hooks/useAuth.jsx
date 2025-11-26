import { useState, useEffect, createContext, useContext } from "react";
import { authApi } from "../api/authApi";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (token && savedUser) {
        try {
          // Verify token with server
          const response = await authApi.verify();
          if (response.status === "success") {
            setUser(response.data.user);
            localStorage.setItem("user", JSON.stringify(response.data.user));
          } else {
            // Token invalid, clear storage
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }
        } catch (error) {
          console.error("Token verification failed:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authApi.login(credentials);
      if (response.status === "success") {
        const { token, data } = response;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        toast.success("Login successful!");
        return { success: true };
      }
    } catch (error) {
      console.error("Login failed:", error);
      return { success: false, error: error.message };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await authApi.signup(userData);
      if (response.status === "success") {
        const { token, data } = response;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        toast.success("Signup successful!");
        return { success: true };
      }
    } catch (error) {
      console.error("Signup failed:", error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      toast.success("Logged out successfully!");
    }
  };

  const updateProfile = async (data) => {
    try {
      const response = await authApi.updateProfile(data);
      if (response.status === "success") {
        setUser(response.data.user);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        toast.success("Profile updated successfully!");
        return { success: true };
      }
    } catch (error) {
      console.error("Profile update failed:", error);
      return { success: false, error: error.message };
    }
  };

  const createAddress = async (addressData) => {
    try {
      const response = await authApi.createAddress(addressData);
      if (response.status === "success") {
        // Refresh user data from server to get updated address list
        const profileResponse = await authApi.getProfile();
        if (profileResponse.status === "success") {
          setUser(profileResponse.data.user);
          localStorage.setItem(
            "user",
            JSON.stringify(profileResponse.data.user)
          );
        }
        toast.success("Địa chỉ đã được thêm thành công!");
        return { success: true };
      }
    } catch (error) {
      console.error("Create address failed:", error);
      toast.error("Không thể thêm địa chỉ");
      return { success: false, error: error.message };
    }
  };

  const getAddresses = async () => {
    try {
      const response = await authApi.getAddresses();
      if (response.status === "success") {
        return { success: true, data: response.data.address };
      }
    } catch (error) {
      console.error("Get addresses failed:", error);
      return { success: false, error: error.message };
    }
  };

  const updateAddress = async (addressData) => {
    try {
      const response = await authApi.updateAddress(addressData);
      if (response.status === "success") {
        // Refresh user data from server
        const profileResponse = await authApi.getProfile();
        if (profileResponse.status === "success") {
          setUser(profileResponse.data.user);
          localStorage.setItem(
            "user",
            JSON.stringify(profileResponse.data.user)
          );
        }
        toast.success("Địa chỉ đã được cập nhật!");
        return { success: true };
      }
    } catch (error) {
      console.error("Update address failed:", error);
      toast.error("Không thể cập nhật địa chỉ");
      return { success: false, error: error.message };
    }
  };

  const deleteAddress = async (index) => {
    try {
      const response = await authApi.deleteAddress({ id: index }); // Backend expects 'id' (index)
      if (response.status === "success") {
        // Refresh user data from server
        const profileResponse = await authApi.getProfile();
        if (profileResponse.status === "success") {
          setUser(profileResponse.data.user);
          localStorage.setItem(
            "user",
            JSON.stringify(profileResponse.data.user)
          );
        }
        toast.success("Địa chỉ đã được xóa!");
        return { success: true };
      }
    } catch (error) {
      console.error("Delete address failed:", error);
      toast.error("Không thể xóa địa chỉ");
      return { success: false, error: error.message };
    }
  };

  const setDefaultAddress = async (index) => {
    try {
      const response = await authApi.setDefaultAddress({ id: index }); // Backend expects 'id' (index)
      if (response.status === "success") {
        // Refresh user data from server
        const profileResponse = await authApi.getProfile();
        if (profileResponse.status === "success") {
          setUser(profileResponse.data.user);
          localStorage.setItem(
            "user",
            JSON.stringify(profileResponse.data.user)
          );
        }
        toast.success("Đã đặt địa chỉ mặc định!");
        return { success: true };
      } else {
        toast.error(response.message || "Không thể đặt địa chỉ mặc định");
        return { success: false, error: response.message };
      }
    } catch (error) {
      console.error("Set default address failed:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Server error. Please try again later.";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const deleteAccount = async () => {
    try {
      const response = await authApi.deleteAccount();
      if (response.status === "success") {
        // Clear local storage and logout
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        toast.success("Tài khoản đã được xóa thành công!");
        return { success: true, data: response.data };
      }
    } catch (error) {
      console.error("Delete account failed:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Không thể xóa tài khoản";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    updateProfile,
    createAddress,
    getAddresses,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
