import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { iamApi, setUnauthorizedHandler } from "../lib/api";
import type { Auth, AuthStatus, PublicContext, UserRole } from "../types/publicTypes";

export const AuthContext = createContext<PublicContext | null>(null);

const isUserRole = (value: unknown): value is UserRole =>
  value === "normal" || value === "admin" || value === "owner";

// ارائه‌دهنده کانتکت احراز هویت
export function AuthProvider({ children }: { children: ReactNode }) {
  const [userName, setUserName] = useState("");
  const [isUserLogin, setIsUserLogin] = useState(false);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [userType, setUserType] = useState<UserRole | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");  // وضعیت اولیه به عنوان "loading" تنظیم می‌شود تا نشان دهد که بررسی نشست در حال انجام است.

  // لوگ‌اوت کاربر و پاک‌سازی داده‌های نشست
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    // کلیدهای legacy اگر از نسخه قبلی مانده باشند نیز پاک شوند.
    localStorage.removeItem("isUserLogin");
    localStorage.removeItem("userType");
    localStorage.removeItem("userName");

    setToken(null);
    setUserName("");
    setUserType(null);
    setIsUserLogin(false);
    setAuthStatus("anonymous");
  }, []);

  // ورود کاربر و ذخیره‌سازی داده‌های نشست
  const login = useCallback(
    (session: { username: string; token: string; userType: UserRole }) => {
      // دقیقاً همان اعتبارسنجی runtime که refreshSession روی پاسخ سرور انجام می‌دهد؛
      // چون userType هم اینجا از پاسخ واقعی سرور می‌آید و صرفاً تایپ TypeScript تضمینی برایش نیست.
      if (!session.username || !isUserRole(session.userType)) {
        logout();
        return;
      }

      localStorage.setItem("token", session.token);
      setToken(session.token);
      setUserName(session.username);
      setUserType(session.userType);
      setIsUserLogin(true);
      setAuthStatus("authenticated");
    },
    [logout]
  );

  // تازه‌سازی نشست
  const refreshSession = useCallback(async () => {
    const currentToken = localStorage.getItem("token");

    if (!currentToken) {
      setToken(null);
      setUserName("");
      setUserType(null);
      setIsUserLogin(false);
      setAuthStatus("anonymous");
      return;
    }

    setAuthStatus("loading");

    try {
      const { data } = await iamApi.get<Auth>("/login/user-info");

      if (!data.username || !isUserRole(data.userType)) {
        throw new Error("Invalid session payload");
      }

      setToken(currentToken);
      setUserName(data.username);
      setUserType(data.userType);
      setIsUserLogin(true);
      setAuthStatus("authenticated");
    } catch {
      logout();
    }
  }, [logout]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  // logout واقعی همین Provider را به api.ts معرفی می‌کنیم تا هر پاسخ 401 از iam/core
  // خودکار همین‌جا هم اعمال بشه، نه فقط توی صفحه‌ای که درخواست رو زده.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const value = useMemo<PublicContext>(
    () => ({
      userName,
      setUserName,
      isUserLogin,
      setIsUserLogin,
      token,
      setToken,
      userType,
      setUserType,
      authStatus,
      login,
      logout,
      refreshSession,
    }),
    [
      userName,
      isUserLogin,
      token,
      userType,
      authStatus,
      login,
      logout,
      refreshSession,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): PublicContext {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}