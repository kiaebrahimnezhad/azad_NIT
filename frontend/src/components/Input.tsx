import { forwardRef, useId, type ChangeEvent, type KeyboardEvent } from "react";

type InputType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "tel"
  | "date"
  | "time"
  | "file"
  | "search"
  | "url";

interface InputProps {
  name: string;
  type?: InputType;
  id?: string;
  label: string;
  placeholder?: string;
  description?: string;
  error?: string;
  value?: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  divClass?: string;
  inpClass?: string;
  disabled?: boolean;
  required?: boolean;
  accept?: string;
  autoComplete?: string;
  maxLength?: number;
  min?: number | string;
  max?: number | string;
  pattern?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    name,
    type = "text",
    id,
    label,
    placeholder,
    description,
    error,
    value,
    onChange,
    onBlur,
    onKeyDown,
    divClass = "",
    inpClass = "",
    disabled = false,
    required = false,
    accept,
    autoComplete,
    maxLength,
    min,
    max,
    pattern,
  },
  ref
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = error || description ? `${inputId}-hint` : undefined;

  return (
    <div className={divClass}>
      <label htmlFor={inputId}>{label}</label>
      <input
        ref={ref}
        name={name}
        type={type}
        id={inputId}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        disabled={disabled}
        required={required}
        accept={accept}
        autoComplete={autoComplete}
        maxLength={maxLength}
        min={min}
        max={max}
        pattern={pattern}
        aria-invalid={!!error}
        aria-describedby={hintId}
        className={
          (error
            ? "border-red-500 text-red-600 "
            : "invalid:border-pink-500 invalid:text-pink-600 ") + inpClass
        }
      />
      {(error || description) && (
        <p id={hintId} className={error ? "font-light text-red-600" : "font-light"}>
          {error || description}
        </p>
      )}
    </div>
  );
});

export default Input;