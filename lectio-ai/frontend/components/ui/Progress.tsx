import React from "react";
import { motion } from "framer-motion";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  variant?: "linear" | "circular" | "striped";
  color?: "saffron" | "lapis" | "jade" | "coral" | "gradient";
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className = "", value, variant = "linear", color = "saffron", showLabel = false, size = "md", ...props }, ref) => {
    
    const safeValue = Math.min(100, Math.max(0, value));
    
    const colors = {
      saffron: "bg-[#F5A623]",
      lapis: "bg-[#1B4FD8]",
      jade: "bg-[#0D9373]",
      coral: "bg-[#E84855]",
      gradient: "bg-gradient-to-r from-[#F5A623] to-[#0D9373]"
    };

    const heights = {
      sm: "h-1.5",
      md: "h-2.5",
      lg: "h-4"
    };

    if (variant === "circular") {
      const radius = 40;
      const circumference = 2 * Math.PI * radius;
      return (
        <div className={`relative inline-flex items-center justify-center ${className}`} ref={ref} {...props}>
          <svg viewBox="0 0 100 100" className="w-16 h-16 -rotate-90">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-800" />
            <motion.circle 
              cx="50" cy="50" r={radius} fill="none" 
              stroke="currentColor" strokeWidth="8" strokeLinecap="round"
              className={colors[color].replace("bg-", "text-").split(" ")[0]}
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: circumference * (1 - safeValue / 100) }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </svg>
          {showLabel && <span className="absolute text-xs font-bold font-mono">{Math.round(safeValue)}%</span>}
        </div>
      );
    }

    return (
      <div className={`w-full ${className}`} ref={ref} {...props}>
        {showLabel && (
          <div className="flex justify-end mb-1">
            <span className="text-xs font-bold text-slate-400 font-mono">{Math.round(safeValue)}%</span>
          </div>
        )}
        <div className={`w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden ${heights[size]}`}>
          <motion.div 
            className={`h-full rounded-full ${colors[color]} ${variant === 'striped' ? 'bg-[length:1rem_1rem] bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] animate-[shimmer_1s_linear_infinite]' : ''}`}
            initial={{ width: 0 }}
            animate={{ width: `${safeValue}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    );
  }
);
Progress.displayName = "Progress";
