import React from "react";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  initials?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "away";
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className = "", src, initials, size = "md", status, ...props }, ref) => {
    
    const sizes = {
      xs: "w-6 h-6 text-xs",
      sm: "w-8 h-8 text-sm",
      md: "w-10 h-10 text-base",
      lg: "w-14 h-14 text-xl",
      xl: "w-20 h-20 text-2xl"
    };

    const statusSizes = {
      xs: "w-1.5 h-1.5",
      sm: "w-2 h-2",
      md: "w-2.5 h-2.5",
      lg: "w-3 h-3 border-2",
      xl: "w-4 h-4 border-2"
    };

    const statusColors = {
      online: "bg-[#0D9373]",
      offline: "bg-slate-400",
      away: "bg-[#F5A623]"
    };

    return (
      <div className={`relative inline-block ${sizes[size]} ${className}`} ref={ref} {...props}>
        <div className="w-full h-full rounded-full bg-slate-100 dark:bg-[#18181F] border border-black/10 dark:border-white/10 flex items-center justify-center overflow-hidden font-bold text-[#F5A623]">
          {src ? (
            <img src={src} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            initials || "?"
          )}
        </div>
        
        {status && (
          <span className={`absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-[#0A0A0F] ${statusSizes[size]} ${statusColors[status]}`} />
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

export const AvatarGroup = ({ children, max = 3, total }: { children: React.ReactNode, max?: number, total?: number }) => {
  const avatars = React.Children.toArray(children);
  const visibleAvatars = avatars.slice(0, max);
  const remaining = total ? total - max : avatars.length - max;

  return (
    <div className="flex items-center -space-x-3">
      {visibleAvatars.map((avatar, i) => (
        <div key={i} className="relative z-10 border-2 border-white dark:border-[#0A0A0F] rounded-full">
          {avatar}
        </div>
      ))}
      {remaining > 0 && (
        <div className="relative z-0 border-2 border-white dark:border-[#0A0A0F] rounded-full flex items-center justify-center bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 w-10 h-10">
          +{remaining}
        </div>
      )}
    </div>
  );
};
