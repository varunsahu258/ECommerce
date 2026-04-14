import { Route, Routes } from "react-router-dom";
import { AppShell } from "./layouts/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { CartPage } from "./pages/shopper/CartPage";
import { CheckoutPage } from "./pages/shopper/CheckoutPage";
import { HomePage } from "./pages/shopper/HomePage";
import { OrderHistoryPage } from "./pages/shopper/OrderHistoryPage";
import { ProductDetailPage } from "./pages/shopper/ProductDetailPage";

export const App = () => (
  <Routes>
    <Route element={<AppShell />}>
      <Route index element={<HomePage />} />
      <Route path="/products/:productId" element={<ProductDetailPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute roles={["user", "admin"]} />}>
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrderHistoryPage />} />
      </Route>

      <Route element={<ProtectedRoute roles={["admin"]} />}>
        <Route path="/admin" element={<AdminDashboardPage />} />
      </Route>
    </Route>
  </Routes>
);
