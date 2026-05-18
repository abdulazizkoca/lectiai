"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Logo from "@/components/Logo";

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
    uz: { title: "Xatolik yuz berdi", msg: "Ushbu bo'limni yuklashda muammo yuzaga keldi. Iltimos, qayta urinib ko'ring.", btn: "Qayta urinish", home: "Bosh sahifa" },
    ru: { title: "Произошла ошибка", msg: "Возникла проблема при загрузке этого раздела. Пожалуйста, попробуйте еще раз.", btn: "Повторить", home: "Главная" },
    en: { title: "An error occurred", msg: "There was a problem loading this section. Please try again.", btn: "Try again", home: "Go home" }
  };
  
  // Use a safe fallback if context isn't available (error boundary)
  const langKey = typeof window !== 'undefined' ? (localStorage.getItem("lectio-language") as "uz" | "ru" | "en") || "uz" : "uz";
  const t = dict[langKey] || dict.uz;

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="bg-[#18181F] p-8 rounded-3xl border border-slate-800 max-w-md w-full text-center shadow-2xl">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <Logo size={44} />
        </div>
        <div className="w-16 h-16 bg-[#E84855]/10 text-[#E84855] rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-display font-bold mb-2">{t.title}</h2>
        <p className="text-slate-400 mb-8 text-sm">
          {t.msg}
        </p>
        <div className="flex flex-col gap-3">
          <Button 
            variant="primary" 
            className="w-full" 
            leftIcon={<RefreshCw size={18} />}
            onClick={() => reset()}
          >
            {t.btn}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            leftIcon={<Home size={18} />}
            onClick={() => window.location.href = '/'}
          >
            {t.home}
          </Button>
        </div>
      </div>
    </div>
  );
}
