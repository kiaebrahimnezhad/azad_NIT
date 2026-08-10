import { CORE_API_BASE_URL } from "./api";

export const DEFAULT_COURSE_IMAGE = "/vite.svg";

export function courseImageUrl(path?: string | null): string {
  if (!path) return DEFAULT_COURSE_IMAGE;

  if (/^https?:\/\//i.test(path)) return path;

  const normalized = path
    .replace(/\\/g, "/")
    .replace(/^\.\/?/, "")
    .replace(/^\/+/, "");

  return `${CORE_API_BASE_URL}/${normalized}`;
}