import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The visual style of the button */
  variant?: "primary" | "secondary" | "ghost" | "danger" | "premium" | "outline";
  /** The size of the button */
  size?: "sm" | "md" | "lg" | "xl";
  /** Whether the button is in a loading state */
  isLoading?: boolean;
  /** Icon to display before the text */
  leftIcon?: React.ReactNode;
  /** Icon to display after the text */
  rightIcon?: React.ReactNode;
}

/**
 * Primary action button for Lectio AI.
 * Uses 'purposeful richness' design philosophy.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 rounded-xl font-body font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0A0F] active:scale-95 disabled:pointer-events-none disabled:opacity-50";
    
    const variants = {
      primary: "bg-[#F5A623] text-black hover:bg-[#e8941a] shadow-[0_4px_15px_rgba(245,166,35,0.3)] hover:shadow-[0_0_30px_rgba(245,166,35,0.25)]",
      secondary: "bg-[#FAFAF7]/5 text-white border border-white/10 hover:bg-white/10 hover:border-[#F5A623]",
      ghost: "text-white/70 hover:text-white hover:bg-white/5",
      danger: "bg-[#E84855]/10 text-[#E84855] hover:bg-[#E84855] hover:text-white",
      premium: "bg-gradient-to-r from-[#F5A623] to-[#e8941a] text-black shadow-lg shadow-[#F5A623]/20",
      outline: "border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
    };

    const sizes = {
      sm: "h-9 px-4 text-sm",
      md: "h-11 px-6 text-base",
      lg: "h-14 px-8 text-lg",
      xl: "h-16 px-10 text-xl"
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="animate-spin" size={size === "sm" ? 16 : 20} />
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </button>
    );
  }
);
Button.displayName = "Button";
