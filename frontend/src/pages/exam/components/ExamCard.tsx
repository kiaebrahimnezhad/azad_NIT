export type Exam = {
  eid: number;
  start_time: string;
  end_time: string;
  duration: number; // دقیقه
  min_score: number;
  courseCid: number;
  is_valid: boolean;
};

interface ExamCardProps {
  exam: Exam;
  onStart: () => void;
}

function ExamCard({ exam, onStart }: ExamCardProps) {
  return (
    <div className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-200 bg-white">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">آزمون #{exam.eid}</h3>
          <p className="text-sm text-gray-600">
            تاریخ شروع:{" "}
            {new Date(exam.start_time).toLocaleDateString("fa-IR")}
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
            onClick={onStart}
            disabled={!exam.is_valid}
            className={`rounded-xl font-bold px-5 py-3 transition-colors ${
              exam.is_valid
                ? "bg-amber-400 text-black hover:bg-amber-500"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {exam.is_valid ? "شروع آزمون" : "غیرفعال"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExamCard;
