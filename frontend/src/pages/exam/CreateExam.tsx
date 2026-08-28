// src/pages/CreateExamPage.tsx
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { DateObject } from "react-multi-date-picker";

import PersianDateField from "../../components/ui/PersianDateField";
import Input from "../../components/ui/Input";
import ExamQuestionCard, { type ExamQuestion } from "./components/ExamQuestionCard";
import { coreApi, isAxiosErrorWithMessage } from "../../lib/api";

/* ====== Helpers ====== */
// مقدار خروجی <input type="time"> رشته‌ی "HH:MM" است.
const parseTimeString = (t: string): { hh: number; mm: number } | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return { hh, mm };
};

// ترکیب تاریخ شمسیِ انتخاب‌شده (که DateObject.toDate() همیشه معادل میلادیِ درست را برمی‌گرداند)
// با ساعت/دقیقه‌ی محلی وارد شده، بدون اجبار به UTC.
const toIsoFromDateAndTime = (d: DateObject | null, time: string): string | null => {
  if (!d) return null;
  const parsed = parseTimeString(time);
  if (!parsed) return null;
  const nd = d.toDate();
  const combined = new Date(nd.getFullYear(), nd.getMonth(), nd.getDate(), parsed.hh, parsed.mm, 0);
  return isNaN(combined.getTime()) ? null : combined.toISOString();
};

