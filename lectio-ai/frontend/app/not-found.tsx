"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft, Search } from "lucide-react";
import Logo from "@/components/Logo";

export default function NotFoundPage() {
  const router = useRouter();
  
  const dict = {
    uz: { title: "Sahifa topilmadi", msg: "Siz qidirayotgan sahifa mavjud emas yoki ko'chirilgan bo'lishi mumkin.", btn: "Bosh sahifaga", back: "Orqaga" },
    ru: { title: "Страница не найдена", msg: "Страница, которую вы ищете, не существует или была перемещена.", btn: "На главную", back: "Назад" },
    en: { title: "Page not found", msg: "The page you are looking for does not exist or may have been moved.", btn: "Go home", back: "Go back" }
  };
  
  // Safe fallback
  const langKey = typeof window !== 'undefined' ? (localStorage.getItem("lectio-language") as "uz" | "ru" | "en") || "uz" : "uz";
  const t = dict[langKey] || dict.uz;

  return (
    <div
      className="min-h-screen text-white flex flex-col items-center justify-center p-6 text-center"
      style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)" }}
    >
      {/* Ambient orb */}
      <div className="fixed top-0 right-0 w-96 h-96 rounded-full opacity-[0.06] blur-[80px] pointer-events-none" style={{ background: "#F5A623" }} />
      <div className="fixed bottom-0 left-0 w-72 h-72 rounded-full opacity-[0.04] blur-[60px] pointer-events-none" style={{ background: "#1B4FD8" }} />

      {/* Logo top */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-6 left-6 flex items-center gap-2"
      >
        <Logo size={32} />
        <span className="font-bold text-white/80 text-lg">Lectio <span className="text-saffron">AI</span></span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md"
      >
        {/* 404 visual */}
        <div className="relative mb-8">
          <div
            className="text-[140px] font-black leading-none opacity-10 select-none"
            style={{ color: "#F5A623" }}
          >
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center"
              style={{ background: "rgba(245,166,35,0.15)", border: "2px solid rgba(245,166,35,0.3)" }}
            >
              <Search size={40} style={{ color: "#F5A623" }} />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-3">{t.title}</h1>
        <p className="text-slate-400 mb-8">
          {t.msg}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
          >
            <ArrowLeft size={18} /> {t.back}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/")}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-black transition-all"
            style={{ background: "linear-gradient(135deg,#F5A623,#e8941a)" }}
          >
            <Home size={18} /> {t.btn}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
