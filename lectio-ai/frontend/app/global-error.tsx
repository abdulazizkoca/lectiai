"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <html lang="uz">
      <body className="bg-[#0A0A0F] text-white flex items-center justify-center min-h-[100dvh] p-4 font-sans">
        <div className="bg-[#18181F] p-8 rounded-3xl border border-slate-800 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-[#E84855]/10 text-[#E84855] rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Kritik xatolik</h2>
          <p className="text-slate-400 mb-8 text-sm">
            Tizimning asosiy qismida nosozlik yuz berdi. Sahifani to'liq yangilashga harakat qiling.
          </p>
          <button 
            className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            onClick={() => reset()}
          >
            <RefreshCw size={18} />
            Tizimni qayta yuklash
          </button>
        </div>
      </body>
    </html>
  );
}
