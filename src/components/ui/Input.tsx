import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, icon, type = "text", id, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 text-slate-400 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            id={id}
            type={type}
            ref={ref}
            className={`w-full bg-white border rounded-lg py-2 px-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-150
              ${icon ? "pl-11" : ""}
              ${error 
                ? "border-rose-500 focus:ring-rose-200" 
                : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
              } 
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <span className="text-xs text-rose-600 mt-0.5 font-medium flex items-center gap-1">
            <span className="inline-block w-1 h-1 rounded-full bg-rose-600"></span>
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
