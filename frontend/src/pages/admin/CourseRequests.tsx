import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useWindowSize from "../../hooks/useWindowSize";

import Header from "../../components/Header";
import AdminPanel from "../../components/AdminPanel";

interface CourseRequest {
  id: number;
  type: string;
  sender: string;
  reciver: string;
  cid: number;
  text: string;
  date: string;
}

const CourseRequests: React.FC = () => {
  const { width } = useWindowSize();
  const navigate = useNavigate();
  const [courseRequests, setCourseRequests] = React.useState<CourseRequest[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    cid: number | null;
    message: string;
  }>({
    open: false,
    cid: null,
    message: "",
  });
  const [approveModal, setApproveModal] = useState<{
    open: boolean;
    courseId: number | null;
    message: string;
  }>({
    open: false,
    courseId: null,
    message: "",
  });
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (
      localStorage.getItem("isUserLogin") === "" ||
      localStorage.getItem("userType") !== "admin"
    ) {
      navigate("../login");
    }
  }, [navigate]);

  const getToken = () => localStorage.getItem("token");
  const toShamsiDate = (iso: string): string => {
    const dt = new Date(iso);
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(dt);
  };
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) {
        setError("ابتدا وارد شوید");
        return;
      }
      const response = await fetch(
        "http://localhost:5000/admin/course-message",
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        setError("خطایی رخ داده است");
        throw new Error("خطا در دریافت  درخواستها");
      }
      const data = await response.json();
      setCourseRequests(
        data.messages.map((m: any) => ({
          ...m,
          date: toShamsiDate(m.date), // ← این خط اضافه شد
        }))
      );
      setLoading(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const confirmDelete = async () => {
    if (!deleteModal.message.trim()) {
      showNotification("لطفاً پیغام را وارد کنید", "error");
      return;
    }
    try {
      const token = getToken();
      if (!token) throw new Error("ابتدا وارد شوید");
      const response = await fetch(
        "http://localhost:5000/admin/invalid-course",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cid: deleteModal.cid,
            message: deleteModal.message.trim(),
          }),
        }
      );
      if (!response.ok) throw new Error("خطا در رد درخواست");
      showNotification(" دوره با موفقیت حذف شد", "success");
      setDeleteModal({ open: false, cid: null, message: "" });
      fetchData();
    } catch (err) {
      showNotification(
        err instanceof Error ? err.message : "خطایی رخ داد",
        "error"
      );
    }
  };

  const confirmApprove = async () => {
    if (!approveModal.message.trim()) {
      showNotification("لطفاً پیغام را وارد کنید", "error");
      return;
    }
    try {
      const token = getToken();
      console.log(token);
      console.log("courseId:", approveModal.courseId);
      console.log("message:", approveModal.message.trim());
      if (!token) throw new Error("ابتدا وارد شوید");
      const response = await fetch(
        "http://localhost:5000/admin/validate-course",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courseId: approveModal.courseId,
            message: approveModal.message.trim(),
          }),
        }
      );
      if (!response.ok) throw new Error("خطا در تایید دوره");
      showNotification("دوره با موفقیت تایید شد", "success");
      setApproveModal({ open: false, courseId: null, message: "" });
      fetchData();
    } catch (err) {
      showNotification(
        err instanceof Error ? err.message : "خطایی رخ داد",
        "error"
      );
    }
  };

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <>
      <section className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 sm:px-6 lg:px-8 w-full">
        <section
          className={`
                ${width >= 1024 ? "w-full max-w-7xl mx-auto" : "w-full"} 
                py-6 lg:py-8
            `}
        >
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
              <div className="flex items-center space-x-4 ">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white">
                    درخواست‌های دوره
                  </h1>
                  <p className="text-blue-100 mt-1">
                    مدیریت و بررسی درخواست‌های ارسالی
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 lg:p-8">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 lg:py-24">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-blue-400 rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-lg text-gray-600 mt-6 font-medium">
                    در حال بارگذاری...
                  </p>
                  <p className="text-sm text-gray-400 mt-2">لطفاً صبر کنید</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-16 lg:py-24">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <svg
                      className="w-10 h-10 text-red-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-red-600 mb-2">
                    خطایی رخ داده است
                  </h3>
                  <p className="text-gray-600 text-center max-w-md">{error}</p>
                  <button className="mt-6 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium">
                    تلاش مجدد
                  </button>
                </div>
              ) : courseRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 lg:py-24">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <svg
                      className="w-10 h-10 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    درخواستی وجود ندارد
                  </h3>
                  <p className="text-gray-500 text-center">
                    هنوز هیچ درخواست دوره‌ای ارسال نشده است
                  </p>
                </div>
              ) : Array.isArray(courseRequests) ? (
                <div className="space-y-6">
                  {/* Desktop Table */}
                  <div className="hidden lg:block overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                            شناسه درخواست
                          </th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                            فرستنده
                          </th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                            متن درخواست
                          </th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                            تاریخ
                          </th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                            عملیات
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {courseRequests.map((cr, index) => (
                          <tr
                            key={cr.id}
                            className="hover:bg-gray-50 transition-colors duration-150 group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                  {index + 1}
                                </div>
                                <span className="mr-3 text-amber-600 font-semibold">
                                  #{cr.id}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                  <svg
                                    className="w-4 h-4 text-gray-600"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                                <span className="mr-3 text-gray-900 font-medium">
                                  {cr.sender}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p
                                className="text-gray-700 max-w-xs truncate"
                                title={cr.text}
                              >
                                {cr.text}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-gray-800 font-medium">
                                {cr.date}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2 ">
                                <button
                                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 rounded-lg text-sm font-medium transition-all duration-200 transform active:scale-95"
                                  onClick={() => {
                                    console.log(cr.cid);
                                    setApproveModal({
                                      open: true,
                                      courseId: cr.cid,
                                      message: "",
                                    });
                                  }}
                                >
                                  ✓ تایید
                                </button>
                                <button
                                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 rounded-lg text-sm font-medium transition-all duration-200 transform active:scale-95"
                                  onClick={() =>
                                    setDeleteModal({
                                      open: true,
                                      cid: cr.cid,
                                      message: "",
                                    })
                                  }
                                >
                                  ✕ رد
                                </button>
                                <Link
                                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md inline-block"
                                  to={`/watchCourse/${cr.cid}`}
                                >
                                  👁 مشاهده
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden space-y-4">
                    {courseRequests.map((cr, index) => (
                      <div
                        key={cr.id}
                        className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                      >
                        <div className="p-5">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-amber-500 rounded-lg flex items-center justify-center text-white font-bold">
                                {index + 1}
                              </div>
                              <div className="mr-3">
                                <p className="text-sm text-gray-500">
                                  شناسه درخواست
                                </p>
                                <p className="text-amber-600 font-semibold">
                                  #{cr.id}
                                </p>
                              </div>
                            </div>
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          </div>

                          <div className="mb-4">
                            <p className="text-sm text-gray-500 mb-1">
                              فرستنده
                            </p>
                            <div className="flex items-center">
                              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                                <svg
                                  className="w-3 h-3 text-gray-600"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <span className="mr-2 text-gray-900 font-medium">
                                {cr.sender}
                              </span>
                            </div>
                          </div>

                          <div className="mb-6">
                            <p className="text-sm text-gray-500 mb-2">
                              متن درخواست
                            </p>
                            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm leading-relaxed">
                              {cr.text}
                            </p>
                          </div>
                          <div className="mb-4">
                            <p className="text-sm text-gray-500 mb-1">تاریخ</p>
                            <p className="text-gray-800 font-medium">
                              {cr.date}
                            </p>
                          </div>
                          <div className="flex flex-col  space-y-2">
                            <div className="flex space-x-2 ">
                              <button
                                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
                                onClick={() =>
                                  setApproveModal({
                                    open: true,
                                    courseId: cr.cid,
                                    message: "",
                                  })
                                }
                              >
                                ✓ تایید
                              </button>
                              <button
                                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
                                onClick={() =>
                                  setDeleteModal({
                                    open: true,
                                    cid: cr.cid,
                                    message: "",
                                  })
                                }
                              >
                                ✕ رد
                              </button>
                              <Link
                                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md inline-block"
                                to={`/watchCourse/${cr.cid}`}
                              >
                                👁 مشاهده
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 lg:py-24">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <svg
                      className="w-10 h-10 text-red-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-red-600 mb-2">
                    داده‌های نامعتبر
                  </h3>
                  <p className="text-gray-600 text-center">
                    داده‌های دریافتی نامعتبر است
                  </p>
                </div>
              )}
            </div>

            {/* Delete Modal */}
            {deleteModal.open && (
              <div
                className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
                onClick={() =>
                  setDeleteModal({ open: false, cid: null, message: "" })
                }
              >
                <div
                  className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        حذف نظر
                      </h3>
                      <button
                        onClick={() =>
                          setDeleteModal({
                            open: false,
                            cid: null,
                            message: "",
                          })
                        }
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    <p className="text-gray-700 mb-4">
                      شما در حال حذف دوره گزارش داده شده از صفحه دوره هستید
                    </p>
                    <textarea
                      value={deleteModal.message}
                      onChange={(e) =>
                        setDeleteModal({
                          ...deleteModal,
                          message: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      placeholder="پیغام مربوطه را برای کاربر گزارش دهنده بنویسید"
                    />
                    <div className="flex justify-end space-x-4 space-x-reverse mt-6">
                      <button
                        onClick={() =>
                          setDeleteModal({
                            open: false,
                            cid: null,
                            message: "",
                          })
                        }
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        انصراف
                      </button>
                      <button
                        onClick={confirmDelete}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        ارسال
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Approve Modal */}
            {approveModal.open && (
              <div
                className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
                onClick={() =>
                  setApproveModal({ open: false, courseId: null, message: "" })
                }
              >
                <div
                  className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        تایید دوره
                      </h3>
                      <button
                        onClick={() =>
                          setApproveModal({
                            open: false,
                            courseId: null,
                            message: "",
                          })
                        }
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    <p className="text-gray-700 mb-4">
                      از دیدگاه شما، دوره مشکلی ندارد
                    </p>
                    <textarea
                      value={approveModal.message}
                      onChange={(e) =>
                        setApproveModal({
                          ...approveModal,
                          message: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      placeholder="پیغام مربوطه را برای کاربر گزارش دهنده بنویسید"
                    />
                    <div className="flex justify-end space-x-4 space-x-reverse mt-6">
                      <button
                        onClick={() =>
                          setApproveModal({
                            open: false,
                            courseId: null,
                            message: "",
                          })
                        }
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        انصراف
                      </button>
                      <button
                        onClick={confirmApprove}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        ارسال
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notification */}
            {deleteModal.open && (
              <div
                className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
                onClick={() =>
                  setDeleteModal({ open: false, cid: null, message: "" })
                }
              >
                <div
                  className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        حذف دوره
                      </h3>
                      <button
                        onClick={() =>
                          setDeleteModal({
                            open: false,
                            cid: null,
                            message: "",
                          })
                        }
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    <p className="text-gray-700 mb-4">
                      شما در حال حذف دوره گزارش داده شده از صفحه دوره هستید
                    </p>
                    <textarea
                      value={deleteModal.message}
                      onChange={(e) =>
                        setDeleteModal({
                          ...deleteModal,
                          message: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      placeholder="پیغام مربوطه را برای کاربر گزارش دهنده بنویسید"
                    />
                    <div className="flex justify-end space-x-4 space-x-reverse mt-6">
                      <button
                        onClick={() =>
                          setDeleteModal({
                            open: false,
                            cid: null,
                            message: "",
                          })
                        }
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        انصراف
                      </button>
                      <button
                        onClick={confirmDelete}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        ارسال
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </section>
    </>
  );
};

export default CourseRequests;
