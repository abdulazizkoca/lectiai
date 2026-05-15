import React, { forwardRef } from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "bordered" | "glass";
  isInteractive?: boolean;
  accentColor?: "saffron" | "lapis" | "jade" | "none";
}

/**
 * Standard Card component for grouping content.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className = "",
      variant = "default",
      isInteractive = false,
      accentColor = "none",
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = "rounded-2xl transition-all duration-300 relative overflow-hidden";
    
    const variants = {
      default: "bg-[#FAFAF7] dark:bg-[#18181F]",
      elevated: "bg-[#F8F6F2] dark:bg-[#1E1E28] shadow-[0_8px_30px_rgba(0,0,0,0.10)]",
      bordered: "bg-transparent border border-black/10 dark:border-white/10",
      glass: "bg-white/5 dark:bg-black/20 backdrop-blur-xl border border-white/10 dark:border-white/5"
    };

    const interactiveStyles = isInteractive 
      ? "hover:-translate-y-1 hover:shadow-lg hover:border-[#F5A623]/30 cursor-pointer" 
      : "";

    const accents = {
      none: "",
      saffron: "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-[#F5A623]",
      lapis: "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-[#1B4FD8]",
      jade: "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-[#0D9373]"
    };

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${interactiveStyles} ${accents[accentColor]} ${className}`}
        {...props}
      >
        <div className="p-6 relative z-10">
          {children}
        </div>
      </div>
    );
  }
);
Card.displayName = "Card";

// Card subcomponents
export const CardHeader = ({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`mb-4 pb-4 border-b border-white/10 ${className}`} {...props} />
);
CardHeader.displayName = "CardHeader";

export const CardTitle = ({ className = "", ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={`text-xl font-bold ${className}`} {...props} />
);
CardTitle.displayName = "CardTitle";

export const CardDescription = ({ className = "", ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={`text-sm text-slate-500 dark:text-slate-400 ${className}`} {...props} />
);
CardDescription.displayName = "CardDescription";

export const CardContent = ({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`space-y-4 ${className}`} {...props} />
);
CardContent.displayName = "CardContent";
