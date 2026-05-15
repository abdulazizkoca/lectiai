import React, { forwardRef, useState } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  inputSize?: "sm" | "md" | "lg";
}

/**
 * Animated Input field with floating label and validation states.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = "",
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      inputSize = "md",
      disabled,
      value,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value !== undefined && value !== "";
    
    const sizes = {
      sm: "h-10 text-sm",
      md: "h-12 text-base",
      lg: "h-14 text-lg"
    };

    let borderColor = "border-black/10 dark:border-white/10";
    if (error) borderColor = "border-[#E84855]";
    else if (isFocused) borderColor = "border-[#F5A623] shadow-[0_0_0_3px_rgba(245,166,35,0.15)]";

    return (
      <div className={`relative w-full ${className}`}>
        <div className={`relative flex items-center bg-[#FAFAF7] dark:bg-[#18181F] rounded-xl border ${borderColor} transition-all duration-300 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {leftIcon && <div className="pl-4 text-slate-400">{leftIcon}</div>}
          
          <div className="relative flex-1">
            <input
              ref={ref}
              disabled={disabled}
              value={value}
              onFocus={(e) => { setIsFocused(true); props.onFocus?.(e); }}
              onBlur={(e) => { setIsFocused(false); props.onBlur?.(e); }}
              className={`w-full bg-transparent px-4 pt-4 pb-1 outline-none text-black dark:text-white font-body peer ${sizes[inputSize]}`}
              placeholder=" "
              {...props}
            />
            {label && (
              <label className={`absolute left-4 transition-all duration-200 pointer-events-none text-slate-400
                ${(isFocused || hasValue) ? 'text-xs top-1 -translate-y-0 text-[#F5A623]' : 'text-base top-1/2 -translate-y-1/2'}
              `}>
                {label}
              </label>
            )}
          </div>
          
          {rightIcon && <div className="pr-4 text-slate-400">{rightIcon}</div>}
        </div>
        
        {(helperText || error) && (
          <p className={`mt-1.5 text-xs ${error ? 'text-[#E84855]' : 'text-slate-500'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
