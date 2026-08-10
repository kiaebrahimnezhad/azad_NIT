import axios, {AxiosError, type InternalAxiosRequestConfig} from "axios";

const normalizeBaseUrl = (baseUrl: string): string => baseUrl.replace(/\/+$/, '');

// @ts-ignore: import.meta is only allowed with the appropriate module setting
export const IAM_API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_IAM_API_BASE_URL ?? 'http://localhost:4000');
// @ts-ignore: import.meta is only allowed with the appropriate module setting
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