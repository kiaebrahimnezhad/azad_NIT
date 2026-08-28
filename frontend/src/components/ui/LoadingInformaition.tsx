import styles from "./LoadingInformaition.module.css";

interface LoadingInformaitionProps {
  message?: string;
  size?: "sm" | "md";
}

const SIZES = {
  sm: { wrapper: "py-8", ring: "w-10 h-10", ringBorder: "border-2", text: "text-sm mt-3" },
  md: { wrapper: "py-20", ring: "w-16 h-16", ringBorder: "border-4", text: "text-lg mt-6" },
};

function LoadingInformaition({
  message = "در حال بارگذاری اطلاعات...",
  size = "md",
}: LoadingInformaitionProps) {
  const s = SIZES[size];

  return (
    <div className={`text-center ${s.wrapper}`} role="status" aria-live="polite">
      <div className="relative inline-flex items-center justify-center">
        <div className={`${s.ring} ${s.ringBorder} border-indigo-200 rounded-full`}></div>
        <div
          className={`absolute ${s.ring} ${s.ringBorder} border-indigo-600 rounded-full animate-spin border-t-transparent`}
        ></div>
      </div>
      <p className={`text-gray-600 ${s.text}`}>{message}</p>
      {/* بدون space-x-reverse: Tailwind v4 از margin-inline-start/end استفاده می‌کند
          که خودش بر اساس جهت (RTL/LTR) صفحه تنظیم می‌شود؛ اضافه‌کردن space-x-reverse
          این تنظیم خودکار را برعکس می‌کرد و باعث می‌شد فاصله‌ی بین نقطه‌ها اشتباه بیفتد. */}
      <div className="flex justify-center mt-4 space-x-1">
        <div className={`w-2 h-2 bg-indigo-500 rounded-full ${styles.pulseAnimation}`}></div>
        <div
          className={`w-2 h-2 bg-indigo-500 rounded-full ${styles.pulseAnimation}`}
          style={{ animationDelay: "0.2s" }}
        ></div>
        <div
          className={`w-2 h-2 bg-indigo-500 rounded-full ${styles.pulseAnimation}`}
          style={{ animationDelay: "0.4s" }}
        ></div>
      </div>
    </div>
  );
}

export default LoadingInformaition;
