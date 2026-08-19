import React, { ChangeEvent } from "react";

export interface SelectOptionsProps {
  id: string;
  name: string;
  label: string;
  options: string[];
  description: string;
  divClass?: string;
  selClass?: string;
  /** ← این‌جا onChange به جای onBlur */
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
}

const SelectOptions: React.FC<SelectOptionsProps> = ({
  id,
  name,
  label,
  options,
  description,
  divClass = "",
  selClass = "",
  onChange,
}) => (
  <div className={divClass}>
    <label htmlFor={id} className="block">{label}</label>
    <select
      id={id}
      name={name}
      className={`block ${selClass}`}
      onChange={onChange}
    >
      <option value="" disabled>
         انتخاب
      </option>
      {options.map((opt, idx) => (
        <option key={idx} value={opt}>
          {opt}
        </option>
      ))}
    </select>
    <p className="font-light">{description}</p>
  </div>
);

export default SelectOptions;
