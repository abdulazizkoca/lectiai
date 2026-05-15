import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "heading" | "avatar" | "card" | "row";
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className = "", variant = "text", ...props }, ref) => {
    
    const baseClass = "bg-slate-200 dark:bg-slate-800 relative overflow-hidden animate-pulse";
    
    // Shimmer effect overlay
    const Shimmer = () => (
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent" />
    );

    if (variant === "avatar") {
      return (
        <div ref={ref} className={`${baseClass} rounded-full w-10 h-10 ${className}`} {...props}>
          <Shimmer />
        </div>
      );
    }

    if (variant === "card") {
      return (
        <div ref={ref} className={`${baseClass} rounded-2xl w-full h-48 ${className}`} {...props}>
          <Shimmer />
        </div>
      );
    }
    
    if (variant === "heading") {
      return (
        <div ref={ref} className={`${baseClass} rounded-lg w-1/2 h-8 ${className}`} {...props}>
          <Shimmer />
        </div>
      );
    }

    // Default text line
    return (
      <div ref={ref} className={`${baseClass} rounded-md w-full h-4 ${className}`} {...props}>
        <Shimmer />
      </div>
    );
  }
);
Skeleton.displayName = "Skeleton";
