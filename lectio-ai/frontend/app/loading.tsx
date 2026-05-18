import React from "react";
import Logo from "@/components/Logo";

export default function GlobalLoading() {
  return (
    <div className="min-h-[100dvh] bg-[#0A0A0F] flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6">
        {/* Animated Logo */}
        <div className="relative">
          {/* Pulsing glow ring */}
          <div
            className="absolute inset-0 rounded-[26px] animate-ping"
            style={{
              background: "rgba(245,166,35,0.25)",
              animationDuration: "1.5s",
            }}
          />
          <Logo size={72} />
        </div>

        <div className="flex flex-col items-center gap-2">
          <h3 className="font-bold text-lg text-white tracking-tight">
            Lectio <span className="text-[#F5A623]">AI</span>
          </h3>
          {/* Bouncing dots */}
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
