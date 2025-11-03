import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { CartProvider } from "./contexts/CartContext";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import HomePageNew from "./pages/HomePageNew";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import DroneTrackingPage from "./pages/DroneTrackingPage";
import DroneHubPage from "./pages/DroneHubPage";
import ProfilePage from "./pages/ProfilePage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import NotFoundPage from "./pages/NotFoundPage";
import VNPayMockPage from "./pages/VNPayMockPage";
import MoMoMockPage from "./pages/MoMoMockPage";

// Admin pages
import { DashboardPage, AdminLoginPage, AdminSignupPage } from "./pages-admin";

// Restaurant pages
import {
  RestaurantLoginPage,
  RestaurantSignupPage,
  RestaurantDashboard,
  DashboardContent,
  ProductsManagementPage,
  OrdersManagementPage,
  OrderDetailPage as RestaurantOrderDetailPage,
  AnalyticsPage,
  SettingsPage,
} from "./pages-restaurant-client";
import RestaurantDashboardTest from "./pages-restaurant-client/RestaurantDashboardTest";
import RestaurantLoginTest from "./pages-restaurant-client/RestaurantLoginTest";

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        {/* Public routes - NO Layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Payment Mock Pages - NO Layout */}
        <Route path="/payment/vnpay" element={<VNPayMockPage />} />
        <Route path="/payment/momo" element={<MoMoMockPage />} />

        {/* Admin routes - NO Layout (has its own sidebar/header) */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/signup" element={<AdminSignupPage />} />
        <Route
          path="/admin"
          element={
            user?.role === "admin" ? (
              <DashboardPage />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />

        {/* Restaurant routes - NO Layout (has its own sidebar/header) */}
        <Route
          path="/restaurant"
          element={<Navigate to="/restaurant/login" replace />}
        />
        <Route path="/restaurant/login" element={<RestaurantLoginPage />} />
        <Route path="/restaurant/signup" element={<RestaurantSignupPage />} />
        <Route path="/restaurant/test" element={<RestaurantDashboardTest />} />
        <Route
          path="/restaurant/login-test"
          element={<RestaurantLoginTest />}
        />
        <Route
          path="/restaurant/dashboard"
          element={
            localStorage.getItem("restaurant_token") ? (
              <RestaurantDashboard />
            ) : (
              <Navigate to="/restaurant/login" replace />
            )
          }
        >
          <Route index element={<DashboardContent />} />
          <Route path="products" element={<ProductsManagementPage />} />
          <Route path="orders" element={<OrdersManagementPage />} />
          <Route
            path="orders/:orderId"
            element={<RestaurantOrderDetailPage />}
          />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* User routes - WITH Layout (header + footer) */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePageNew />} />
          <Route path="homepage-old" element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />

          {/* User protected routes */}
          <Route
            path="orders"
            element={user ? <OrdersPage /> : <Navigate to="/login" />}
          />
          <Route
            path="orders/:id"
            element={user ? <OrderDetailPage /> : <Navigate to="/login" />}
          />
          <Route
            path="drone-hub"
            element={user ? <DroneHubPage /> : <Navigate to="/login" />}
          />
          <Route
            path="drone-tracking"
            element={
              user ? (
                <Navigate to="/drone-hub" replace />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="drone-tracking/:orderId"
            element={user ? <DroneTrackingPage /> : <Navigate to="/login" />}
          />
          <Route
            path="profile"
            element={user ? <ProfilePage /> : <Navigate to="/login" />}
          />
          <Route
            path="checkout"
            element={user ? <CheckoutPage /> : <Navigate to="/login" />}
          />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
