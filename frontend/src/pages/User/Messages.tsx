import React, { useEffect, useState } from "react";
import useWindowSize from "../../hooks/useWindowSize";
import { coreApi, userSafeErrorMessage } from "../../lib/api";

interface Message {
  reciver: string;
  sender: string;
  text: string;
  date: string; // اضافه‌شده برای دریافت تاریخ
}

interface MessagesResponse {
  messages: Message[];
}

// تابع تبدیل ISO به تاریخ شمسی (بدون ساعت)
const toShamsiDate = (iso: string): string => {
  const dt = new Date(iso);
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year:  "numeric",
    month: "2-digit",
    day:   "2-digit",
  }).format(dt);
};

const Messages: React.FC = () => {
  const { width } = useWindowSize();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data } = await coreApi.get<MessagesResponse>("/user/get-message");
        // نگاشت پیام‌ها و تبدیل تاریخ
        setMessages(
          data.messages.map((m) => ({
            reciver: m.reciver,
            sender: m.sender,
            text: m.text,
            date: toShamsiDate(m.date),
          }))
        );
      } catch (e) {
        setError(userSafeErrorMessage(e, "خطا در دریافت پیام‌ها"));
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

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
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white">
                  پیام‌های دریافتی
                </h1>
                <p className="text-blue-100 mt-1">مشاهده و مدیریت پیام‌ها</p>
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
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">خطا در بارگذاری</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  تلاش مجدد
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">پیامی یافت نشد</h3>
                <p className="text-gray-600">هیچ پیامی برای نمایش وجود ندارد</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            {message.sender}
                          </h4>
                          <div className="flex items-center text-xs text-gray-500">
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            پیام #{index + 1}
                          </div>
                        </div>
                        <p className="text-gray-500 text-sm mb-1">
                          تاریخ: {message.date}
                        </p>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {message.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </section>
  );
};

export default Messages;
