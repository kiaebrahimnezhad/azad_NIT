import type { Dispatch, SetStateAction } from "react";

export type UserRole = "normal" | "admin" | "owner";
export type AuthStatus = "loading" | "authenticated" | "anonymous";

export interface otpResponse {
  message: string;
  success?: boolean;
}

export interface LoginResponse {
  token: string;
  userType: UserRole;
  message: string;
}

export interface EmailResponse {
  message: string;
}

export interface SampleFormResult {
  show: boolean;
  success: boolean;
  message: string | null;
}

export interface Auth {
  username: string;
  userType: UserRole;
}

export interface PublicContext {
  userName: string;
  setUserName: Dispatch<SetStateAction<string>>;
  isUserLogin: boolean;
  setIsUserLogin: Dispatch<SetStateAction<boolean>>;
  token: string | null;
  setToken: Dispatch<SetStateAction<string | null>>;
  userType: UserRole | null;
  setUserType: Dispatch<SetStateAction<UserRole | null>>;
  authStatus: AuthStatus;
  login: (session: { username: string; token: string; userType: UserRole }) => void;
  logout: () => void;
  refreshSession: () => Promise<void>;
}
// تعریف بهینه تایپ ها و حذف any