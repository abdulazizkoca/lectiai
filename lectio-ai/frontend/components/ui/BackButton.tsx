"use client";
import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push("/")}
      className="fixed top-6 left-6 z-40 flex items-center gap-2 
                 px-3 py-2 rounded-xl bg-white/5 border border-white/10 
                 text-gray-400 hover:text-white hover:bg-white/10 
                 transition-all text-sm"
    >
      ← Bosh sahifa
    </button>
  );
}
