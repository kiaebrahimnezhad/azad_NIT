import { useEffect, useState } from 'react';
import useWindowSize from "../../hooks/useWindowSize";
import LoadingSpinner from '../../components/LoadingSpinner';
import { coreApi, isAxiosErrorWithMessage } from '../../lib/api';

interface CommentReport {
  id: number;
  sender: string;
  commentId: number;
  text: string;
  date: string; // تاریخ شمسی
}

interface Comment {
  id: number;
  sender: string;
  course: number;
  text: string;
  replied_to?: number;
}

function CommentReports(){
  const { width } = useWindowSize();

  const [requests, setRequests] = useState<CommentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [commentModal, setCommentModal] = useState<{
    open: boolean;
    comment: Comment | null;
    loading: boolean;
    error: string | null;
  }>({
    open: false,
    comment: null,
    loading: false,
    error: null,
  });

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    commentId: number | null;
    message: string;
  }>({
    open: false,
    commentId: null,
    message: '',
  });

  const [approveModal, setApproveModal] = useState<{
    open: boolean;
    commentId: number | null;
    message: string;
  }>({
    open: false,
    commentId: null,
    message: '',
  });

  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // تبدیل ISO date به تاریخ شمسی (yyyy/mm/dd)
  const toShamsiDate = (iso: string): string => {
    const dt = new Date(iso);
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(dt);
  };
  // نیازی به افکت تایید هویت ندارد
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await coreApi.get('/admin/comment-message');
      const data = response.data;
      setRequests(
        (data.messages ?? []).map((m: any) => ({
          id: m.id,
          sender: m.sender,
          commentId: m.commentId,
          text: m.text,
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
    loadData();
  }, []);

  const viewComment = async (commentId: number) => {
   
    setCommentModal({ open: true, comment: null, loading: true, error: null });
    try {
      const response = await coreApi.post('/admin/get-message', { commentId });
      setCommentModal({
        open: true,
        comment: response.data,
        loading: false,
        error: null,
      });
    } catch (err) {
      const message = isAxiosErrorWithMessage(err) && err.response?.data?.message
        ? err.response.data.message
        : 'خطایی رخ داد';
      setCommentModal({
        open: true,
        comment: null,
        loading: false,
        error: message,
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal.message.trim()) {
      showNotification('لطفاً پیغام را وارد کنید', 'error');
      return;
    }
    try {
      await coreApi.post('/admin/mannage-comment', {
        commentId: deleteModal.commentId,
        message: deleteModal.message.trim(),
        toDelete: true,
      });
      showNotification('نظر با موفقیت حذف شد', 'success');
      setDeleteModal({ open: false, commentId: null, message: '' });
      loadData();
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
      await coreApi.post('/admin/mannage-comment', {
        commentId: approveModal.commentId,
        message: approveModal.message.trim(),
        toDelete: false,
      });
      showNotification('نظر با موفقیت تایید شد', 'success');
      setApproveModal({ open: false, commentId: null, message: '' });
      loadData();
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
    <section className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 sm:px-6 lg:px-8">
      <section className={`${width >= 1024 ? 'w-full max-w-7xl mx-auto' : 'w-full'} py-6 lg:py-8`}>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden" dir="rtl">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 0a1 1 0 100 2h.01a1 1 0 100-2H9zm2 0a1 1 0 100 2h.01a1 1 0 100-2H11z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white">بررسی نظرات</h1>
                <p className="text-green-100 mt-1">مدیریت و بررسی نظرات نامناسب</p>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {loading ? (
                <LoadingSpinner />
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      />
                    </svg>
                  </div>
                  <p className="text-red-600 text-lg mb-2">{error}</p>
                  <button
                    onClick={loadData}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    تلاش مجدد
                  </button>
                </div>
              ) : requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-lg">گزارشی وجود ندارد</p>
                </div>
              ) : (
                <div>
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">لیست گزارش‌های نظرات</h3>
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full min-w-[720px]">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">شناسه گزارش</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">گزارش‌دهنده</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">شناسه نظر</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاریخ</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">متن گزارش</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {requests.map((request) => (
                          <tr key={request.id} className="hover:bg-gray-50 transition-all duration-200">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                              #{request.id}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{request.sender}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                              {request.commentId}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                              {request.date}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 truncate max-w-[200px]">
                              {request.text}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium flex gap-2">
                              <button
                                onClick={() => viewComment(request.commentId)}
                                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                              >
                                📝 مشاهده
                              </button>
                              <button
                                onClick={() => setApproveModal({ open: true, commentId: request.commentId, message: '' })}
                                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg text-sm"
                              >
                                ✓ تایید
                              </button>
                              <button
                                onClick={() => setDeleteModal({ open: true, commentId: request.commentId, message: '' })}
                                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg text-sm"
                              >
                                ✕ رد
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="block lg:hidden">
                    {requests.map((request) => (
                      <div key={request.id} className="border-b border-gray-200 p-4 hover:bg-gray-50 transition-all duration-200">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs text-gray-500">شناسه گزارش</div>
                            <div className="font-medium">#{request.id}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">گزارش‌دهنده</div>
                            <div className="font-medium truncate">{request.sender}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">شناسه نظر</div>
                            <div className="font-medium">{request.commentId}</div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-xs text-gray-500">متن گزارش</div>
                            <div className="font-medium line-clamp-2">{request.text}</div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-xs text-gray-500">تاریخ</div>
                            <div className="font-medium">{request.date}</div>
                          </div>
                          <div className="col-span-2 mt-2 flex flex-wrap gap-2">
                            <button onClick={() => viewComment(request.commentId)} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg text-sm">
                              📝 مشاهده
                            </button>
                            <button onClick={() => setApproveModal({ open: true, commentId: request.commentId, message: '' })} className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg text-sm">
                              ✓ تایید
                            </button>
                            <button onClick={() => setDeleteModal({ open: true, commentId: request.commentId, message: '' })} className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg text-sm">
                              ✕ رد
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comment Modal */}
          {commentModal.open && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setCommentModal({ open: false, comment: null, loading: false, error: null })}>
              <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">مشاهده نظر</h3>
                    <button onClick={() => setCommentModal({ open: false, comment: null, loading: false, error: null })} className="text-gray-400 hover:text-gray-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-4">
                    {commentModal.loading ? (
                      <div className="text-center py-8">
                        <div className="loading-spinner mx-auto mb-4"></div>
                        <p className="text-gray-600">در حال بارگذاری نظر...</p>
                      </div>
                    ) : commentModal.error ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-red-600">{commentModal.error}</p>
                      </div>
                    ) : commentModal.comment ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">شناسه نظر</label>
                          <p className="text-sm text-gray-900">#{commentModal.comment.id}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">نویسنده نظر</label>
                          <p className="text-sm text-gray-900">{commentModal.comment.sender}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">شناسه دوره</label>
                          <p className="text-sm text-gray-900">{commentModal.comment.course}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">متن نظر</label>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-900">{commentModal.comment.text}</p>
                          </div>
                        </div>
                        {commentModal.comment.replied_to && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">پاسخ به نظر</label>
                            <p className="text-sm text-gray-900">#{commentModal.comment.replied_to}</p>
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                  <div className="flex justify-end mt-6">
                    <button onClick={() => setCommentModal({ open: false, comment: null, loading: false, error: null })} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors">
                      بستن
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Modal */}
          {deleteModal.open && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50" onClick={() => setDeleteModal({ open: false, commentId: null, message: '' })}>
              <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white" onClick={e => e.stopPropagation()}>
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">رد نظر</h3>
                    <button onClick={() => setDeleteModal({ open: false, commentId: null, message: '' })} className="text-gray-400 hover:text-gray-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-gray-700 mb-4">
                    شما در حال رد و حذف نظر گزارش داده شده هستید
                  </p>
                  <textarea
                    value={deleteModal.message}
                    onChange={(e) => setDeleteModal({ ...deleteModal, message: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="پیغام مربوطه را برای کاربر بنویسید"
                  />
                  <div className="flex justify-end space-x-4 space-x-reverse mt-6">
                    <button
                      onClick={() => setDeleteModal({ open: false, commentId: null, message: '' })}
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
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50" onClick={() => setApproveModal({ open: false, commentId: null, message: '' })}>
              <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white" onClick={e => e.stopPropagation()}>
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">تایید نظر</h3>
                    <button onClick={() => setApproveModal({ open: false, commentId: null, message: '' })} className="text-gray-400 hover:text-gray-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-gray-700 mb-4">
                    شما در حال تایید نظر گزارش داده شده هستید
                  </p>
                  <textarea
                    value={approveModal.message}
                    onChange={(e) => setApproveModal({ ...approveModal, message: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="پیغام مربوطه را برای کاربر بنویسید"
                  />
                  <div className="flex justify-end space-x-4 space-x-reverse mt-6">
                    <button
                      onClick={() => setApproveModal({ open: false, commentId: null, message: '' })}
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
          {notification && (
            <div className={`fixed top-4 left-4 px-6 py-3 rounded-lg shadow-lg z-50 ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
              {notification.message}
            </div>
          )}

          {/* استایل‌های spinner و غیره */}
          <style>{`
            .loading-spinner {
              border: 3px solid #f3f3f3;
              border-top: 3px solid #3498db;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .line-clamp-2 {
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
          `}</style>
        </div>
      </section>
    </section>
  );
};

export default CommentReports;
