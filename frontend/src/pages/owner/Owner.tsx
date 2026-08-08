// src/pages/Owner/ManageAdmins.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type ToastType = "success" | "error" | "info";

interface AdminItem {
  username: string;
  messageNumber: number;
}

const API_BASE = "http://localhost:5000";

const Owner: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: ToastType;
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const [newAdmin, setNewAdmin] = useState("");
  const [deleteUser, setDeleteUser] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // بعد از تأیید نقش owner، این مقدار true می‌شود
  const [verified, setVerified] = useState(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 2000);
  };

  const clearAuthAndGoLogin = () => {
    localStorage.removeItem("userName");
    localStorage.removeItem("isUserLogin");
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    navigate("/login");
  };

  const goHome = () => navigate("/");

  const logout = () => {
    clearAuthAndGoLogin();
  };

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/owner/see-admin`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token ?? ""}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: AdminItem[] = await res.json();
      setAdmins(data);
    } catch (e) {
      console.error(e);
      showToast("خطا در دریافت لیست ادمین‌ها", "error");
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (payload: {
    username: string;
    isAdmin: boolean;
    toDelete: boolean;
  }) => {
    const res = await fetch(`${API_BASE}/owner`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token ?? ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  const handleAddAdmin = async () => {
    if (!newAdmin.trim()) {
      showToast("لطفاً نام کاربری را وارد کنید", "error");
      return;
    }
    try {
      setAdding(true);
      await updateUser({
        username: newAdmin.trim(),
        isAdmin: true,
        toDelete: false,
      });
      showToast(`${newAdmin} با موفقیت ادمین شد`, "success");
      setNewAdmin("");
      await fetchAdmins();
    } catch (e) {
      console.error(e);
      showToast("نام کاربر را درست وارد کنید", "error");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUser.trim()) {
      showToast("لطفاً نام کاربری را وارد کنید", "error");
      return;
    }
    try {
      setDeleting(true);
      await updateUser({
        username: deleteUser.trim(),
        isAdmin: false,
        toDelete: true,
      });
      showToast(`کاربر ${deleteUser} با موفقیت حذف شد`, "success");
      setDeleteUser("");
      await fetchAdmins();
    } catch (e) {
      console.error(e);
      showToast("کاربر یافت نشد", "error");
    } finally {
      setDeleting(false);
    }
  };

  const removeAdmin = async (username: string) => {
    try {
      await updateUser({ username, isAdmin: false, toDelete: false });
      showToast(`ادمین ${username} با موفقیت حذف شد`, "success");
      await fetchAdmins();
    } catch (e) {
      console.error(e);
      showToast("خطا در حذف ادمین", "error");
    }
  };

  // اول نقش را بررسی کن؛ اگر owner نبود => خروج و رفتن به login
  useEffect(() => {
    const verify = async () => {
      try {
        const tk = localStorage.getItem("token");
        if (!tk) throw new Error("no token");
        const res = await fetch("http://localhost:4000/login/user-info", {
          method: "GET",
          headers: { Authorization: `Bearer ${tk}` },
        });
        if (!res.ok) throw new Error("unauthorized");
        const data = await res.json(); // { username, userType }
        if (data?.userType !== "owner") throw new Error("not owner");
        setVerified(true);
      } catch {
        clearAuthAndGoLogin();
      }
    };
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // فقط بعد از verified شدن، لیست ادمین‌ها را بگیر
  useEffect(() => {
    if (verified) fetchAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verified]);

  return (
    <div
      dir="rtl"
      className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen relative overflow-hidden"
    >
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mix-blend-multiply blur-xl opacity-20 floating"></div>
        <div
          className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-pink-400 to-red-500 rounded-full mix-blend-multiply blur-xl opacity-20 floating"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mix-blend-multiply blur-xl opacity-10 floating"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      {/* Toast */}
      <div
        className={`fixed top-6 right-6 z-50 transform transition-all duration-500 ease-out ${
          toast.show ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div
          className={`glass-effect rounded-2xl shadow-2xl p-5 max-w-sm border-r-4 ${
            toast.type === "success"
              ? "border-green-500"
              : toast.type === "error"
              ? "border-red-500"
              : "border-blue-500"
          }`}
        >
          <div className="flex items-center">
            <div
              className="flex-shrink-0 w-8 h-8 ml-4 rounded-full flex items-center justify-center
              bg-green-100 text-green-600
              data-[type=error]:bg-red-100 data-[type=error]:text-red-600
              data-[type=info]:bg-blue-100 data-[type=info]:text-blue-600"
              data-type={toast.type}
            >
              {toast.type === "success" && (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
              {toast.type === "error" && (
                <svg
                  className="w-5 h-5"
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
              )}
              {toast.type === "info" && (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </div>
            <div className="text-sm font-medium text-gray-800">
              {toast.message}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-6xl relative z-10">
        {/* Top Actions: خانه + خروج */}
        <div className="flex justify-end gap-3 mb-6">
          <button
            onClick={goHome}
            className="glass-effect px-4 py-2 rounded-xl shadow hover:shadow-lg transition flex items-center gap-2"
            title="خانه"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5z" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            خانه
          </button>

          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl shadow hover:shadow-lg transition flex items-center gap-2 text-white"
            style={{ backgroundImage: "linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)" }}
            title="خروج از حساب"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            خروج
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl mb-6 shadow-xl">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2 md:mb-2">
            پنل مدیریت
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            مدیریت کاربران و دسترسی‌های سیستم
          </p>

          <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto mt-6 rounded-full"></div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <div className="relative inline-flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-indigo-200 rounded-full"></div>
              <div className="absolute w-16 h-16 border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
            </div>
            <p className="text-gray-600 mt-6 text-lg">
              در حال بارگذاری اطلاعات...
            </p>
            <div className="flex justify-center mt-4 space-x-1 space-x-reverse">
              <div className="w-2 h-2 bg-indigo-500 rounded-full pulse-animation"></div>
              <div
                className="w-2 h-2 bg-indigo-500 rounded-full pulse-animation"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-2 h-2 bg-indigo-500 rounded-full pulse-animation"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
          </div>
        )}

        {/* Admin List */}
        {!loading && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl font-bold text-gray-800 flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center ml-4 shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                </div>
                لیست ادمین‌ها
              </h2>
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="bg-indigo-100 text-indigo-800 text-sm font-medium px-4 py-2 rounded-full">
                  {admins.length} ادمین
                </span>
              </div>
            </div>

            <div
              className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
              id="adminCards"
            >
              {admins.length === 0 ? (
                <div className="col-span-full text-center py-20">
                  <div className="relative inline-block mb-8">
                    <div className="w-32 h-32 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto shadow-inner">
                      <svg
                        className="w-16 h-16 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-xs">!</span>
                    </div>
                  </div>
                  <h3 className="text-۲xl font-semibold text-gray-700 mb-3">
                    هیچ ادمینی یافت نشد
                  </h3>
                  <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
                    در حال حاضر هیچ ادمینی در سیستم ثبت نشده است. برای شروع،
                    ادمین جدیدی اضافه کنید.
                  </p>
                  <button
                    onClick={() =>
                      document
                        .getElementById("addAdminInput")
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        })
                    }
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-3 rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    افزودن اولین ادمین
                  </button>
                </div>
              ) : (
                admins.map((admin) => (
                  <div
                    key={admin.username}
                    className="gradient-border card-hover rounded-2xl"
                  >
                    <div className="gradient-border-inner p-8 rounded-[14px]">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                          <div className="relative">
                            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                              {admin.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          </div>
                          <div className="mr-4">
                            <h3 className="font-bold text-gray-800 text-lg">
                              {admin.username}
                            </h3>
                            <p className="text-sm text-gray-500 flex items-center">
                              <span className="w-2 h-2 bg-green-500 rounded-full ml-2"></span>
                              ادمین سیستم
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 flex items-center">
                          <svg
                            className="w-4 h-4 ml-2 text-indigo-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                          {admin.messageNumber} پیام
                        </div>
                      </div>

                      <div className="flex space-x-3 space-x-reverse">
                        <button
                          onClick={() => removeAdmin(admin.username)}
                          className="flex-1 bg-red-50 text-red-600 py-3 px-4 rounded-xl hover:bg-red-100 transition-all duration-300 flex items-center justify-center"
                        >
                          <svg
                            className="w-4 h-4 ml-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          حذف ادمین
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Action Panels */}
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          {/* Add Admin */}
          <div className="glass-effect rounded-2xl shadow-xl p-6 card-hover">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <svg
                className="w-5 h-5 ml-2 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              افزودن ادمین
            </h3>
            <div className="space-y-4">
              <input
                id="addAdminInput"
                type="text"
                placeholder="نام کاربری جدید"
                value={newAdmin}
                onChange={(e) => setNewAdmin(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddAdmin()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
              />
              <button
                onClick={handleAddAdmin}
                disabled={adding}
                className="w-full text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-lg transition-all"
              >
                {adding ? (
                  <span className="inline-block w-5 h-5 border-2 rounded-full border-white/40 border-t-transparent animate-spin" />
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                      />
                    </svg>
                    ادمین کردن
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Delete User */}
          <div className="glass-effect rounded-2xl shadow-xl p-6 card-hover">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <svg
                className="w-5 h-5 ml-2 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              حذف کاربر
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="نام کاربری برای حذف"
                value={deleteUser}
                onChange={(e) => setDeleteUser(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleDeleteUser()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-white"
              />
              <button
                onClick={handleDeleteUser}
                disabled={deleting}
                className="w-full text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center bg-gradient-to-r from-rose-500 to-red-500 hover:shadow-lg transition-all"
              >
                {deleting ? (
                  <span className="inline-block w-5 h-5 border-2 rounded-full border-white/40 border-t-transparent animate-spin" />
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    حذف کاربر
                  </>
                )}
              </button>
            </div>
          </div>

          {/* راهنما */}
          <div className="glass-effect rounded-2xl shadow-xl p-6 card-hover hidden lg:block">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">راهنما</h3>
            <p className="text-gray-600 leading-7">
              برای افزودن ادمین جدید، نام کاربری را وارد و روی «ادمین کردن»
              بزنید. برای حذف کاربر، نام کاربری را وارد و روی «حذف کاربر» کلیک
              کنید. برای حذف نقش ادمینِ یکی از ادمین‌ها از کارت همان ادمین
              استفاده کنید.
            </p>
          </div>
        </div>
      </div>

      {/* Styles to mimic the provided design */}
      <style>{`
        .glass-effect {
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .card-hover {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-hover:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        .gradient-border {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2px;
        }
        .gradient-border-inner {
          background: white;
        }
        .pulse-animation {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
        .floating {
          animation: floating 3s ease-in-out infinite;
        }
        @keyframes floating {
          0% { transform: translate(0, 0px); }
          50% { transform: translate(0, -10px); }
          100% { transform: translate(0, -0px); }
        }
      `}</style>
    </div>
  );
};

export default Owner;
