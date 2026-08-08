// src/pages/CreateExamPage.tsx
import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

/* ====== Helpers (Jalali → Gregorian) ====== */
// ساده و کافی برای تبدیل. اگر کتابخانه جلالی دارید، جایگزین کنید.
function div(a: number, b: number) { return ~~(a / b); }
function jalaliToGregorian(jy: number, jm: number, jd: number) {
  let gy: number;
  if (jy > 979) {
    gy = 1600;
    jy -= 979;
  } else {
    gy = 621;
  }

  let days =
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4);

  for (let i = 0; i < jm - 1; ++i) {
    days += i < 6 ? 31 : 30;
  }
  days += jd - 1;

  gy += 400 * Math.floor(days / 146097);
  days %= 146097;

  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }

  gy += 4 * Math.floor(days / 1461);
  days %= 1461;

  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  const gdArr = [
    0,
    31,
    ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31
  ];
  let gm = 0;
  for (gm = 1; gm <= 12 && days >= gdArr[gm]; gm++) {
    days -= gdArr[gm];
  }

  return { gy, gm, gd: days + 1 };
}



const pad2 = (x: number) => String(x).padStart(2, "0");
const toIsoUTCFromJalali = (jy?: number, jm?: number, jd?: number, hh?: number, mm?: number) => {
  if (!jy || !jm || !jd || hh === undefined || mm === undefined) return null;
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
  const date = new Date(Date.UTC(gy, gm - 1, gd, hh, mm, 0));
  return isNaN(date.getTime()) ? null : date.toISOString();
};

/* ====== Types ====== */
type Question = { quest: string; options: string[]; ans: number };
type JDate = { y?: number; m?: number; d?: number; hh?: number; mm?: number };

