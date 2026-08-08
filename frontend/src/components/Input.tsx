import React, { ChangeEvent } from 'react';

interface InputProps {
  name: string;
  type: string;
  id: string;
  label: string;
  pHolder: string;
  description: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  divClass: string;
  inpClass: string;
  disabled: boolean;
  required?: boolean;
  accept?: string;

}

const Input = ({
  name,
  type,
  id,
  label,
  pHolder,
  description,
  onChange,
  divClass,
  inpClass,
  disabled,
  required
}: InputProps) => {
  return (
    <div className={divClass}>
      <label htmlFor={id}>{label}</label>
      <input
        name={name}
        type={type}
        id={id}
        placeholder={pHolder}
        onChange={onChange}
        className={'invalid:border-pink-500 invalid:text-pink-600 ' + inpClass}
        disabled={disabled}
        required={required}
      />
      <p className="font-light">{description}</p>
    </div>
  );
};

export default Input;
