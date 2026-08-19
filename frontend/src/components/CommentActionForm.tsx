interface CommentActionFormProps {
  variant: "comment" | "report";
  title: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  placeholder: string;
  rows?: number;
  onCancel?: () => void;
}

// تعریف استایل‌ها برای هر نوع فرم
const VARIANT_STYLES: Record<CommentActionFormProps["variant"], { ring: string; button: string }> = {
  comment: { ring: "focus:ring-blue-500", button: "bg-blue-600 hover:bg-blue-700" },
  report: { ring: "focus:ring-red-400", button: "bg-red-500 hover:bg-red-600" },
};

function CommentActionForm({
  variant,
  title,
  value,
  onChange,
  onSubmit,
  submitting,
  submitLabel,
  submittingLabel,
  placeholder,
  rows = 4,
  onCancel,
}: CommentActionFormProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div className="mt-10">
      <h3 className="font-bold mb-2">{title}</h3>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={`w-full border rounded-lg p-3 focus:ring-2 ${styles.ring}`}
        placeholder={placeholder}
      />
      <div className="flex items-center gap-3 mt-3">
        <button
          type="button"
          className={`${styles.button} text-white py-2 px-6 rounded-lg disabled:opacity-50`}
          disabled={submitting || !value.trim()}
          onClick={onSubmit}
        >
          {submitting ? submittingLabel : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="text-sm text-gray-600 hover:underline" onClick={onCancel}>
            لغو
          </button>
        )}
      </div>
    </div>
  );
}

export default CommentActionForm;