import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useWindowSize from "../../hooks/useWindowSize";

type RequestedCourse = {
  cid: number;
  description: string;
  start_time: string;      // ISO
  end_time: string;        // ISO
  start_sign_up: string;   // ISO
  end_sign_up: string;     // ISO
  price: number;
  field1: string;
  field2?: string | null;
  name: string;
  image?: string | null;   // مثل "uploads\\file.jpg"
  is_valid: boolean;
};

type ApiResponse = {
  success: boolean;
  data?: {
    requestedCourses?: RequestedCourse[];
  };
  message?: string;
};

const API_BASE = "http://localhost:5000";

const MyRequestedCourse: React.FC = () => {
  const { width } = useWindowSize();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [requestedCourses, setRequestedCourses] = useState<RequestedCourse[]>([]);
  const [toast, setToast] = useState<{show:boolean; message:string; type:"info"|"success"|"error"}>({show:false, message:"", type:"info"});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("ابتدا وارد شوید");
          setLoading(false);
          return;
        }
        const res = await fetch(`${API_BASE}/user/overview`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` }
        });
        const json: ApiResponse = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "خطا در دریافت اطلاعات");
        }
        setRequestedCourses(json.data?.requestedCourses || []);
        console.log(json.data?.requestedCourses);
      } catch (e:any) {
        setError(e?.message || "خطا در دریافت اطلاعات");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("fa-IR", { year:"numeric", month:"2-digit", day:"2-digit" });
    } catch {
      return "-";
    }
  };

  const courseImageUrl = (raw?: string | null) => {
    if (!raw) return "";
    // مسیر تصویر نسبت به ریشه‌ی سرور بکند
    const clean = raw.replace(/\\/g, "/").replace(/^\.?\/*/, "");
    return `${API_BASE}/${clean}`;
  };

  const goCourse = (cid: number) => navigate(`/course/${cid}`);
  const goCreateExam = (cid: number) => navigate(`/createxam/${cid}`);

  const showToast = (message: string, type: "info"|"success"|"error" = "info") => {
    setToast({show:true, message, type});
    setTimeout(()=>setToast({show:false, message:"", type:"info"}), 3000);
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 sm:px-6 lg:px-8 w-full">
      <section className={`${width >= 1024 ? "w-full max-w-7xl mx-auto" : "w-full"} py-6 lg:py-8`}>
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
                <h1 className="text-2xl lg:text-3xl font-bold text-white">دوره‌های درخواستی من</h1>
                <p className="text-blue-100 mt-1">مدیریت و بررسی دوره‌های درخواست‌شده</p>
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
            ) : requestedCourses.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">دوره‌ای ثبت نشده است</h3>
                <p className="text-gray-600">شما هنوز دوره‌ای را درخواست نداده‌اید</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {requestedCourses.map((c) => (
                  <div
                    key={c.cid}
                    className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                  >
                    {c.image ? (
                      <div className="h-40 w-full bg-gray-50 overflow-hidden">
                        <img
                          src={courseImageUrl(c.image)}
                          alt={c.name}
                          className="w-full h-full object-cover"
                          onError={(e)=>{(e.currentTarget as HTMLImageElement).style.display='none';}}
                        />
                      </div>
                    ) : null}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{c.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${c.is_valid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {c.is_valid ? "تأیید شده" : "در انتظار تأیید"}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">{c.description}</p>

                      <div className="space-y-2 mb-5 text-sm text-gray-700">
                        <div className="flex items-center">
                          <span className="font-medium ml-1">رشته ۱:</span><span>{c.field1}</span>
                        </div>
                        {c.field2 ? (
                          <div className="flex items-center">
                            <span className="font-medium ml-1">رشته ۲:</span><span>{c.field2}</span>
                          </div>
                        ) : null}
                        <div className="flex items-center">
                          <span className="font-medium ml-1">شروع دوره:</span><span>{formatDate(c.start_time)}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium ml-1">پایان دوره:</span><span>{formatDate(c.end_time)}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium ml-1">شروع ثبت‌نام:</span><span>{formatDate(c.start_sign_up)}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium ml-1">پایان ثبت‌نام:</span><span>{formatDate(c.end_sign_up)}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium ml-1">شهریه:</span>
                          <span>{new Intl.NumberFormat("fa-IR").format(c.price)} تومان</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          disabled={!c.is_valid}
                          onClick={() => c.is_valid ? goCourse(c.cid) : showToast("این دوره هنوز تأیید نشده است", "error")}
                          className={`flex-1 text-center py-2.5 px-4 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                            ${c.is_valid
                              ? "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500"
                              : "bg-gray-200 text-gray-500 cursor-not-allowed"
                            }`}
                        >
                          مشاهده دوره
                        </button>

                        <button
                          onClick={() => goCreateExam(c.cid)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                        >
                          افزودن آزمون
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

export default MyRequestedCourse;
