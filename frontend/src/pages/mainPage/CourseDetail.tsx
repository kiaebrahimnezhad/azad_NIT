// src/pages/Course/CourseDetail.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';

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

/* ---------- کمکی‌ها ---------- */
const formatMinutes = (m: number) =>
  `${Math.floor(m / 60)}:${(m % 60).toString().padStart(2, '0')}`;

const toFa = (d: string) => new Date(d).toLocaleDateString('fa-IR');

const imgUrl = (p: string | null) =>
  p
    ? `http://localhost:5000/${p.replace(/\\/g, '/')}`
    : 'http://localhost:5000/uploads/default.jpg';

const CourseDetail: React.FC = () => {
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
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // دوره
        const cRes = await fetch('http://localhost:5000/admin/get-course', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ cid: Number(cid) })
        });
        if (!cRes.ok) throw new Error(`خطای سرور (${cRes.status})`);
        const cJson = await cRes.json();
        if (!cJson.course) throw new Error('دوره‌ای یافت نشد.');

        setCourse(cJson.course);
        setTimes(cJson.time ?? []);
        setImage(cJson.image ?? null);

        // نظرات
        await fetchComments();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'خطایی رخ داد');
      } finally {
        setLoading(false);
      }
    };

    const fetchComments = async () => {
      const res = await fetch('http://localhost:5000/admin/get-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cid: Number(cid) })
      });
      if (res.ok) {
        const { comments } = await res.json();
        setComments(comments ?? []);
      }
    };

    fetchData();
  }, [cid]);

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

  const refetchComments = async () => {
    const res = await fetch('http://localhost:5000/admin/get-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ cid: Number(cid) })
    });
    const { comments } = await res.json();
    setComments(comments ?? []);
  };

  /* ارسال نظر */
  const sendComment = async () => {
    if (!msg.trim()) return;
    try {
      setSending(true);
      const token = localStorage.getItem('token') || '';
      const res = await fetch('http://localhost:5000/user/send-comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization  : `Bearer ${token}`
        },
        body: JSON.stringify({
          replied_to: replyTo,
          text: msg.trim(),      // ← حتماً text
          course: Number(cid)
        })
      });
      const j = await res.json();
      if (res.ok && j.success) {
        showToast('✅ نظر ثبت شد', true);
        setMsg(''); setReplyTo(null);
        await refetchComments();
      } else {
        throw new Error(j.message || 'خطا در ثبت نظر');
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'خطایی رخ داد', false);
    } finally {
      setSending(false);
    }
  };

  /* افزودن به سبد خرید */
  const addToBasket = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('http://localhost:5000/payment/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ cid: Number(cid) })
      });
      const j = await res.json();
      if (res.ok && j.success) showToast(j.message, true);
      else throw new Error(j.message || 'خطا در افزودن به سبد خرید');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'خطایی رخ داد', false);
    }
  };

  /* گزارش کامنت */
  const sendReport = async () => {
    if (!reportTxt.trim() || reportId === null) return;
    try {
      setReporting(true);
      const token = localStorage.getItem('token') || '';
      const res = await fetch('http://localhost:5000/user/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization  : `Bearer ${token}`
        },
        body: JSON.stringify({
          commentId: reportId,
          text     : reportTxt.trim()
        })
      });
      const j = await res.json();
      if (res.ok && j.success) {
        showToast('✅ گزارش ثبت شد', true);
        setReportId(null);
        setReportTxt('');
      } else throw new Error(j.message || 'خطا در ارسال گزارش');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'خطایی رخ داد', false);
    } finally {
      setReporting(false);
    }
  };

  /* نمایش */
  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-blue-600 animate-pulse">در حال بارگذاری…</p></div>;
  if (error)   return <div className="flex items-center justify-center min-h-screen"><div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded">{error}</div></div>;
  if (!course) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-600">دوره‌ای یافت نشد.</p></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* دکمه سبد خرید */}
      <button
        onClick={() => navigate('../pay/basket')}
        className="fixed top-4 left-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow z-20"
      >
        سبد خرید 🛒
      </button>

      <main className="flex-grow pt-20 pb-10">
        <div className="container mx-auto px-4 space-y-10">
          {/* کارت دوره */}
          <section className="bg-white shadow-xl rounded-xl overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/3 bg-gray-100 flex items-center justify-center">
                <img
                  src={imgUrl(image)}
                  alt={course.name}
                  className="w-full h-80 md:h-full object-contain p-4"
                  onError={e => { (e.target as HTMLImageElement).src = 'http://localhost:5000/uploads/default.jpg'; }}
                />
              </div>
              <div className="md:w-2/3 p-8 space-y-4">
                <h1 className="text-3xl font-extrabold text-gray-800">{course.name}</h1>
                <p className="text-gray-700 leading-relaxed">{course.description}</p>
                <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-600">
                  <p><strong>رشته:</strong> {course.field1} / {course.field2}</p>
                  <p><strong>قیمت:</strong> {course.price.toLocaleString('fa-IR')} تومان</p>
                  <p><strong>شروع دوره:</strong> {toFa(course.start_time)}</p>
                  <p><strong>پایان دوره:</strong> {toFa(course.end_time)}</p>
                  <p><strong>شروع ثبت‌نام:</strong> {toFa(course.start_sign_up)}</p>
                  <p><strong>پایان ثبت‌نام:</strong> {toFa(course.end_sign_up)}</p>
                </div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${course.is_valid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {course.is_valid ? 'فعال' : 'غیرفعال'}
                </span>
                {!!times.length && (
                  <div className="pt-4">
                    <h2 className="font-bold mb-2">⏰ زمان برگزاری</h2>
                    <ul className="space-y-1">
                      {times.map((t,i) => (
                        <li key={i} className="text-gray-700">{t.day}: {formatMinutes(t.start_time)} – {formatMinutes(t.end_time)}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <button
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:to-blue-800 text-white py-3 rounded-lg shadow-md mt-6"
                  onClick={addToBasket}
                >
                  افزودن به سبد خرید
                </button>
              </div>
            </div>
          </section>

          {/* نظرات */}
          <section className="bg-white shadow-lg rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6">💬 نظرات کاربران</h2>
            {commentTree.length ? (
              <ul className="space-y-8">
                {commentTree.map(parent => (
                  <li key={parent.id}>
                    {/* کامنت اصلی */}
                    <div className="relative rounded-lg bg-gray-50 border border-gray-200 p-4 shadow-sm flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-blue-700">{parent.sender}</p>
                        <p className="text-gray-800 whitespace-pre-line">{parent.text}</p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <button className="text-sm text-blue-600 hover:underline" onClick={() => { setReplyTo(parent.id); setMsg(''); }}>پاسخ</button>
                        <button className="text-sm text-red-500 hover:underline" onClick={() => { setReportId(parent.id); setReportTxt(''); }}>گزارش</button>
                      </div>
                    </div>

                    {/* پاسخ‌ها */}
                    {parent.replies.map(rep => (
                      <div key={rep.id} className="relative ml-6 mt-4 border-l-4 border-blue-200 pl-4 bg-blue-50 rounded-lg flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-blue-600">{rep.sender}</p>
                          <p className="text-gray-700 whitespace-pre-line">{rep.text}</p>
                        </div>
                        <div className="flex flex-col items-end space-y-1 text-xs">
                          <button className="text-blue-600 hover:underline" onClick={() => { setReplyTo(rep.id); setMsg(''); }}>پاسخ</button>
                          <button className="text-red-500 hover:underline" onClick={() => { setReportId(rep.id); setReportTxt(''); }}>گزارش</button>
                        </div>
                      </div>
                    ))}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">هنوز نظری ثبت نشده است.</p>
            )}

            {/* ارسال نظر/پاسخ */}
            <div className="mt-10">
              <h3 className="font-bold mb-2">{replyTo ? 'ارسال پاسخ' : 'افزودن نظر جدید'}</h3>
              <textarea
                value={msg}
                onChange={e => setMsg(e.target.value)}
                rows={4}
                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                placeholder="متن خود را بنویسید…"
              />
              <div className="flex items-center gap-3 mt-3">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg disabled:opacity-50"
                  disabled={sending || !msg.trim()}
                  onClick={sendComment}
                >
                  {sending ? 'در حال ارسال…' : 'ارسال'}
                </button>
                {replyTo !== null && (
                  <button className="text-sm text-gray-600 hover:underline" onClick={() => { setReplyTo(null); setMsg(''); }}>
                    لغو
                  </button>
                )}
              </div>
            </div>

            {/* ارسال گزارش */}
            {reportId !== null && (
              <div className="mt-10">
                <h3 className="font-bold mb-2">گزارش این کامنت</h3>
                <textarea
                  value={reportTxt}
                  onChange={e => setReportTxt(e.target.value)}
                  rows={3}
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-red-400"
                  placeholder="دلیل گزارش را بنویسید…"
                />
                <div className="flex items-center gap-3 mt-3">
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white py-2 px-6 rounded-lg disabled:opacity-50"
                    disabled={reporting || !reportTxt.trim()}
                    onClick={sendReport}
                  >
                    {reporting ? 'در حال ارسال…' : 'ارسال گزارش'}
                  </button>
                  <button className="text-sm text-gray-600 hover:underline" onClick={() => setReportId(null)}>
                    لغو
                  </button>
                </div>
              </div>
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
