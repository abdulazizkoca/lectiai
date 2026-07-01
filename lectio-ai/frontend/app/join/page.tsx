"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { sessionsAPI } from "@/lib/api";

export default function QuizJoinPage() {
  const [code, setCode]             = useState("");
  const [nickname, setNickname]     = useState("");
  const [step, setStep]             = useState<"code" | "name">("code");
  const [checkingCode, setChecking] = useState(false);
  const [joining, setJoining]       = useState(false);

  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();
  const { language }  = useLanguage();
  const { isDark, toggleTheme } = useTheme();

  // Auto-fill nickname from stored user
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("lectio_user") || "{}");
      if (u?.full_name) setNickname(u.full_name.split(" ")[0]);
    } catch {}
  }, []);

  const handleCodeEnter = async () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) return;
    setChecking(true);
    try {
      await sessionsAPI.get(trimmed);
      setStep("name");
    } catch {
      // Code validation failed — for socket-only rooms the REST check may fail.
      // Proceed anyway; real validation happens during socket join.
      setStep("name");
    } finally { setChecking(false); }
  };

  const handleJoin = async () => {
    if (!nickname.trim()) return;
    setJoining(true);
    try {
      const trimmedCode = code.trim().toUpperCase();
      let studentId: number | undefined;
      try { const u = JSON.parse(localStorage.getItem("lectio_user") || "{}"); studentId = u?.id; } catch {}

      try {
        const res = await sessionsAPI.join(trimmedCode, nickname.trim(), studentId);
        localStorage.setItem("lectio_quiz_participant", JSON.stringify({
          participant_id: res.participant_id,
          nickname: res.nickname,
          room_code: trimmedCode,
        }));
      } catch {
        // Join REST may fail for socket-only rooms — save minimal info and proceed
        localStorage.setItem("lectio_quiz_participant", JSON.stringify({
          participant_id: null,
          nickname: nickname.trim(),
          room_code: trimmedCode,
        }));
      }
      router.push(`/quiz/${trimmedCode}?name=${encodeURIComponent(nickname.trim())}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Qo'shilishda muammo yuz berdi";
      addToast({ title: "Xatolik", description: msg, type: "error" });
      setJoining(false);
    }
  };

  // ── i18n ──────────────────────────────────────────────────────────
  const dict = {
    uz: {
      title: "Lectio AI Quiz", subtitle: "Darsga qo'shiling yoki solo test yeching",
      roomCode: "Room kodi", roomPlaceholder: "TIGER7", enter: "Kirish →",
      or: "yoki", scanQr: "📷 QR Kodni Skanlash",
      scanWarnTitle: "Kamera ochilmoqda", scanWarnDesc: "QR kod skaneri hozircha faqat mobil ilovada qo'llab-quvvatlanadi",
      soloQuiz: "Darsiz solo test yechish →", nickname: "Laqabingiz", namePlaceholder: "Jasur, Dilnoza…",
      joinBtn: "Kirish ⚡", backToCode: "← Kod o'zgartirish", checking: "Tekshirilmoqda…", joining: "Qo'shilmoqda…"
    },
    ru: {
      title: "Lectio AI Quiz", subtitle: "Присоединяйтесь к уроку или решайте соло-тест",
      roomCode: "Код комнаты", roomPlaceholder: "TIGER7", enter: "Войти →",
      or: "или", scanQr: "📷 Сканировать QR", scanWarnTitle: "Открытие камеры",
      scanWarnDesc: "Сканер QR-кодов пока поддерживается только в мобильном приложении",
      soloQuiz: "Пройти соло-тест без урока →", nickname: "Ваш никнейм", namePlaceholder: "Жасур, Дильноза…",
      joinBtn: "Войти ⚡", backToCode: "← Изменить код", checking: "Проверяем…", joining: "Подключаемся…"
    },
    en: {
      title: "Lectio AI Quiz", subtitle: "Join a lesson or take a solo quiz",
      roomCode: "Room Code", roomPlaceholder: "TIGER7", enter: "Enter →",
      or: "or", scanQr: "📷 Scan QR Code", scanWarnTitle: "Opening camera",
      scanWarnDesc: "QR code scanner is currently only supported in the mobile app",
      soloQuiz: "Take a solo quiz without a lesson →", nickname: "Your nickname", namePlaceholder: "Jasur, Dilnoza…",
      joinBtn: "Join ⚡", backToCode: "← Change code", checking: "Checking…", joining: "Joining…"
    },
  };
  const langKey = (language === "uz" || language === "ru" || language === "en") ? language : "uz";
  const t = dict[langKey];

  // ── Theme tokens ──────────────────────────────────────────────────
  const bg      = isDark ? "#0A0A0F" : "#F8FAFC";
  const surf    = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const border  = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)";
  const fg      = isDark ? "#fff" : "#0A0A0F";
  const muted   = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const inputCls = isDark
    ? "bg-white/10 border-white/20 text-white placeholder-slate-500 focus:border-saffron"
    : "bg-black/[0.04] border-black/12 text-[#0A0A0F] placeholder-slate-400 focus:border-saffron";

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative" style={{ background: bg }}>
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Theme toggle */}
      <button onClick={toggleTheme}
        className="absolute top-4 right-4 p-2.5 rounded-xl transition"
        style={{ background: surf, border: `1px solid ${border}` }}>
        {isDark ? <Sun size={16} style={{ color: "#F5A623" }} /> : <Moon size={16} style={{ color: "#1B4FD8" }} />}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo + heading */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Link href="/">
            <div className="w-14 h-14 mb-4 rounded-2xl flex items-center justify-center font-bold text-2xl text-black cursor-pointer hover:scale-105 transition-transform shadow-lg"
              style={{ background: "linear-gradient(135deg, #F5A623, #e8941a)", boxShadow: "0 8px 24px rgba(245,166,35,0.3)" }}>
              L
            </div>
          </Link>
          <h1 className="text-3xl font-black" style={{ color: fg }}>{t.title}</h1>
          <p className="text-sm mt-1.5" style={{ color: muted }}>{t.subtitle}</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-6" style={{ background: surf, border: `1px solid ${border}` }}>
          <AnimatePresence mode="wait">

            {/* Step 1: Room code */}
            {step === "code" && (
              <motion.div key="code" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <label className="block text-sm font-medium mb-2" style={{ color: muted }}>{t.roomCode}</label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && code.length >= 4 && handleCodeEnter()}
                  placeholder={t.roomPlaceholder}
                  maxLength={8}
                  className={`w-full border rounded-2xl px-4 py-4 text-3xl font-mono tracking-widest text-center focus:outline-none transition ${inputCls}`}
                  autoFocus
                />

                <button
                  onClick={handleCodeEnter}
                  disabled={code.length < 4 || checkingCode}
                  className="w-full mt-4 py-4 rounded-2xl font-bold text-lg text-black disabled:opacity-50 flex items-center justify-center gap-2 transition"
                  style={{ background: "#F5A623" }}
                >
                  {checkingCode ? <><Loader2 size={18} className="animate-spin" /> {t.checking}</> : t.enter}
                </button>

                {/* Divider */}
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" style={{ borderColor: border }} />
                  </div>
                  <div className="relative text-center">
                    <span className="px-3 text-sm" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", color: muted }}>
                      {t.or}
                    </span>
                  </div>
                </div>

                <button
                  className="w-full py-3 rounded-2xl border text-sm transition"
                  style={{ border: `1px solid ${border}`, color: muted }}
                  onClick={() => addToast({ title: t.scanWarnTitle, description: t.scanWarnDesc, type: "warning" })}>
                  {t.scanQr}
                </button>

                <button
                  onClick={() => router.push("/quiz/solo")}
                  className="w-full mt-2 py-3 rounded-2xl text-sm transition"
                  style={{ color: muted }}>
                  {t.soloQuiz}
                </button>
              </motion.div>
            )}

            {/* Step 2: Nickname */}
            {step === "name" && (
              <motion.div key="name" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <button onClick={() => setStep("code")}
                  className="flex items-center gap-1.5 text-sm mb-5 font-medium transition"
                  style={{ color: muted }}>
                  <ArrowLeft size={14} />
                  <span className="font-mono font-bold px-2 py-0.5 rounded-lg" style={{ background: "rgba(245,166,35,0.15)", color: "#F5A623" }}>
                    {code}
                  </span>
                </button>

                <label className="block text-sm font-medium mb-2" style={{ color: muted }}>{t.nickname}</label>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && nickname.trim() && handleJoin()}
                  placeholder={t.namePlaceholder}
                  className={`w-full border rounded-2xl px-4 py-4 text-xl focus:outline-none transition ${inputCls}`}
                  autoFocus
                />

                <button
                  onClick={handleJoin}
                  disabled={!nickname.trim() || joining}
                  className="w-full mt-4 py-4 rounded-2xl font-bold text-lg text-black disabled:opacity-50 flex items-center justify-center gap-2 transition"
                  style={{ background: "#F5A623" }}>
                  {joining ? <><Loader2 size={18} className="animate-spin" /> {t.joining}</> : t.joinBtn}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: muted }}>
          Lectio AI — O&apos;zbekiston universitetlari uchun
        </p>
      </motion.div>
    </main>
  );
}
