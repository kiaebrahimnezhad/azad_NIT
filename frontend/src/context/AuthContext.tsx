import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { iamApi } from "../lib/api";
import type { Auth, AuthStatus, PublicContext, UserRole } from "../types/publicTypes";

export const AuthContext = createContext<PublicContext | null>(null);

const isUserRole = (value: unknown): value is UserRole =>
  value === "normal" || value === "admin" || value === "owner";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userName, setUserName] = useState("");
  const [isUserLogin, setIsUserLogin] = useState(false);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [userType, setUserType] = useState<UserRole | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");

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

  const login = useCallback(
    (session: { username: string; token: string; userType: UserRole }) => {
      localStorage.setItem("token", session.token);
      setToken(session.token);
      setUserName(session.username);
      setUserType(session.userType);
      setIsUserLogin(true);
      setAuthStatus("authenticated");
    },
    []
  );

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