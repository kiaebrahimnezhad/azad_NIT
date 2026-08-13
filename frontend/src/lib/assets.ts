import { CORE_API_BASE_URL } from "./api";

export const DEFAULT_COURSE_IMAGE = "/vite.svg";

// این تابع مسیر تصویر دوره را بر اساس مسیر داده شده تولید می‌کند. اگر مسیر داده شده یک URL کامل باشد، همان URL بازگردانده می‌شود. در غیر این صورت، مسیر به صورت نسبی به آدرس پایه API اضافه می‌شود.
export function courseImageUrl(path?: string | null): string {
  if (!path) return DEFAULT_COURSE_IMAGE;

  // اگر مسیر داده شده یک URL کامل باشد، همان مسیر بازگردانده می‌شود.
  if (/^https?:\/\//i.test(path)) return path;

  // مسیر داده شده به صورت نسبی به آدرس پایه API اضافه می‌شود. ابتدا هرگونه اسلش اضافی در ابتدا و انتهای مسیر حذف می‌شود تا از ایجاد مسیرهای نادرست جلوگیری شود.
  const normalized = path
    .replace(/\\/g, "/") // تبدیل بک‌اسلش‌ها به اسلش‌ها برای سازگاری با URL
    .replace(/^\.\/?/, "") // حذف هرگونه نقطه و اسلش اضافی در ابتدا
    .replace(/^\/+/, ""); // حذف اسلش‌های اضافی در ابتدا

  return `${CORE_API_BASE_URL}/${normalized}`;
}