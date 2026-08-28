import axios, {AxiosError, type InternalAxiosRequestConfig} from "axios";

const normalizeBaseUrl = (baseUrl: string): string => baseUrl.replace(/\/+$/, '');

export const IAM_API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_IAM_API_BASE_URL ?? 'http://localhost:4000');
export const CORE_API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_CORE_API_URL ?? "http://localhost:5000");
export const iamApi = axios.create({
  baseURL: IAM_API_BASE_URL,
  timeout: 15_000,
});

export const coreApi = axios.create({
  baseURL: CORE_API_BASE_URL,
  timeout: 20_000,
});

const attachToken = (config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

iamApi.interceptors.request.use(attachToken);
coreApi.interceptors.request.use(attachToken);

// این فایل ماژول ساده است و به AuthContext (که یک React Context است) دسترسی مستقیم ندارد.
// AuthProvider موقع mount شدن، logout واقعی خودش را اینجا «ثبت» می‌کند؛ از آن به بعد هر
// پاسخ 401 از iam یا core (یعنی توکن گم شده یا نامعتبر است)، همان logout را صدا می‌زند.
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

const handleAuthError = (error: AxiosError) => {
  if (error.response?.status === 401) {
    onUnauthorized?.();
  }
  return Promise.reject(error);
};

iamApi.interceptors.response.use((res) => res, handleAuthError);
coreApi.interceptors.response.use((res) => res, handleAuthError);


export function isAxiosErrorWithMessage(
  error: unknown
): error is AxiosError<{ message?: string }> {
  return axios.isAxiosError(error);
}

export function userSafeErrorMessage(
  error: unknown,
  fallback = "خطایی رخ داده است. لطفاً دوباره تلاش کنید."
): string {
  if (!axios.isAxiosError(error)) return fallback;

  if (error.response?.status === 401) return "نشست شما منقضی شده است. دوباره وارد شوید.";
  if (error.response?.status === 403) return "اجازه انجام این عملیات را ندارید.";
  if (error.response && error.response.status >= 500) return "خطایی در سرور رخ داده است.";

  // برای login عمداً پیام خام backend را نمایش نمی‌دهیم.
  return fallback;
}