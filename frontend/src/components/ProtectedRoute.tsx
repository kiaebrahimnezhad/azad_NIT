import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types/publicTypes";

interface ProtectedRouteProps {
  allow: UserRole[];
  children: ReactNode;
}

const homeByRole: Record<UserRole, string> = {
  normal: "/user/userPage",
  admin: "/admin/adminPage",
  owner: "/owner",
};

export default function ProtectedRoute({ allow, children }: ProtectedRouteProps) {
  const { authStatus, userType } = useAuth();
  const location = useLocation();

  if (authStatus === "loading") {
    return <div className="min-h-screen grid place-items-center">در حال بررسی نشست…</div>;
  }

  if (authStatus === "anonymous" || !userType) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!allow.includes(userType)) {
    return <Navigate to={homeByRole[userType]} replace />;
  }

  return <>{children}</>;
}