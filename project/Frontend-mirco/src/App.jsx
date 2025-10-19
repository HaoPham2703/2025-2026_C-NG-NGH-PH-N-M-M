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
import ProfilePage from "./pages/ProfilePage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import AdminPage from "./pages/AdminPage";
import NotFoundPage from "./pages/NotFoundPage";

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
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePageNew />} />
          <Route path="homepage-old" element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />

          {/* User routes */}
          <Route
            path="orders"
            element={user ? <OrdersPage /> : <Navigate to="/login" />}
          />
          <Route
            path="orders/:id"
            element={user ? <OrderDetailPage /> : <Navigate to="/login" />}
          />
          <Route
            path="profile"
            element={user ? <ProfilePage /> : <Navigate to="/login" />}
          />
          <Route
            path="checkout"
            element={user ? <CheckoutPage /> : <Navigate to="/login" />}
          />

          {/* Admin routes */}
          <Route
            path="admin"
            element={
              user?.role === "admin" ? <AdminPage /> : <Navigate to="/" />
            }
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