/* ====== Component ====== */
const CreateExamPage: React.FC = () => {
  const { cid } = useParams<{ cid: string }>();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([
    { quest: "", options: ["", ""], ans: 1 },
  ]);

  const [startJ, setStartJ] = useState<JDate>({});
  const [endJ, setEndJ] = useState<JDate>({});
  const [duration, setDuration] = useState<number>(60);
  const [minScore, setMinScore] = useState<number>(10);
  const [message, setMessage] = useState<string>("");

  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const showToast = (ok: boolean, text: string) => {
    setToast({ ok, text });
    setTimeout(() => setToast(null), 2000);
  };

  const years = useMemo(() => Array.from({ length: 101 }, (_, i) => 1400 + i), []);
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const days = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), []);

  const canUse31 = (m?: number) => !m || m <= 6;

  /* ====== Question handlers ====== */
  const addQuestion = () => {
    setQuestions((qs) => [...qs, { quest: "", options: ["", ""], ans: 1 }]);
  };

  const removeQuestion = (qi: number) => {
    setQuestions((qs) => qs.filter((_, i) => i !== qi));
  };

  const moveQuestionUp = (qi: number) => {
    setQuestions((qs) => {
      if (qi <= 0) return qs;
      const copy = [...qs];
      [copy[qi - 1], copy[qi]] = [copy[qi], copy[qi - 1]];
      return copy;
    });
  };

  const moveQuestionDown = (qi: number) => {
    setQuestions((qs) => {
      if (qi >= qs.length - 1) return qs;
      const copy = [...qs];
      [copy[qi + 1], copy[qi]] = [copy[qi], copy[qi + 1]];
      return copy;
    });
  };

  const updateQuest = (qi: number, val: string) => {
    setQuestions((qs) => {
      const copy = [...qs];
      copy[qi].quest = val;
      return copy;
    });
  };

  const updateOption = (qi: number, oi: number, val: string) => {
    setQuestions((qs) => {
      const copy = [...qs];
      copy[qi].options[oi] = val;
      return copy;
    });
  };

  const addOption = (qi: number) => {
    setQuestions((qs) => {
      const copy = [...qs];
      if (copy[qi].options.length < 5) copy[qi].options.push("");
      return copy;
    });
  };

  const removeOption = (qi: number, oi: number) => {
    setQuestions((qs) => {
      const copy = [...qs];
      const q = copy[qi];
      if (oi < 2) return qs; // گزینه‌های 1 و 2 حذف‌پذیر نیستند
      const removedIndex1Based = oi + 1;
      q.options.splice(oi, 1);
      // تنظیمِ ans اگر از محدوده خارج شد یا به گزینه حذف‌شده اشاره می‌کرد
      if (q.ans === removedIndex1Based) q.ans = 1;
      else if (q.ans > q.options.length) q.ans = q.options.length;
      return copy;
    });
  };

  const updateAnswer = (qi: number, ans: number) => {
    setQuestions((qs) => {
      const copy = [...qs];
      copy[qi].ans = ans;
      return copy;
    });
  };

  /* ====== Submit ====== */
  const validate = () => {
    if (!cid) return "شناسه دوره معتبر نیست";
    if (!duration || duration <= 0) return "مدت آزمون را درست وارد کنید";

    // تاریخ/ساعت
    const sIso = toIsoUTCFromJalali(startJ.y, startJ.m, startJ.d, startJ.hh, startJ.mm);
    const eIso = toIsoUTCFromJalali(endJ.y, endJ.m, endJ.d, endJ.hh, endJ.mm);
    if (!sIso || !eIso) return "تاریخ/ساعت شروع و پایان را کامل وارد کنید";
    if (new Date(sIso).getTime() >= new Date(eIso).getTime())
      return "پایان آزمون باید بعد از شروع باشد";

  const startDateObj = new Date(sIso);
  const now = new Date();

  if (startDateObj <= now) {
    return "زمان شروع آزمون باید بعد از زمان فعلی باشد";
  }

    // سوالات
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.quest.trim()) return `صورت سؤال ${i + 1} را وارد کنید`;
      if (!q.options[0].trim() || !q.options[1].trim())
        return `گزینه‌های ۱ و ۲ سؤال ${i + 1} الزامی هستند`;
      if (q.ans < 1 || q.ans > q.options.length)
        return `گزینه صحیح سؤال ${i + 1} نامعتبر است`;
      // حداقل باید start < end در سطح کل آزمون چک شده؛ تکمیلی نیاز نیست اینجا
    }
    return null;
  };

  const submit = async () => {
    const v = validate();
    if (v) return showToast(false, v);

    const token = localStorage.getItem("token");
    if (!token) return showToast(false, "ابتدا وارد شوید");

    const sIso = toIsoUTCFromJalali(startJ.y, startJ.m, startJ.d, startJ.hh, startJ.mm)!;
    const eIso = toIsoUTCFromJalali(endJ.y, endJ.m, endJ.d, endJ.hh, endJ.mm)!;

    const qsPayload = questions.map((q) => {
      const [o1, o2, o3 = "", o4 = "", o5 = ""] = q.options;
      return {
        quest: q.quest,
        option1: o1,
        option2: o2,
        option3: o3,
        option4: o4,
        option5: o5,
        ans: q.ans,
      };
    });

    try {
      const { data } = await axios.post(
        "http://localhost:5000/exam",
        {
          cid: Number(cid),
          min_score: minScore,
          start_time: sIso,
          end_time: eIso,
          duration,
          message,
          questions: qsPayload,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(true, data?.message || "ثبت آزمون با موفقیت انجام شد");
      // مثلا بعد از موفقیت می‌خواهید برگردید:
      // setTimeout(()=> navigate(`/course/${cid}`), 1200);
    } catch (err: any) {
      showToast(false, err?.response?.data?.message || "خطای ثبت آزمون");
    }
  };

  /* ====== UI ====== */
  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 sm:px-6 lg:px-8 w-full">
      <section className="w-full max-w-7xl mx-auto py-6 lg:py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
            <div className="flex items-center space-x-4 ">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 ml-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white">ایجاد آزمون</h1>
                <p className="text-blue-100 mt-1">سؤال‌ها، زمان‌بندی و ارسال برای تأیید</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 lg:p-8 space-y-8">
            {/* Questions */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">سؤال‌ها</h2>
                <button
                  onClick={addQuestion}
                  className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  <span className="text-xl mr-1">+</span> افزودن سؤال
                </button>
              </div>

              {questions.map((q, qi) => (
                <div key={qi} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                  {/* Question header: reorder + remove (except first) */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium text-gray-800">سؤال {qi + 1}</div>
                    <div className="flex items-center gap-2">
                      <button
                        title="انتقال به بالا"
                        onClick={() => moveQuestionUp(qi)}
                        disabled={qi === 0}
                        className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                          qi === 0
                            ? "text-gray-300 border-gray-200 cursor-not-allowed"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        ▲
                      </button>
                      <button
                        title="انتقال به پایین"
                        onClick={() => moveQuestionDown(qi)}
                        disabled={qi === questions.length - 1}
                        className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                          qi === questions.length - 1
                            ? "text-gray-300 border-gray-200 cursor-not-allowed"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        ▼
                      </button>
                      {qi > 0 && (
                        <button
                          title="حذف سؤال"
                          onClick={() => removeQuestion(qi)}
                          className="w-8 h-8 rounded-full flex items-center justify-center border text-red-600 hover:bg-red-50"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Question text */}
                  <div className="mb-3">
                    <label className="block text-sm text-gray-700 mb-1">صورت سؤال</label>
                    <textarea
                      rows={3}
                      value={q.quest}
                      onChange={(e) => updateQuest(qi, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-3"
                      placeholder="متن سؤال را وارد کنید…"
                    />
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-3">
                        <div className="w-16 text-sm text-gray-600">
                          گزینه {oi + 1}
                        </div>
                        <input
                          value={opt}
                          onChange={(e) => updateOption(qi, oi, e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg p-2"
                          placeholder={`گزینه ${oi + 1}`}
                        />
                        {/* remove icon only for options >= 3 */}
                        {oi >= 2 && (
                          <button
                            onClick={() => removeOption(qi, oi)}
                            className="text-red-600 px-2 py-1 rounded hover:bg-red-50"
                            title="حذف گزینه"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Add option button (max 5) */}
                    <div className="mt-2">
                      <button
                        onClick={() => addOption(qi)}
                        disabled={q.options.length >= 5}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          q.options.length >= 5
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        }`}
                      >
                        افزودن گزینه
                      </button>
                      <span className="text-xs text-gray-500 mr-2">
                        (حداکثر ۵ گزینه)
                      </span>
                    </div>
                  </div>

                  {/* Answer */}
                  <div className="mt-3">
                    <label className="block text-sm text-gray-700 mb-1">
                      شماره گزینه صحیح
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={q.options.length}
                      value={q.ans}
                      onChange={(e) => updateAnswer(qi, Math.max(1, Math.min(q.options.length, +e.target.value || 1)))}
                      className="w-32 border border-gray-300 rounded-lg p-2"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Time window */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Start */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="font-medium text-gray-800 mb-3">زمان شروع آزمون (شمسی)</div>
                <div className="flex gap-2 mb-2">
                  <select className="flex-1 border rounded p-2" value={startJ.d || ""} onChange={(e) => setStartJ(s => ({ ...s, d: +e.target.value || undefined }))}>
                    <option value="">روز</option>
                    {days.filter(d => canUse31(startJ.m) || d <= 30).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select className="flex-1 border rounded p-2" value={startJ.m || ""} onChange={(e) => setStartJ(s => ({ ...s, m: +e.target.value || undefined }))}>
                    <option value="">ماه</option>
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select className="flex-1 border rounded p-2" value={startJ.y || ""} onChange={(e) => setStartJ(s => ({ ...s, y: +e.target.value || undefined }))}>
                    <option value="">سال</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <input className="flex-1 border rounded p-2" placeholder="ساعت (0-23)" type="number"
                         value={startJ.hh ?? ""} onChange={(e) => setStartJ(s => ({ ...s, hh: e.target.value === "" ? undefined : Math.max(0, Math.min(23, +e.target.value)) }))}/>
                  <input className="flex-1 border rounded p-2" placeholder="دقیقه (0-59)" type="number"
                         value={startJ.mm ?? ""} onChange={(e) => setStartJ(s => ({ ...s, mm: e.target.value === "" ? undefined : Math.max(0, Math.min(59, +e.target.value)) }))}/>
                </div>
              </div>

              {/* End */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="font-medium text-gray-800 mb-3">زمان پایان آزمون (شمسی)</div>
                <div className="flex gap-2 mb-2">
                  <select className="flex-1 border rounded p-2" value={endJ.d || ""} onChange={(e) => setEndJ(s => ({ ...s, d: +e.target.value || undefined }))}>
                    <option value="">روز</option>
                    {days.filter(d => canUse31(endJ.m) || d <= 30).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select className="flex-1 border rounded p-2" value={endJ.m || ""} onChange={(e) => setEndJ(s => ({ ...s, m: +e.target.value || undefined }))}>
                    <option value="">ماه</option>
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select className="flex-1 border rounded p-2" value={endJ.y || ""} onChange={(e) => setEndJ(s => ({ ...s, y: +e.target.value || undefined }))}>
                    <option value="">سال</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <input className="flex-1 border rounded p-2" placeholder="ساعت (0-23)" type="number"
                         value={endJ.hh ?? ""} onChange={(e) => setEndJ(s => ({ ...s, hh: e.target.value === "" ? undefined : Math.max(0, Math.min(23, +e.target.value)) }))}/>
                  <input className="flex-1 border rounded p-2" placeholder="دقیقه (0-59)" type="number"
                         value={endJ.mm ?? ""} onChange={(e) => setEndJ(s => ({ ...s, mm: e.target.value === "" ? undefined : Math.max(0, Math.min(59, +e.target.value)) }))}/>
                </div>
              </div>
            </div>

            {/* Duration / MinScore / Message */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm text-gray-700 mb-1">مدت آزمون (دقیقه)</label>
                <input type="number" min={1} value={duration} onChange={(e)=>setDuration(Math.max(1, +e.target.value||1))}
                  className="w-full border rounded-lg p-2"/>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">حداقل نمره قبولی</label>
                <input type="number" min={0} value={minScore} onChange={(e)=>setMinScore(Math.max(0, +e.target.value||0))}
                  className="w-full border rounded-lg p-2"/>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">پیام برای ادمین</label>
                <input value={message} onChange={(e)=>setMessage(e.target.value)}
                  className="w-full border rounded-lg p-2" placeholder="پیامی برای ادمین…"/>
              </div>
            </div>

            {/* Submit */}
            <div className="text-center">
              <button
                onClick={submit}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg"
              >
                ارسال آزمون برای تأیید ادمین
              </button>
            </div>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={`fixed bottom-6 left-6 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${
              toast.ok ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {toast.text}
          </div>
        )}
      </section>
    </section>
  );
};

export default CreateExamPage;
