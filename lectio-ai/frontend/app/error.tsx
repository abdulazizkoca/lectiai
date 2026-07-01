"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Uncaught error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] text-white p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-3xl mx-auto mb-6">
          ⚠️
        </div>
        <h1 className="text-2xl font-bold mb-3">Xatolik yuz berdi</h1>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          Ilovada kutilmagan xatolik yuz berdi. Sahifani yangilash yoki qayta urinish orqali davom etishingiz mumkin.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 rounded-xl bg-saffron text-black font-bold text-sm hover:brightness-105 transition"
          >
            Qayta urinish
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-6 py-2.5 rounded-xl border border-white/15 text-sm font-bold hover:bg-white/5 transition"
          >
            Bosh sahifaga
          </button>
        </div>
      </div>
    </div>
  );
}
