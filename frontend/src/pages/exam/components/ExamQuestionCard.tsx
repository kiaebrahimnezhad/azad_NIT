import Input from "../../../components/ui/Input";
import ExamOptionRow from "./ExamOptionRow";

export type ExamQuestion = { quest: string; options: string[]; ans: number };

interface ExamQuestionCardProps {
  question: ExamQuestion;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onQuestChange: (value: string) => void;
  onOptionChange: (optionIndex: number, value: string) => void;
  onOptionAdd: () => void;
  onOptionRemove: (optionIndex: number) => void;
  onAnswerChange: (ans: number) => void;
}

function ExamQuestionCard({
  question,
  index,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
  onQuestChange,
  onOptionChange,
  onOptionAdd,
  onOptionRemove,
  onAnswerChange,
}: ExamQuestionCardProps) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
      {/* Question header: reorder + remove (except first) */}
      <div className="flex items-center justify-between mb-3">
        <div className="font-medium text-gray-800">سؤال {index + 1}</div>
        <div className="flex items-center gap-2">
          <button
            title="انتقال به بالا"
            onClick={onMoveUp}
            disabled={isFirst}
            className={`w-8 h-8 rounded-full flex items-center justify-center border ${
              isFirst
                ? "text-gray-300 border-gray-200 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            ▲
          </button>
          <button
            title="انتقال به پایین"
            onClick={onMoveDown}
            disabled={isLast}
            className={`w-8 h-8 rounded-full flex items-center justify-center border ${
              isLast
                ? "text-gray-300 border-gray-200 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            ▼
          </button>
          {!isFirst && (
            <button
              title="حذف سؤال"
              onClick={onRemove}
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
          value={question.quest}
          onChange={(e) => onQuestChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 mt-2"
          placeholder="متن سؤال را وارد کنید…"
        />
      </div>

      {/* Options */}
      <div className="space-y-2">
        {question.options.map((opt, oi) => (
          <ExamOptionRow
            key={oi}
            questionIndex={index}
            optionIndex={oi}
            value={opt}
            onChange={(val) => onOptionChange(oi, val)}
            onRemove={() => onOptionRemove(oi)}
          />
        ))}

        {/* Add option button (max 5) */}
        <div className="mt-5">
          <button
            onClick={onOptionAdd}
            disabled={question.options.length >= 5}
            className={`px-3.5 py-2 rounded-lg text-sm ${
              question.options.length >= 5
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
            }`}
          >
            +
          </button>
          <span className="text-xs text-gray-500 mr-2 ">
            ( توجه! سوال‌ها حداقل ۲ و حداکثر ۵ گزینه)
          </span>
        </div>
      </div>

      {/* Answer */}
      <div className="mt-3">
        <Input
          name={`question-${index}-ans`}
          type="number"
          label="شماره گزینه صحیح"
          min={1}
          max={question.options.length}
          value={question.ans}
          onChange={(e) =>
            onAnswerChange(
              Math.max(1, Math.min(question.options.length, +e.target.value || 1))
            )
          }
          divClass="w-32"
          inpClass="w-32 border border-gray-300 rounded-lg p-2 mt-2"
        />
      </div>
    </div>
  );
}

export default ExamQuestionCard;
