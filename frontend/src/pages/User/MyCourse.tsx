import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useWindowSize from "../../hooks/useWindowSize";

interface Course {
  cid: number;
  description: string;
  start_time: string;
  end_time: string;
  start_sign_up: string;
  end_sign_up: string;
  price: number;
  field1: string;
  field2: string | null;
  name: string;
  image: string | null;
  is_valid: boolean;
}

type ToastType = "info" | "success" | "error";

const MyCourse: React.FC = () => {
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ show: boolean; type: ToastType; message: string }>({
    show: false,
    type: "info",
    message: "",
  });

  const showToast = (message: string, type: ToastType, duration = 3000) => {
    setToast({ show: true, type, message });
    if (duration > 0) {
      setTimeout(() => setToast((t) => ({ ...t, show: false })), duration);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("isUserLogin") === "") {
      navigate("../login");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:5000/user/overview", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("خطا در دریافت اطلاعات");
        }

        const result = await response.json();
        if (result.success) {
          setEnrolledCourses(result.data.enrolledCourses);
        } else {
          setError("خطا در دریافت اطلاعات دوره ها");
        }
      } catch (err) {
        setError("خطا در ارتباط با سرور");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDownloadCertificates = async (cid: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("ابتدا وارد شوید", "error");
        return;
      }
      // درخواست دریافت مسیر گواهی‌ها
      const res = await fetch("http://localhost:5000/courses/certificate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cid }),
      });

      if (!res.ok) {
        showToast("خطا در دریافت گواهی", "error");
        return;
      }

      const data = await res.json() as { success: boolean; files?: string[] };
      const files = data.files ?? [];

      if (files.length === 0) {
        showToast("گواهی مرتبطی ندارید", "error", 3500);
        return;
      }

      showToast("دانلود گواهی شروع شد", "info", 2500);

      // همه فایل‌ها را یکی‌یکی دانلود کن
      files.forEach((fp) => {
        // اگر مسیر نسبی است (نسبت به core)، به URL کامل تبدیل شود:
        const clean = fp.replace(/^\/+/, ""); // حذف اسلش ابتدا
        const fullUrl = fp.startsWith("http")
          ? fp
          : `http://localhost:5000/${clean}`;

        const a = document.createElement("a");
        a.href = fullUrl;
        // تلاش برای نام فایل از مسیر:
        const name = clean.split("/").pop() || "certificate.pdf";
        a.download = name;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
    } catch (e) {
      showToast("خطا در شروع دانلود گواهی", "error");
    }
  };

  // این تابع در کد فعلی استفاده نشده، باقی گذاشته می‌شود اگر لازم شد:
  const handleTakeExam = (cid: number) => {
    navigate("./TakeExam.txt", { state: { cid } });
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 sm:px-6 lg:px-8 w-full">
      <section
        className={`${
          width >= 1024 ? "w-full max-w-7xl mx-auto" : "w-full"
        } py-6 lg:py-8`}
      >
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
            <div className="flex items-center space-x-4 ">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 ml-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 0a1 1 0 100 2h.01a1 1 0 100-2H9zm2 0a1 1 0 100 2h.01a1 1 0 100-2H11z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white">دوره های ثبت نامی</h1>
                <p className="text-blue-100 mt-1">مدیریت و بررسی دوره ها</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 lg:p-8">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-600 text-lg mb-4">{error}</div>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                >
                  تلاش مجدد
                </button>
              </div>
            ) : enrolledCourses.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">هیچ دوره‌ای یافت نشد</h3>
                <p className="text-gray-600">شما در هیچ دوره‌ای ثبت نام نکرده‌اید</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {enrolledCourses.map((course) => (
                  <div
                    key={course.cid}
                    className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                          {course.name}
                        </h3>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 ml-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          <span className="font-medium">شروع:</span>
                          <span className="mr-2">{formatDate(course.start_time)}</span>
                        </div>

                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 ml-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          <span className="font-medium">پایان:</span>
                          <span className="mr-2">{formatDate(course.end_time)}</span>
                        </div>

                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 ml-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                          </svg>
                          <span className="font-medium">رشته:</span>
                          <span className="mr-2">{course.field1}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link
                          className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          to={`/user/userPage/examPage/${course.cid}`}
                        >
                          شرکت در آزمون
                        </Link>

                        <button
                          onClick={() => handleDownloadCertificates(course.cid)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                        >
                          دریافت گواهی
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Toast */}
        {toast.show && (
          <div
            className={`fixed bottom-6 left-6 z-50 px-4 py-3 rounded-lg shadow-lg text-white
              ${toast.type === "info" ? "bg-blue-600" : ""}
              ${toast.type === "success" ? "bg-green-600" : ""}
              ${toast.type === "error" ? "bg-red-600" : ""}
            `}
          >
            {toast.message}
          </div>
        )}
      </section>
    </section>
  );
};

export default MyCourse;
