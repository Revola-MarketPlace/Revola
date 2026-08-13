import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import LandingPage from "./pages/LandingPage";
import CatalogPage from "./pages/CatalogPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import MockPaymentPage from "./pages/MockPaymentPage";
import BuyerDashboard from "./pages/BuyerDashboard";
import SellerDashboard from "./pages/SellerDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import UnauthorizedPage from "./pages/UnauthorizedPage";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <MainLayout>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/products" element={<CatalogPage />} />
                <Route path="/products/:id" element={<ProductDetailsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />

                {/* Secure Buyer Routes */}
                <Route
                  path="/cart"
                  element={
                    <ProtectedRoute allowedRoles={["BUYER"]}>
                      <CartPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute allowedRoles={["BUYER"]}>
                      <CheckoutPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/buyer-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["BUYER"]}>
                      <BuyerDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Secure Seller Routes */}
                <Route
                  path="/seller-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["SELLER"]}>
                      <SellerDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Secure Staff Routes */}
                <Route
                  path="/staff-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["STAFF", "ADMIN"]}>
                      <StaffDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Secure Admin Routes */}
                <Route
                  path="/admin-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Development Mock Payment Route */}
                <Route
                  path="/mock-payment/:transactionId"
                  element={<MockPaymentPage />}
                />
              </Routes>
            </MainLayout>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
