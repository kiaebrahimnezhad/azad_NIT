import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { coreApi, isAxiosErrorWithMessage } from "../../lib/api";
import Header from "../../components/common/Header";
import LoadingInformaition from "../../components/ui/LoadingInformaition";
import ExamCard, { type Exam } from "./components/ExamCard";

function ExamPage(){
  const { cid } = useParams<{ cid: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);

  const getExam = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await coreApi.post("/exam/by-course", { cid: Number(cid) });
      setExams(response.data.data || []);
    } catch (err) {
      const message =
        isAxiosErrorWithMessage(err) && err.response?.data?.message
          ? err.response.data.message
          : "خطایی رخ داد";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getExam();
  }, [cid]);

  return (
    <div className="adminPage flex flex-col w-full">
      <Header />
      <section className="grid grid-cols-12 px-6">
        <div className="content-container col-span-12 pt-20 pr-0 lg:pr-10">
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
              <LoadingInformaition />
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
              {
                exams.map(
                  (exam) => (
                    <ExamCard
                      key={exam.eid}
                      exam={exam}
                      onStart={() => navigate(`/exam/takeExam/${exam.eid}`)}
                    />
                  )
                )
              }
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ExamPage;
