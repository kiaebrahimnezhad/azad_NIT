import React, { useEffect, useState } from "react";
import useWindowSize from "../../hooks/useWindowSize";
import { coreApi, isAxiosErrorWithMessage } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/LoadingSpinner";
import Input from "../../components/Input";

interface UserData {
  username: string;
  first_name: string;
  last_name: string;
  father_name: string | null;
  field: string;
  student_id: string | null;
  phone: string | null;
  mail: string;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
  id: number;
}

function Information(){
  const { width } = useWindowSize();
  const { refreshSession } = useAuth();
  const [userData, setUserData] = useState<UserData>({
    username: "",
    first_name: "",
    last_name: "",
    father_name: "",
    field: "",
    student_id: "",
    phone: "",
    mail: ""
  });
  const [originalData, setOriginalData] = useState<UserData>({
    username: "",
    first_name: "",
    last_name: "",
    father_name: "",
    field: "",
    student_id: "",
    phone: "",
    mail: ""
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isFieldDropdownOpen, setIsFieldDropdownOpen] = useState(false);

  const fieldOptions = [
    "عمومی",
    "علوم پایه", 
    "برق و کامپیوتر",
    "مکانیک",
    "عمران و معماری",
    "صنایع و مدیریت"
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data } = await coreApi.get<UserData>("/user/get-user");
        const processedData = {
          ...data,
          father_name: data.father_name || "",
          student_id: data.student_id || "",
          phone: data.phone || ""
        };

        setUserData(processedData);
        setOriginalData(processedData);
      } catch {
        showToast("خطا در دریافت اطلاعات کاربری", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const isChanged = JSON.stringify(userData) !== JSON.stringify(originalData);
    setHasChanges(isChanged);
  }, [userData, originalData]);

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    const newToast = { message, type, id };
    setToasts(prev => [...prev, newToast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  const handleInputChange = (field: keyof UserData, value: string) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFieldSelect = (field: string) => {
    setUserData(prev => ({
      ...prev,
      field: field
    }));
    setIsFieldDropdownOpen(false);
  };

   const handleUpdateUser = async () => {
    if (userData.username !== originalData.username) {
      const confirmed = window.confirm(
        "شما در حال تغییر نام کاربری هستید. این تغییر روی کل حساب شما (دوره‌ها، پیام‌ها، نمرات) اثر می‌گذارد. مطمئن هستید؟"
      );
      if (!confirmed) return;
    }

    setUpdating(true);
    try {
      const { data: result } = await coreApi.post<{ message: string; token?: string }>(
        "/user/update-user",
        userData
      );

      // اگر توکن جدید دریافت شد (تغییر نام‌کاربری)، در localStorage ذخیره و AuthContext را هم‌گام کن
      if (result.token) {
        localStorage.setItem("token", result.token);
        await refreshSession();
      }
      setOriginalData(userData);            // دادهٔ مرجع جدید
      showToast(result.message, "success");
    } catch (e) {
      const message = isAxiosErrorWithMessage(e) && e.response?.data?.message
        ? e.response.data.message
        : "خطا در به‌روزرسانی اطلاعات";
      showToast(message, "error");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <LoadingSpinner />
    );
  }

  return (
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
                  className="w-5 h-5 ml-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.84L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.84l-7-3z" />
                  <path d="M3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white">
                  اطلاعات کاربری
                </h1>
                <p className="text-blue-100 mt-1">مدیریت و بررسی اطلاعات</p>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6 lg:p-8">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Username */}
              <Input
                name="username"
                label="نام کاربری"
                value={userData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                divClass="space-y-2"
                inpClass="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />

              {/* First Name */}
              <Input
                name="first_name"
                label="نام"
                value={userData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                divClass="space-y-2"
                inpClass="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />

              {/* Last Name */}
              <Input
                name="last_name"
                label="نام خانوادگی"
                value={userData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                divClass="space-y-2"
                inpClass="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />

              {/* Father Name */}
              <Input
                name="father_name"
                label="نام پدر"
                value={userData.father_name ?? ""}
                onChange={(e) => handleInputChange('father_name', e.target.value)}
                divClass="space-y-2"
                inpClass="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />

              {/* Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  رشته تحصیلی
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsFieldDropdownOpen(!isFieldDropdownOpen)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-right bg-white flex items-center justify-between"
                  >
                    <span>{userData.field}</span>
                    <svg
                      className={`w-5 h-5 transition-transform ${isFieldDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isFieldDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                      {fieldOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleFieldSelect(option)}
                          className="w-full px-4 py-3 text-right hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Student ID */}
              <Input
                name="student_id"
                label="شماره دانشجویی"
                value={userData.student_id ?? ""}
                onChange={(e) => handleInputChange('student_id', e.target.value)}
                divClass="space-y-2"
                inpClass="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />

              {/* Phone */}
              <Input
                name="phone"
                label="شماره تلفن"
                value={userData.phone ?? ""}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                divClass="space-y-2"
                inpClass="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />

              {/* Email */}
              <Input
                name="mail"
                type="email"
                label="ایمیل"
                value={userData.mail}
                onChange={(e) => handleInputChange('mail', e.target.value)}
                divClass="space-y-2 md:col-span-2"
                inpClass="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Update Button */}
            <div className="mt-8 text-center">
              <button
                onClick={handleUpdateUser}
                disabled={!hasChanges || updating}
                className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 ${
                  hasChanges && !updating
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {updating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                    در حال به‌روزرسانی...
                  </div>
                ) : (
                  'ویرایش اطلاعات'
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Toast Notifications */}
      <div className="fixed top-4 left-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-6 py-4 rounded-lg shadow-lg text-white font-medium animate-slide-in ${
              toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            <div className="flex items-center">
              {toast.type === 'success' ? (
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {toast.message}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </section>
  );
};

export default Information;