"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";
import { useLanguage } from "@/contexts/LanguageContext";

export default function QuizJoinPage() {
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [step, setStep] = useState<"code" | "name">("code");
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();
  const { language } = useLanguage();

  const dict = {
    uz: {
      title: "Lectio AI Quiz",
      subtitle: "Darsga qo'shiling yoki solo test yeching",
      roomCode: "Room kodi",
      enter: "Kirish →",
      or: "yoki",
      scanQr: "📷 QR Kodni Skanlash",
      scanWarnTitle: "Kamera ochilmoqda",
      scanWarnDesc: "QR kod skaneri hozircha faqat mobil ilovada qo'llab-quvvatlanadi",
      soloQuiz: "Darsiz solo test yechish →",
      nickname: "Laqabingiz",
      placeholderName: "Jasur, Dilnoza...",
      enterFast: "Kirish ⚡"
    },
    ru: {
      title: "Lectio AI Quiz",
      subtitle: "Присоединяйтесь к уроку или решайте соло-тест",
      roomCode: "Код комнаты",
      enter: "Войти →",
      or: "или",
      scanQr: "📷 Сканировать QR код",
      scanWarnTitle: "Открытие камеры",
      scanWarnDesc: "Сканер QR-кодов пока поддерживается только в мобильном приложении",
      soloQuiz: "Пройти соло-тест без урока →",
      nickname: "Ваш никнейм",
      placeholderName: "Жасур, Дильноза...",
      enterFast: "Войти ⚡"
    },
    en: {
      title: "Lectio AI Quiz",
      subtitle: "Join a lesson or take a solo quiz",
      roomCode: "Room Code",
      enter: "Enter →",
      or: "or",
      scanQr: "📷 Scan QR Code",
      scanWarnTitle: "Opening camera",
      scanWarnDesc: "QR code scanner is currently only supported in the mobile app",
      soloQuiz: "Take a solo quiz without a lesson →",
      nickname: "Your nickname",
      placeholderName: "Jasur, Dilnoza...",
      enterFast: "Enter ⚡"
    }
  };

  const langKey = (language === "uz" || language === "ru" || language === "en") ? language : "uz";
  const t = dict[langKey];

  return (
    <main className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-6">
      
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8 flex flex-col items-center">
          <Link href="/">
            <div className="w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-[#F5A623] to-[#e8941a] flex items-center justify-center font-display font-bold text-2xl text-black shrink-0 shadow-lg shadow-[#F5A623]/20 cursor-pointer hover:scale-105 transition-transform">
              L
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-white">{t.title}</h1>
          <p className="text-gray-400 mt-2">{t.subtitle}</p>
        </div>

        <AnimatePresence mode="wait">
          {step === "code" ? (
            <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <label className="block text-gray-300 text-sm mb-2">{t.roomCode}</label>
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="TIGER7"
                maxLength={6}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4
                           text-white text-2xl font-mono tracking-widest text-center
                           focus:border-[#F5A623] focus:outline-none transition"
                autoFocus
              />
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => code.length >= 4 && setStep("name")}
                  className="flex-1 py-4 rounded-xl bg-[#F5A623] text-black font-bold text-lg"
                >
                  {t.enter}
                </button>
              </div>
              
              {/* OR scan QR */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative text-center">
                  <span className="px-3 bg-[#0A0A0F] text-gray-500 text-sm">{t.or}</span>
                </div>
              </div>
              
              <button 
                className="w-full py-3 rounded-xl border border-white/20 text-gray-300 hover:bg-white/5 transition"
                onClick={() => addToast({ title: t.scanWarnTitle, description: t.scanWarnDesc, type: "warning" })}
              >
                {t.scanQr}
              </button>
              
              {/* Solo quiz option */}
              <button
                onClick={() => router.push("/quiz/solo")}
                className="w-full mt-3 py-3 rounded-xl border border-white/10 text-gray-500 hover:text-gray-300 transition text-sm"
              >
                {t.soloQuiz}
              </button>
            </motion.div>
          ) : (
            <motion.div key="name" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <button onClick={() => setStep("code")} className="text-gray-400 text-sm mb-4 flex items-center gap-1">
                ← {code}
              </button>
              <label className="block text-gray-300 text-sm mb-2">{t.nickname}</label>
              <input
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder={t.placeholderName}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4
                           text-white text-xl focus:border-[#F5A623] focus:outline-none transition"
                autoFocus
              />
              <button
                onClick={() => nickname.trim() && router.push(`/quiz/${code}?name=${nickname}`)}
                className="w-full mt-4 py-4 rounded-xl bg-[#F5A623] text-black font-bold text-lg"
              >
                {t.enterFast}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}
