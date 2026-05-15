import React from "react";

export default function GlobalLoading() {
  return (
    <div className="min-h-[100dvh] bg-[#FAFAF7] dark:bg-[#0A0A0F] flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#F5A623] to-[#e8941a] animate-pulse shadow-[0_0_30px_rgba(245,166,35,0.4)]" />
          <div className="absolute inset-1 rounded-xl bg-[#0A0A0F] flex items-center justify-center">
            <span className="font-display font-bold text-3xl text-white">L</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white">Lectio AI</h3>
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#1B4FD8] animate-[bounce_1s_infinite_0ms]" />
            <div className="w-2 h-2 rounded-full bg-[#0D9373] animate-[bounce_1s_infinite_200ms]" />
            <div className="w-2 h-2 rounded-full bg-[#F5A623] animate-[bounce_1s_infinite_400ms]" />
          </div>
        </div>
      </div>
    </div>
  );
}
