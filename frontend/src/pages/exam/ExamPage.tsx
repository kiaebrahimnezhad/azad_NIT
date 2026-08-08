import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import UserPanel from "../../components/UserPanel";
import { useQuiz } from "./ExamContext";
import Question from "../../components/Question";
import ShowResult from "./ShowResult";

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

const ExamPage: React.FC = () => {
  const { cid } = useParams<{ cid: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState("information");
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
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

  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("isUserLogin") === "") {
      navigate("../login");
    }
  }, [navigate]);

  // زیباتر: قالب سربرگ و کارت‌ها
  const cardBase =
    "border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-200 bg-white";

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    const mm = m.toString().padStart(2, "0");
    const ss = s.toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const getExam = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("ابتدا وارد شوید");
        return;
      }

      // توجه: مسیر را مطابق بک‌اند خودتان نگه دارید
      const response = await fetch("http://localhost:5000/exam/by-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ cid: Number(cid) }),
      });

      if (!response.ok) {
        setError("خطایی رخ داد");
        throw new Error(`خطای سرور (${response.status})`);
      }

      const resDataJson = await response.json();
      setExams(resDataJson.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطایی رخ داد");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getExam();
  }, [cid]);

  // شروع آزمون: سوالات + تایمر دقیقه‌ای
  const handleStartQuiz = async (exam: Exam) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("ابتدا وارد شوید");
        return;
      }

      setSelectedExam(exam);

      const questionResponse = await fetch(
        "http://localhost:5000/exam/question-by-eid",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({ eid: exam.eid }),
        }
      );

      if (!questionResponse.ok) {
        throw new Error(`خطای سرور (${questionResponse.status})`);
      }

      const questionsData = await questionResponse.json();
      setQuestions(questionsData.questions || []);

      // شروع آزمون
      dispatch({ type: "START_QUIZ" });

      // تایمر را بر اساس دقیقه تنظیم می‌کنیم
      const seconds = Math.max(0, Number(exam.duration) * 60);
      startTimer(seconds);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در دریافت سوالات");
    }
  };

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

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
      const token = localStorage.getItem("token");
      if (!token) {
        setError("ابتدا وارد شوید");
        setIsSubmitting(false);
        return;
      }

      if (!selectedExam) {
        setError("آزمونی انتخاب نشده است");
        setIsSubmitting(false);
        return;
      }

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

      const response = await fetch("http://localhost:5000/exam/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          eid: selectedExam.eid,
          answers: payloadAnswers,
        }),
      });

      const result = await response.json();

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
    } catch (error) {
      console.error("Error submitting exam:", error);
      setToast({
        show: true,
        type: "error",
        message: "خطا در ارسال آزمون",
      });
      setTimeout(() => setToast((t) => ({ ...t, show: false })), 4000);
    } finally {
      clearTimer();
      setIsSubmitting(false);
    }
  };

  return (
    <div className="adminPage flex flex-col w-full">
      {/* Toast */}
      <Toast show={toast.show} type={toast.type} message={toast.message} />

      <section className="grid grid-cols-12 px-6">
        <UserPanel activePanel={activePanel} setActivePanel={setActivePanel} />

        <div className="content-container lg:col-start-4 col-span-12 lg:col-span-9 pt-20 pr-0 lg:pr-10">
          {/* هدر زیباتر */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-8 rounded-t-2xl shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white">
                  انجام تست
                </h1>
                <p className="text-indigo-100 mt-1">
                  {exams.length} آزمون در این دوره
                </p>
              </div>
            </div>
          </div>

          <div className="content-header w-full flex flex-col items-center gap-10 p-6">
            {loading && (
              <div className="text-center py-10">
                <div className="inline-block h-10 w-10 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
                <p className="text-lg mt-3">در حال بارگذاری...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-10 text-red-600">
                <p>{error}</p>
              </div>
            )}

            {!loading && !error && exams.length === 0 && (
              <div className="text-center py-10">
                <p>هیچ آزمونی برای این دوره یافت نشد</p>
              </div>
            )}

            {!loading && !error && exams.length > 0 && (
              <div className="w-full space-y-4">
                {exams.map((exam) => (
                  <div key={exam.eid} className={cardBase}>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold">
                          آزمون #{exam.eid}
                        </h3>
                        <p className="text-sm text-gray-600">
                          تاریخ شروع:{" "}
                          {new Date(exam.start_time).toLocaleDateString(
                            "fa-IR"
                          )}
                        </p>
                        <p className="text-sm text-gray-600">
                          مدت زمان: {exam.duration} دقیقه
                        </p>
                        <p className="text-sm text-gray-600">
                          حداقل نمره قبولی: {exam.min_score}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleStartQuiz(exam)}
                          disabled={!exam.is_valid || isSubmitting}
                          className={`rounded-xl font-bold px-5 py-3 transition-colors ${
                            exam.is_valid
                              ? "bg-amber-400 text-black hover:bg-amber-500"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          {exam.is_valid ? "شروع آزمون" : "غیرفعال"}
                        </button>
                        <Link
                          to="/user/userPage"
                          className="text-indigo-700 hover:text-indigo-900"
                        >
                          بازگشت
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(status === "started" || status === "timerFinished") &&
              selectedExam && (
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
                      آزمون #{selectedExam.eid}
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
                        />
                      </div>
                    ))}
                  </div>

                  {status === "timerFinished" && <ShowResult />}

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
};

export default ExamPage;
