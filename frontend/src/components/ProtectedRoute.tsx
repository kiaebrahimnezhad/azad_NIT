import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types/publicTypes";

interface ProtectedRouteProps {
  allow: UserRole[];
  children: ReactNode;
}
// نقش‌های مجاز برای دسترسی به مسیر proteced
const homeByRole: Record<UserRole, string> = {
  normal: "/user/userPage",
  admin: "/admin/adminPage",
  owner: "/owner",
};

export default function ProtectedRoute({ allow, children }: ProtectedRouteProps) {
  const { authStatus, userType } = useAuth();
  // اینجا از useLocation برای دریافت مسیر فعلی استفاده می‌کنیم تا در صورت نیاز به هدایت کاربر به صفحه ورود، بتوانیم مسیر فعلی را ذخیره کنیم و پس از ورود، کاربر را به همان مسیر بازگردانیم.
  const location = useLocation();
  // اگر وضعیت احراز هویت در حال بارگذاری است، یک پیام بارگذاری نمایش داده می‌شود.
  if (authStatus === "loading") {
    return <div className="min-h-screen grid place-items-center">در حال بررسی نشست…</div>;
  }

  // اگر کاربر ناشناس است یا نوع کاربر مشخص نشده است، به صفحه ورود هدایت می‌شود.
  if (authStatus === "anonymous" || !userType) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  // اگر نوع کاربر در لیست مجاز نیست، به صفحه اصلی نقش خود هدایت می‌شود.
  if (!allow.includes(userType)) {
    return <Navigate to={homeByRole[userType]} replace />;
  }

  return <>{children}</>;
}