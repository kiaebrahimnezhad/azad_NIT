// تبدیل عدد دقیقه (۰ تا ۱۴۳۹) به قالب ساعت:دقیقه، مثلاً 90 → "1:30"
export const formatMinutes = (m: number) =>
  `${Math.floor(m / 60)}:${(m % 60).toString().padStart(2, "0")}`;

// تبدیل رشته‌ی تاریخ ISO به تاریخ شمسی برای نمایش
export const toFa = (d: string) => new Date(d).toLocaleDateString("fa-IR");

// تبدیل رشته‌ی تاریخ ISO به تاریخ شمسیِ کامل (با یا بدون ساعت/دقیقه) برای نمایش توی کارت‌ها
export const formatDate = (iso: string, options?: { withTime?: boolean }) => {
  try {
    const date = new Date(iso);
    return date.toLocaleDateString("fa-IR", {
      year: "numeric",
      month: options?.withTime ? "long" : "2-digit",
      day: options?.withTime ? "numeric" : "2-digit",
      ...(options?.withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    });
  } catch {
    return "-";
  }
};
