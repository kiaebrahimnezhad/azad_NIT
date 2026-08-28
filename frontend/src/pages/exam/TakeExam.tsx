import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuiz } from "./ExamContext";
import Question from "./components/Question";
import { coreApi, isAxiosErrorWithMessage } from "../../lib/api";

type Exam = {
  eid: number;
  start_time: string;
  end_time: string;
  duration: number; // دقیقه
  min_score: number;
  courseCid: number;
  is_valid: boolean;
};

type QuestionType = {
  qid: number;
  examid: number;
  ans: number;
  quest: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  option5: string;
};

/** Toast سبکِ بدون وابستگی */
type ToastType = "info" | "success" | "error";
const toastBg: Record<ToastType, string> = {
  info: "bg-blue-600",
  success: "bg-green-600",
  error: "bg-red-600",
};
const Toast: React.FC<{ show: boolean; type: ToastType; message: string }> = ({
  show,
  type,
  message,
}) => {
  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-300 ${
        show
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-4 pointer-events-none"
      }`}
    >
      <div
        className={`${toastBg[type]} text-white px-5 py-3 rounded-xl shadow-xl`}
      >
        {message}
      </div>
    </div>
  );
};

function TakeExam() {
  const { eid } = useParams<{ eid: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<QuestionType[]>([]);

  const { state, dispatch } = useQuiz();
  const { status, answers } = state;

  // --- تایمر بر حسب ثانیه (duration دقیقه × 60)
  const [timeLeftSec, setTimeLeftSec] = useState<number>(0);
  const timerRef = useRef<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Toast state
  const [toast, setToast] = useState<{
    show: boolean;
    type: ToastType;
    message: string;
  }>({
    show: false,
    type: "info",
    message: "",
  });

  const cardBase =
    "border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-200 bg-white";

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    const mm = m.toString().padStart(2, "0");
    const ss = s.toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // پاک کردن تایمر موقع خروج از صفحه (ناوبری/بستن)، تا تایمر در پس‌زمینه باقی نماند
  useEffect(() => {
    return () => clearTimer();
  }, []);

  const startTimer = (seconds: number) => {
    clearTimer();
    setTimeLeftSec(seconds);
    timerRef.current = window.setInterval(() => {
      setTimeLeftSec((prev) => {
        if (prev <= 1) {
          clearTimer();
          // اتمام زمان → ارسال خودکار
          if (!isSubmitting) {
            handleSubmitExam(); // Toast آبی نمایش داده می‌شود داخل تابع
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmitExam = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // آماده‌سازی پاسخ‌ها
      const payloadAnswers = Object.entries(answers).map(([qid, ans]) => ({
        qid: parseInt(qid, 10),
        ans: ans,
      }));

      if (payloadAnswers.length === 0) {
        setError("هیچ پاسخی ثبت نشده است");
        setIsSubmitting(false);
        return;
      }

      // Toast آبیِ «ارسال شد…»
      setToast({
        show: true,
        type: "info",
        message: "پاسخ شما ارسال شد. لطفاً منتظر نتیجه بمانید.",
      });

      const { data: result } = await coreApi.post("/exam/submit", {
        eid: Number(eid),
        answers: payloadAnswers,
      });

      // پایان آزمون در state
      dispatch({ type: "FINISH_QUIZ" });

      // Toast آبی رو ببند و نتیجه رو نمایش بده
      setToast((t) => ({ ...t, show: false }));
      setTimeout(() => {
        setToast({
          show: true,
          type: result.passed ? "success" : "error",
          message:
            result.message || (result.passed ? "قبول شدید" : "قبول نشدید"),
        });
        // بستن خودکار Toast نتیجه بعد از چند ثانیه
        setTimeout(() => {
          setToast((t) => ({ ...t, show: false }));
          navigate("/user/userPage/");
        }, 4500);
      }, 250);
    } catch (err) {
      console.error("Error submitting exam:", err);
      const message =
        isAxiosErrorWithMessage(err) && err.response?.data?.message
          ? err.response.data.message
          : "خطا در ارسال آزمون";
      setToast({
        show: true,
        type: "error",
        message,
      });
      setTimeout(() => setToast((t) => ({ ...t, show: false })), 4000);
    } finally {
      clearTimer();
      setIsSubmitting(false);
    }
  };

  // بارگذاری اطلاعات آزمون + سؤالات، مستقل و فقط بر اساس :eid موجود در URL
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [examRes, questionsRes] = await Promise.all([
          coreApi.post("/exam/by-eid", { eid: Number(eid) }),
          coreApi.post("/exam/question-by-eid", { eid: Number(eid) }),
        ]);

        const loadedExam: Exam = examRes.data.data;
        setExam(loadedExam);
        setQuestions(questionsRes.data.questions || []);

        // شروع آزمون
        dispatch({ type: "START_QUIZ" });

        // تایمر را بر اساس دقیقه تنظیم می‌کنیم
        const seconds = Math.max(0, Number(loadedExam.duration) * 60);
        startTimer(seconds);
      } catch (err) {
        const message =
          isAxiosErrorWithMessage(err) && err.response?.data?.message
            ? err.response.data.message
            : "خطا در دریافت آزمون";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [eid]);

  return (
    <div className="adminPage flex flex-col w-full">
      {/* Toast */}
      <Toast show={toast.show} type={toast.type} message={toast.message} />
      <section className="grid grid-cols-12 px-6">
        <div className="content-container col-span-12 pt-20 pr-0 lg:pr-10">
          <div className="content-header w-full flex flex-col items-center gap-10 p-6">
            {loading && (
              <div className="text-center py-10">
                <div className="inline-block h-10 w-10 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
                <p className="text-lg mt-3">در حال بارگذاری...</p>
              </div>
            )}

            {!loading && error && (
              <div className="text-center py-10 text-red-600">
                <p>{error}</p>
              </div>
            )}

            {!loading && !error && exam && status === "started" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmitExam();
                }}
                className={`${cardBase} w-full`}
              >
                {/* نوار بالایی با تایمر شیک */}
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    آزمون #{exam.eid}
                  </h3>
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-white ${
                      timeLeftSec <= 30 ? "bg-red-600" : "bg-indigo-600"
                    }`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-bold">
                      {formatTime(timeLeftSec)}
                    </span>
                  </div>
                </div>

                <div className="flex w-full flex-col space-y-4 py-2">
                  {questions.map((q) => (
                    <div key={q.qid} className="border-t pt-4">
                      <Question
                        examquestion={q}
                        onSelectOption={(questionId, optionValue) => {
                          dispatch({
                            type: "SELECTED_OPTION",
                            payload: { questionId, optionValue },
                          });
                        }}
                        selectedOption={answers[q.qid]}
                        disabled={isSubmitting}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end mt-5">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl font-bold bg-amber-400 hover:bg-amber-500 px-4 py-2 disabled:opacity-60"
                  >
                    {isSubmitting ? "در حال ارسال..." : "ارسال"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default TakeExam;
