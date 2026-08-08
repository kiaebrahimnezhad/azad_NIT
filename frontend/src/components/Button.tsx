interface ButtonProps {
  children: React.ReactNode;
  handler: () => void;
  divClass: string;
  butClass: string;
  disabled: boolean;
    type?: "button" | "submit" | "reset";

}

const Button = ({ children, handler, divClass, butClass, disabled }: ButtonProps) => {
  return (
    <div className={divClass}>
      <button type="submit" onClick={handler} className={butClass} disabled={disabled}>
        {children}
      </button>
    </div>
  );
};

export default Button;
