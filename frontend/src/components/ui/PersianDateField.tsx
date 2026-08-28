import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

interface PersianDateFieldProps {
  label: string;
  divClass?: string;
  value: DateObject | null;
  onChange: (value: DateObject | null) => void;
}

function PersianDateField({ label, value, divClass, onChange }: PersianDateFieldProps) {
  return (
    <div className={divClass}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <DatePicker
        calendar={persian}
        locale={persian_fa}
        value={value}
        onChange={(v) => onChange(v as DateObject | null)}
        calendarPosition="bottom-right"
        inputClass="w-full border rounded-lg p-2.5"
        containerClassName="w-full"
      />
    </div>
  );
}

export default PersianDateField;
