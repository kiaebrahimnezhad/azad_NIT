import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useWindowSize from "../../hooks/useWindowSize";
import { coreApi, isAxiosErrorWithMessage } from "../../lib/api";

interface ExamRequests {
  id: number;
  type: string;
  sender: string;
  reciver: string;
  eid: number;
  text: string;
  date: string; // اضافه‌شده
}

// تبدیل ISO به تاریخ شمسی yyyy/mm/dd
const toShamsiDate = (iso: string): string => {
  const dt = new Date(iso);
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year:  "numeric",
    month: "2-digit",
    day:   "2-digit",
  }).format(dt);
};

const ExamRequests: React.FC = () => {
  const { width } = useWindowSize();
  const [examRequests, setExamRequests] = useState<ExamRequests[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; examId: number | null; message: string }>({
    open: false,
    examId: null,
    message: '',
  });
  const [approveModal, setApproveModal] = useState<{ open: boolean; examId: number | null; message: string }>({
    open: false,
    examId: null,
    message: '',
  });
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await coreApi.get('/admin/exam-message');
      const data = response.data;
      setExamRequests(
        data.messages.map((m: any) => ({
          ...m,
          date: toShamsiDate(m.date),
        }))
      );
    } catch (err) {
      const message = isAxiosErrorWithMessage(err) && err.response?.data?.message
        ? err.response.data.message
        : 'خطایی رخ داده است';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const confirmDelete = async () => {
    if (!deleteModal.message.trim()) {
      showNotification('لطفاً پیغام را وارد کنید', 'error');
      return;
    }
    try {
      await coreApi.post('/admin/invalid-exam', {
        eid: deleteModal.examId,
        message: deleteModal.message.trim(),
      });
      showNotification('درخواست با موفقیت حذف شد', 'success');
      setDeleteModal({ open: false, examId: null, message: '' });
      fetchData();
    } catch (err) {
      const message = isAxiosErrorWithMessage(err) && err.response?.data?.message
        ? err.response.data.message
        : 'خطایی رخ داد';
      showNotification(message, 'error');
    }
  };

  const confirmApprove = async () => {
    if (!approveModal.message.trim()) {
      showNotification('لطفاً پیغام را وارد کنید', 'error');
      return;
    }
    try {
      await coreApi.post('/admin/validate-exam', {
        examId: approveModal.examId,
        message: approveModal.message.trim(),
      });
      showNotification('درخواست با موفقیت تایید شد', 'success');
      setApproveModal({ open: false, examId: null, message: '' });
      fetchData();
    } catch (err) {
      const message = isAxiosErrorWithMessage(err) && err.response?.data?.message
        ? err.response.data.message
        : 'خطایی رخ داد';
      showNotification(message, 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <>
      <section className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 sm:px-6 lg:px-8">
        <section className={`${width >= 1024 ? "w-full max-w-7xl mx-auto" : "w-full"} py-6 lg:py-8`}>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-8">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" clipRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 0a1 1 0 100 2h.01a1 1 0 100-2H9zm2 0a1 1 0 100 2h.01a1 1 0 100-2H11z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white">درخواست‌های آزمون</h1>
                  <p className="text-purple-100 mt-1">مدیریت و بررسی درخواست‌های آزمون ارسالی</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 lg:p-8">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 lg:py-24">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-400 rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-lg text-gray-600 mt-6 font-medium">در حال بارگذاری...</p>
                  <p className="text-sm text-gray-400 mt-2">لطفاً صبر کنید</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-16 lg:py-24">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-red-600 mb-2">خطایی رخ داده است</h3>
                  <p className="text-gray-600 text-center max-w-md">{error}</p>
                  <button onClick={fetchData} className="mt-6 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium">
                    تلاش مجدد
                  </button>
                </div>
              ) : examRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 lg:py-24">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" clipRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 0a1 1 0 100 2h.01a1 1 0 100-2H9zm2 0a1 1 0 100 2h.01a1 1 0 100-2H11z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">درخواستی وجود ندارد</h3>
                  <p className="text-gray-500 text-center">هنوز هیچ درخواست آزمونی ارسال نشده است</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden lg:block overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">شناسه درخواست</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">فرستنده</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">متن درخواست</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">تاریخ</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">عملیات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {examRequests.map((ex, index) => (
                          <tr key={ex.id} className="hover:bg-gray-50 transition-colors duration-150 group">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                  {index + 1}
                                </div>
                                <span className="mr-3 text-purple-600 font-semibold">#{ex.id}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-gray-900 font-medium">{ex.sender}</span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-gray-700 truncate max-w-xs" title={ex.text}>{ex.text}</p>
                            </td>
                            <td className="px-6 py-4 text-center text-gray-700">
                              {ex.date}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <button
                                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
                                  onClick={() => setApproveModal({ open: true, examId: ex.id, message: '' })}
                                >✓ تایید</button>
                                <button
                                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
                                  onClick={() => setDeleteModal({ open: true, examId: ex.id, message: '' })}
                                >✕ رد</button>
                                <Link
                                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
                                  to={`/exam/${ex.eid}`}
                                >📝 مشاهده</Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden space-y-4">
                    {examRequests.map((ex, index) => (
                      <div key={ex.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                        <div className="p-5">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                                {index + 1}
                              </div>
                              <div className="mr-3">
                                <p className="text-sm text-gray-500">شناسه درخواست</p>
                                <p className="text-purple-600 font-semibold">#{ex.id}</p>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">در انتظار بررسی</span>
                          </div>

                          <div className="mb-4">
                            <p className="text-sm text-gray-500 mb-1">فرستنده</p>
                            <span className="font-medium text-gray-900">{ex.sender}</span>
                          </div>

                          <div className="mb-4">
                            <p className="text-sm text-gray-500 mb-1">تاریخ</p>
                            <span className="font-medium text-gray-900">{ex.date}</span>
                          </div>

                          <div className="mb-6">
                            <p className="text-sm text-gray-500 mb-2">متن درخواست</p>
                            <p className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 leading-relaxed line-clamp-3">{ex.text}</p>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 shadow-sm"
                              onClick={() => setApproveModal({ open: true, examId: ex.id, message: '' })}
                            >✓ تایید</button>
                            <button
                              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 shadow-sm"
                              onClick={() => setDeleteModal({ open: true, examId: ex.id, message: '' })}
                            >✕ رد</button>
                            <Link
                              className="inline-block bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 shadow-sm"
                              to={`/exam/${ex.eid}`}
                            >📝 مشاهده</Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Delete Modal */}
            {deleteModal.open && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50" onClick={() => setDeleteModal({ open: false, examId: null, message: '' })}>
                <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-2/3 lg:w-1/2 p-6" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-medium mb-4">حذف درخواست آزمون</h3>
                  <textarea
                    value={deleteModal.message}
                    onChange={e => setDeleteModal({ ...deleteModal, message: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-3 mb-4"
                    rows={4}
                    placeholder="پیغام برای کاربر بنویسید"
                  />
                  <div className="flex justify-end space-x-4">
                    <button onClick={() => setDeleteModal({ open: false, examId: null, message: '' })} className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400">انصراف</button>
                    <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">ارسال</button>
                  </div>
                </div>
              </div>
            )}

            {/* Approve Modal */}
            {approveModal.open && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50" onClick={() => setApproveModal({ open: false, examId: null, message: '' })}>
                <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-2/3 lg:w-1/2 p-6" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-medium mb-4">تأیید درخواست آزمون</h3>
                  <textarea
                    value={approveModal.message}
                    onChange={e => setApproveModal({ ...approveModal, message: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-3 mb-4"
                    rows={4}
                    placeholder="پیغام برای کاربر بنویسید"
                  />
                  <div className="flex justify-end space-x-4">
                    <button onClick={() => setApproveModal({ open: false, examId: null, message: '' })} className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400">انصراف</button>
                    <button onClick={confirmApprove} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">ارسال</button>
                  </div>
                </div>
              </div>
            )}

            {/* Notification */}
            {notification && (
              <div className={`fixed top-4 left-4 px-6 py-3 rounded-lg shadow-lg z-50 ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                {notification.message}
              </div>
            )}
          </div>
        </section>
      </section>
    </>
  );
};

export default ExamRequests;
