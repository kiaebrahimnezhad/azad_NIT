import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';
import { coreApi, userSafeErrorMessage, isAxiosErrorWithMessage } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import CourseInfoCard from '../../components/CourseInfoCard';
import CommentItem from '../../components/CommentItem';
import ReplyItem from '../../components/ReplyItem';
import CommentActionForm from '../../components/CommentActionForm';

/* ---------- انواع ---------- */
interface Course {
  cid: number;
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  start_sign_up: string;
  end_sign_up: string;
  price: number;
  field1: string;
  field2: string;
  is_valid: boolean;
}

interface TimeSlot {
  day: string;
  start_time: number;
  end_time: number;
}

interface Comment {
  id: number;
  sender: string;
  text: string;
  replied_to: number | null;
}

interface CourseDetailResponse {
  course: Course;
  time: TimeSlot[];
  image: string | null;
}

interface CommentsResponse {
  comments: Comment[];
}

interface ActionResponse {
  success: boolean;
  message: string;
}

/* ---------- کمکی‌ها ---------- */
function CourseDetail(){
  const { cid } = useParams<{ cid: string }>();
  const navigate = useNavigate();

  const [course, setCourse]     = useState<Course | null>(null);
  const [times, setTimes]       = useState<TimeSlot[]>([]);
  const [image, setImage]       = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  /* ارسال نظر */
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [msg, setMsg]         = useState('');
  const [sending, setSending] = useState(false);

  /* گزارش کامنت */
  const [reportId, setReportId]   = useState<number | null>(null);
  const [reportTxt, setReportTxt] = useState('');
  const [reporting, setReporting] = useState(false);

  /* Toast */
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  /* واکشی اطلاعات */

  const { isUserLogin } = useAuth();

  const fetchComments = useCallback(async () => {
    const { data } = await coreApi.post<CommentsResponse>('/admin/get-comment', { cid: Number(cid) });
    setComments(data.comments ?? []);
  }, [cid]);
  

  useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await coreApi.post<CourseDetailResponse>('/admin/get-course', { cid: Number(cid) });

      setCourse(data.course);
      setTimes(data.time ?? []);
      setImage(data.image ?? null);

      await fetchComments();
    } catch (e) {
      if (isAxiosErrorWithMessage(e) && e.response?.status === 404) {
        setError('دوره‌ای یافت نشد.');
      } else {
        setError(userSafeErrorMessage(e, 'خطا در بارگذاری اطلاعات دوره.'));
      }
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [cid, fetchComments]);

  /* درخت کامنت‌ها */
  const commentTree = useMemo(() => {
    const roots = comments.filter(c => c.replied_to === null);
    return roots.map(r => ({
      ...r,
      replies: comments.filter(c => c.replied_to === r.id)
    }));
  }, [comments]);

  /* توابع کمکی */
  const showToast = (text: string, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 2000);
  };

  /* ارسال نظر */
  const sendComment = async () => {
    if (!msg.trim()) return;
    if (!isUserLogin) {
      showToast('برای ثبت نظر ابتدا وارد شوید', false);
      return;
    }
    try {
      setSending(true);
      const { data } = await coreApi.post<ActionResponse>('/user/send-comment', {
        replied_to: replyTo,
        text: msg.trim(),
        course: Number(cid),
      });
      if (data.success) {
        showToast('✅ نظر ثبت شد', true);
        setMsg('');
        setReplyTo(null);
        await fetchComments();
      } else {
        showToast(data.message || 'خطا در ثبت نظر', false);
      }
    } catch (e) {
      showToast(userSafeErrorMessage(e, 'خطا در ثبت نظر'), false);
    } finally {
      setSending(false);
    }
  };

  /* افزودن به سبد خرید */
  const addToBasket = async () => {
    if (!isUserLogin) {
      showToast('برای افزودن به سبد خرید ابتدا وارد شوید', false);
      return;
    }
    try {
      const { data } = await coreApi.post<ActionResponse>('/payment/add', { cid: Number(cid) });
      showToast(data.message, data.success);
    } catch (e) {
      showToast(userSafeErrorMessage(e, 'خطا در افزودن به سبد خرید'), false);
    }
  };

  /* گزارش کامنت */
  const sendReport = async () => {
    if (!reportTxt.trim() || reportId === null) return;
    if (!isUserLogin) {
      showToast('برای ارسال گزارش ابتدا وارد شوید', false);
      return;
    }
    try {
      setReporting(true);
      const { data } = await coreApi.post<ActionResponse>('/user/review', {
        commentId: reportId,
        text: reportTxt.trim(),
      });
      if (data.success) {
        showToast('✅ گزارش ثبت شد', true);
        setReportId(null);
        setReportTxt('');
      } else {
        showToast(data.message || 'خطا در ارسال گزارش', false);
      }
    } catch (e) {
      showToast(userSafeErrorMessage(e, 'خطا در ارسال گزارش'), false);
    } finally {
      setReporting(false);
    }
  };

  /* نمایش */
  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-blue-600 animate-pulse">در حال بارگذاری…</p></div>;
  if (error)   return <div className="flex items-center justify-center min-h-screen"><div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded">{error}</div></div>;
  if (!course) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-600">دوره‌ای یافت نشد.</p></div>;

  return (
    <div className="min-h-screen bg-gray-50  flex flex-col">
      {/* ⚠️ */}
      {/* دکمه سبد خرید */} {/* کاملا بی‌مورد. باید در هدر بیایید */}
      <button
        onClick={
          () => {
            isUserLogin ? navigate('/pay/basket') : showToast('برای مشاهده سبد خرید ابتدا وارد شوید', false)
          }
        }
        className="fixed top-4 left-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow z-20"
      >
        سبد خرید 🛒
      </button>

      

      <main className="flex-grow pt-20 pb-10">
        <div className="container mx-auto px-4 space-y-10">
          {/* کارت دوره */}
          <CourseInfoCard course={course} image={image} times={times} onAddToBasket={addToBasket} />
          {/* نظرات */}
          <section className="bg-white shadow-lg rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6">💬 نظرات کاربران</h2>
            {commentTree.length ? (
              <ul className="space-y-8">
                {/* کامنت‌های اصلی */}
                {
                  commentTree.map(
                    parent => (
                      <li key={parent.id}>
                        <CommentItem
                          id={parent.id}
                          sender={parent.sender}
                          text={parent.text}
                          onReply={(id) => { setReplyTo(id); setMsg(''); }}
                          onReport={(id) => { setReportId(id); setReportTxt(''); }}
                        />
                        {
                          parent.replies.map(
                            rep => (
                              <ReplyItem
                                key={rep.id}
                                id={rep.id}
                                sender={rep.sender}
                                text={rep.text}
                                onReply={(id) => { setReplyTo(id); setMsg(''); }}
                                onReport={(id) => { setReportId(id); setReportTxt(''); }}
                              />
                            )
                          )
                        }
                      </li>
                    )
                  )
                }
              </ul>
            ) : (
              <p className="text-gray-500">هنوز نظری ثبت نشده است.</p>
            )}

            {/* ارسال نظر/پاسخ */}
            <CommentActionForm
              variant="comment" title={replyTo ? "ارسال پاسخ" : "افزودن نظر جدید"}
              value={msg} onChange={setMsg}
              onSubmit={sendComment} submitting={sending}
              submitLabel="ارسال" submittingLabel="در حال ارسال…"
              placeholder="متن خود را بنویسید…"
              onCancel={replyTo !== null ? () => { setReplyTo(null); setMsg(''); } : undefined}
            />

            {/* ارسال گزارش */}
            {reportId !== null && (
            <CommentActionForm
              variant="report"
              title="گزارش این کامنت"
              value={reportTxt}
              onChange={setReportTxt}
              onSubmit={sendReport}
              submitting={reporting}
              submitLabel="ارسال گزارش"
              submittingLabel="در حال ارسال…"
              placeholder="دلیل گزارش را بنویسید…"
              rows={3}
              onCancel={() => setReportId(null)}
            />
          )}
          </section>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className={`fixed left-1/2 -translate-x-1/2 bottom-8 px-6 py-3 rounded-lg text-white shadow-lg ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.text}
        </div>
      )}

      <Footer />
    </div>
  );
};

export default CourseDetail;