/* ====== Component ====== */
const CreateExamPage: React.FC = () => {
  const { cid } = useParams<{ cid: string }>();

  const [questions, setQuestions] = useState<ExamQuestion[]>([
    { quest: "", options: ["", ""], ans: 1 },
  ]);

  const [startDate, setStartDate] = useState<DateObject | null>(null);
  const [startTime, setStartTime] = useState<string>("");
  const [endDate, setEndDate] = useState<DateObject | null>(null);
  const [endTime, setEndTime] = useState<string>("");

  const [duration, setDuration] = useState<number>(60);
  const [minScore, setMinScore] = useState<number>(10);
  const [message, setMessage] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const showToast = (ok: boolean, text: string) => {
    setToast({ ok, text });
    setTimeout(() => setToast(null), 2000);
  };

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
    setQuestions((qs) => qs.map((q, i) => (i === qi ? { ...q, quest: val } : q)));
  };

  const updateOption = (qi: number, oi: number, val: string) => {
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qi) return q;
        const options = [...q.options];
        options[oi] = val;
        return { ...q, options };
      })
    );
  };

  const addOption = (qi: number) => {
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qi || q.options.length >= 5) return q;
        return { ...q, options: [...q.options, ""] };
      })
    );
  };

  const removeOption = (qi: number, oi: number) => {
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qi) return q;
        if (oi < 2) return q; // گزینه‌های 1 و 2 حذف‌پذیر نیستند
        const removedIndex1Based = oi + 1;
        const options = [...q.options];
        options.splice(oi, 1);
        // تنظیمِ ans اگر به گزینه حذف‌شده اشاره می‌کرد یا بعد از آن بود (باید یکی کم شود)
        let ans = q.ans;
        if (ans === removedIndex1Based) ans = 1;
        else if (ans > removedIndex1Based) ans -= 1;
        return { ...q, options, ans };
      })
    );
  };

  const updateAnswer = (qi: number, ans: number) => {
    setQuestions((qs) => qs.map((q, i) => (i === qi ? { ...q, ans } : q)));
  };

  /* ====== Submit ====== */
  const validate = () => {
    if (!cid) return "شناسه دوره معتبر نیست";
    if (!duration || duration <= 0) return "مدت آزمون را درست وارد کنید";

    // تاریخ/ساعت
    const sIso = toIsoFromDateAndTime(startDate, startTime);
    const eIso = toIsoFromDateAndTime(endDate, endTime);
    if (!sIso || !eIso) return "تاریخ/ساعت شروع و پایان را کامل وارد کنید";

    const startMs = new Date(sIso).getTime();
    const endMs = new Date(eIso).getTime();
    if (startMs >= endMs) return "پایان آزمون باید بعد از شروع باشد";

    const now = new Date();
    if (startMs <= now.getTime()) return "زمان شروع آزمون باید بعد از زمان فعلی باشد";

    const windowMinutes = (endMs - startMs) / 60000;
    if (duration > windowMinutes)
      return `مدت آزمون (${duration} دقیقه) نمی‌تواند از بازه‌ی شروع تا پایان (${Math.floor(
        windowMinutes
      )} دقیقه) بیشتر باشد`;

    // سوالات
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.quest.trim()) return `صورت سؤال ${i + 1} را وارد کنید`;
      if (!q.options[0].trim() || !q.options[1].trim())
        return `گزینه‌های ۱ و ۲ سؤال ${i + 1} الزامی هستند`;
      if (q.ans < 1 || q.ans > q.options.length)
        return `گزینه صحیح سؤال ${i + 1} نامعتبر است`;
    }
    return null;
  };

  const submit = async () => {
    const v = validate();
    if (v) return showToast(false, v);

    const sIso = toIsoFromDateAndTime(startDate, startTime)!;
    const eIso = toIsoFromDateAndTime(endDate, endTime)!;

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
      setSubmitting(true);
      const { data } = await coreApi.post("/exam", {
        cid: Number(cid),
        min_score: minScore,
        start_time: sIso,
        end_time: eIso,
        duration,
        message,
        questions: qsPayload,
      });
      showToast(true, data?.message || "ثبت آزمون با موفقیت انجام شد");
    } catch (err) {
      const message =
        isAxiosErrorWithMessage(err) && err.response?.data?.message
          ? err.response.data.message
          : "خطای ثبت آزمون";
      showToast(false, message);
    } finally {
      setSubmitting(false);
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

              {/* هر سوال حاوی چندین گزینه - حلقه سوالات */}
              {questions.map((q, qi) => (
                <ExamQuestionCard
                  key={qi}
                  question={q}
                  index={qi}
                  isFirst={qi === 0}
                  isLast={qi === questions.length - 1}
                  onMoveUp={() => moveQuestionUp(qi)}
                  onMoveDown={() => moveQuestionDown(qi)}
                  onRemove={() => removeQuestion(qi)}
                  onQuestChange={(val) => updateQuest(qi, val)}
                  onOptionChange={(oi, val) => updateOption(qi, oi, val)}
                  onOptionAdd={() => addOption(qi)}
                  onOptionRemove={(oi) => removeOption(qi, oi)}
                  onAnswerChange={(ans) => updateAnswer(qi, ans)}
                />
              ))}
            </div>

            {/* Time window */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Start */}
              <div className="border border-gray-200 rounded-xl p-4 grid">
                <p className="font-medium text-gray-800 mb-3">زمان شروع آزمون (شمسی)</p>
                <PersianDateField label="تاریخ شروع" value={startDate} onChange={setStartDate} />
                <Input
                  name="start-time"
                  type="time"
                  label="ساعت شروع"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  divClass="mt-4"
                  inpClass="w-full border rounded p-2 mt-2"
                />
              </div>

              {/* End */}
              <div className="border border-gray-200 rounded-xl p-4">
                <p className="font-medium text-gray-800 mb-3">زمان پایان آزمون (شمسی)</p>
                <PersianDateField label="تاریخ پایان" value={endDate} onChange={setEndDate} />
                <Input
                  name="end-time"
                  type="time"
                  label="ساعت پایان"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  divClass="mt-4"
                  inpClass="w-full border rounded p-2 mt-2"
                />
              </div>
            </div>

            {/* Duration / MinScore / Message */}
            <div className="grid lg:grid-cols-3 gap-6">
              <Input
                name="duration"
                type="number"
                label="مدت آزمون (دقیقه)"
                min={1}
                value={duration}
                onChange={(e) => setDuration(Math.max(1, +e.target.value || 1))}
                inpClass="w-full border rounded-lg p-2 mt-2"
              />
              <Input
                name="min-score"
                type="number"
                label="حداقل نمره قبولی"
                min={0}
                value={minScore}
                onChange={(e) => setMinScore(Math.max(0, +e.target.value || 0))}
                inpClass="w-full border rounded-lg p-2 mt-2"
              />
              <Input
                name="admin-message"
                label="پیام برای ادمین"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                inpClass="w-full border rounded-lg p-2 mt-2"
                placeholder="پیامی برای ادمین…"
              />
            </div>

            {/* Submit */}
            <div className="text-center">
              <button
                onClick={submit}
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg disabled:opacity-50"
              >
                {submitting ? "در حال ارسال..." : "ارسال آزمون برای تأیید ادمین"}
              </button>
            </div>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={`fixed bottom-6 left-6 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${toast.ok ? "bg-green-600" : "bg-red-600"
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
