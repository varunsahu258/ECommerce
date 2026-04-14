import { Navigate, Outlet } from "react-router-dom";
import type { UserRole } from "@ecommerce/shared";
import { useAuth } from "../hooks/useAuth";

export const ProtectedRoute = ({ roles }: { roles?: UserRole[] }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
