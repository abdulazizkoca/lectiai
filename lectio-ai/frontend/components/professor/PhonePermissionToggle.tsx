"use client";
import { useState } from "react";
import { Smartphone } from "lucide-react";

export function PhonePermissionToggle({ onToggle }: { onToggle?: (allowed: boolean) => void }) {
  const [allowed, setAllowed] = useState(false);
  
  const toggle = () => {
    const newState = !allowed;
    setAllowed(newState);
    if (onToggle) onToggle(newState);
    // Real implementation would emit: socket.emit("phone_permission", { allowed: newState });
  };
  
  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
        allowed 
          ? "bg-[#0D9373]/20 text-[#0D9373] border border-[#0D9373]/30" 
          : "bg-white/5 text-gray-400 border border-white/10"
      }`}
    >
      <Smartphone size={16} />
      <span>Telefon: {allowed ? "Ruxsat berildi ✓" : "Taqiqlangan"}</span>
    </button>
  );
}
