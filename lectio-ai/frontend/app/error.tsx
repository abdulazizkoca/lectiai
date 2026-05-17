"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route Error Caught:", error);
  }, [error]);

  const dict = {
    uz: { title: "Xatolik yuz berdi", msg: "Ushbu bo'limni yuklashda muammo yuzaga keldi. Iltimos, qayta urinib ko'ring.", btn: "Qayta urinish" },
    ru: { title: "Произошла ошибка", msg: "Возникла проблема при загрузке этого раздела. Пожалуйста, попробуйте еще раз.", btn: "Повторить" },
    en: { title: "An error occurred", msg: "There was a problem loading this section. Please try again.", btn: "Try again" }
  };
  
  // Use a safe fallback if context isn't available (error boundary)
  const langKey = typeof window !== 'undefined' ? (localStorage.getItem("lectio-language") as "uz" | "ru" | "en") || "uz" : "uz";
  const t = dict[langKey] || dict.uz;

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="bg-[#18181F] p-8 rounded-3xl border border-slate-800 max-w-md w-full text-center shadow-2xl">
        <div className="w-16 h-16 bg-[#E84855]/10 text-[#E84855] rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-display font-bold mb-2">{t.title}</h2>
        <p className="text-slate-400 mb-8 text-sm">
          {t.msg}
        </p>
        <Button 
          variant="primary" 
          className="w-full" 
          leftIcon={<RefreshCw size={18} />}
          onClick={() => reset()}
        >
          {t.btn}
        </Button>
      </div>
    </div>
  );
}
