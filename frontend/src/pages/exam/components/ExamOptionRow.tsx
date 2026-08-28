import Input from "../../../components/ui/Input";

interface ExamOptionRowProps {
  questionIndex: number;
  optionIndex: number;
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
}

function ExamOptionRow({
  questionIndex,
  optionIndex,
  value,
  onChange,
  onRemove,
}: ExamOptionRowProps) {
  const removable = optionIndex >= 2; // گزینه‌های 1 و 2 حذف‌پذیر نیستند

  return (
    <div className="flex items-end gap-3">
      <Input
        name={`question-${questionIndex}-option-${optionIndex}`}
        label={`گزینه ${optionIndex + 1}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        divClass="flex-1"
        inpClass="w-full border border-gray-300 rounded-lg p-2 mt-2"
        placeholder={` عنوان گزینه ${optionIndex + 1} را بنویسید.`}
        required={optionIndex < 2}
      />
      {removable && (
        <button
          onClick={onRemove}
          className="text-red-600 px-2 py-1 rounded hover:bg-red-50"
          title="حذف گزینه"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default ExamOptionRow;
