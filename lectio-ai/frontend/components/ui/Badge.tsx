import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: "saffron" | "lapis" | "jade" | "coral" | "amethyst" | "gray";
  variant?: "solid" | "subtle" | "outline";
  size?: "sm" | "md";
  dot?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = "", color = "saffron", variant = "subtle", size = "md", dot = false, children, ...props }, ref) => {
    
    const sizes = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-2.5 py-1 text-sm"
    };

    const colors = {
      solid: {
        saffron: "bg-[#F5A623] text-black",
        lapis: "bg-[#1B4FD8] text-white",
        jade: "bg-[#0D9373] text-white",
        coral: "bg-[#E84855] text-white",
        amethyst: "bg-[#7B2FBE] text-white",
        gray: "bg-slate-500 text-white"
      },
      subtle: {
        saffron: "bg-[#F5A623]/10 text-[#F5A623] dark:bg-[#F5A623]/20",
        lapis: "bg-[#1B4FD8]/10 text-[#1B4FD8] dark:bg-[#1B4FD8]/20",
        jade: "bg-[#0D9373]/10 text-[#0D9373] dark:bg-[#0D9373]/20",
        coral: "bg-[#E84855]/10 text-[#E84855] dark:bg-[#E84855]/20",
        amethyst: "bg-[#7B2FBE]/10 text-[#7B2FBE] dark:bg-[#7B2FBE]/20",
        gray: "bg-slate-500/10 text-slate-600 dark:text-slate-300 dark:bg-slate-500/20"
      },
      outline: {
        saffron: "border border-[#F5A623]/50 text-[#F5A623]",
        lapis: "border border-[#1B4FD8]/50 text-[#1B4FD8]",
        jade: "border border-[#0D9373]/50 text-[#0D9373]",
        coral: "border border-[#E84855]/50 text-[#E84855]",
        amethyst: "border border-[#7B2FBE]/50 text-[#7B2FBE]",
        gray: "border border-slate-500/50 text-slate-600 dark:text-slate-300"
      }
    };

    const dotColors = {
      saffron: "bg-black dark:bg-white",
      lapis: "bg-[#1B4FD8]",
      jade: "bg-[#0D9373]",
      coral: "bg-[#E84855]",
      amethyst: "bg-[#7B2FBE]",
      gray: "bg-slate-500"
    };

    return (
      <span
        ref={ref}
        className={`inline-flex items-center gap-1.5 rounded-full font-bold font-body ${sizes[size]} ${colors[variant][color]} ${className}`}
        {...props}
      >
        {dot && <span className={`w-1.5 h-1.5 rounded-full ${variant === 'solid' ? dotColors.saffron : dotColors[color]}`} />}
        {children}
      </span>
    );
  }
);
Badge.displayName = "Badge";
