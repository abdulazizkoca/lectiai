"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Zap, Camera, Flame, Trophy, Clock, Sun, Moon, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

const MAIN_CARDS = [
  {
    id: "independent",
    Icon: BookOpen,
    color: "#0D9373",
    bg: "rgba(13,147,115,0.09)",
    border: "rgba(13,147,115,0.25)",
    title: { uz: "MUSTAQIL O'QISH", ru: "САМООБУЧЕНИЕ", en: "SELF STUDY" },
    desc: { uz: "AI usto, flashcard, test, aqli xarita va xulosa — o'z tempingizda o'rganing.", ru: "AI наставник, флеш-карты, тесты — учитесь в своём темпе.", en: "AI tutor, flashcards, tests, mindmaps — learn at your own pace." },
    cta: { uz: "Boshlash →", ru: "Начать →", en: "Start →" },
    route: "/student/independent",
  },
  {
    id: "face",
    Icon: Camera,
    color: "#1B4FD8",
    bg: "rgba(27,79,216,0.09)",
    border: "rgba(27,79,216,0.25)",
    title: { uz: "YUZNI RO'YXATDAN\nO'TKAZISH", ru: "РЕГИСТРАЦИЯ\nЛИЦА", en: "FACE\nREGISTRATION" },
    desc: { uz: "Yuzingizni taniydigan tizimga ro'yxatdan o'tkazing. Darsda avtomatik taniladi.", ru: "Зарегистрируйтесь в системе распознавания лиц. На уроке вас узнают автоматически.", en: "Register your face for automatic recognition during lessons." },
    cta: { uz: "Ro'yxatdan o'tish →", ru: "Зарегистрироваться →", en: "Register →" },
    route: "/student/face-registration",
    center: true,
  },
  {
    id: "live",
    Icon: Zap,
    color: "#F5A623",
    bg: "rgba(245,166,35,0.09)",
    border: "rgba(245,166,35,0.25)",
    title: { uz: "DARSGA QO'SHILISH", ru: "ВОЙТИ В УРОК", en: "JOIN LESSON" },
    desc: { uz: "Professor boshlagan jonli darsga kod yozib yoki QR skanerlab ulaning.", ru: "Присоединитесь к уроку преподавателя по коду или QR-коду.", en: "Join a live lesson by code or QR scan." },
    cta: { uz: "Kod kiritish →", ru: "Ввести код →", en: "Enter code →" },
    route: "/student/live",
  },
];

export default function StudentDashboardPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const { language } = useLanguage();
  const lang = language as "uz" | "ru" | "en";

  const bg = isDark ? "#0A0A0F" : "#F8FAFC";
  const fg = isDark ? "#fff" : "#0A0A0F";
  const fgMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const surface = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const surfaceBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: bg }}>
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-6 py-4 sticky top-0 z-40"
        style={{ background: isDark ? "rgba(10,10,15,0.9)" : "rgba(248,250,252,0.9)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${surfaceBorder}` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-widest uppercase" style={{ color: fgMuted }}>O'quvchi</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "rgba(232,72,85,0.15)", color: "#E84855" }}>
            <Flame size={10} className="inline mr-1" />7 kun
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
            style={{ background: surface, color: isDark ? "#F5A623" : "#1B4FD8", border: `1px solid ${surfaceBorder}` }}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button
            onClick={() => router.push("/")}
            className="text-xs px-3 py-1.5 rounded-lg transition-all font-medium"
            style={{ background: surface, color: fgMuted, border: `1px solid ${surfaceBorder}` }}
          >
            ← Bosh sahifa
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-5xl"
        >
          {/* Greeting */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-2" style={{ color: fg }}>
              {lang === "uz" && "Xush kelibsiz! 👋"}
              {lang === "ru" && "Добро пожаловать! 👋"}
              {lang === "en" && "Welcome! 👋"}
            </h1>
            <p className="text-lg" style={{ color: "#0D9373" }}>
              {lang === "uz" && "Bugun nima qilasiz?"}
              {lang === "ru" && "Что будем делать сегодня?"}
              {lang === "en" && "What will you do today?"}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: { uz: "O'rganilgan", ru: "Пройдено", en: "Studied" }, value: "18", unit: { uz: " mavzu", ru: " тем", en: " topics" }, Icon: BookOpen, color: "#1B4FD8" },
              { label: { uz: "O'rtacha ball", ru: "Средний балл", en: "Avg score" }, value: "87", unit: "%", Icon: Trophy, color: "#F5A623" },
              { label: { uz: "Oxirgi kirish", ru: "Последний вход", en: "Last visit" }, value: { uz: "Bugun", ru: "Сегодня", en: "Today" }, unit: "", Icon: Clock, color: "#0D9373" },
            ].map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="rounded-2xl p-4 text-center"
                style={{ background: surface, border: `1px solid ${surfaceBorder}` }}
              >
                <s.Icon size={18} className="mx-auto mb-1" style={{ color: s.color }} />
                <p className="text-lg font-bold" style={{ color: fg }}>
                  {typeof s.value === "string" ? s.value : s.value[lang]}
                  {typeof s.unit === "string" ? s.unit : s.unit[lang]}
                </p>
                <p className="text-xs mt-0.5" style={{ color: fgMuted }}>{s.label[lang]}</p>
              </motion.div>
            ))}
          </div>

          {/* Main cards — responsive: 1 col on mobile, 3 on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            {MAIN_CARDS.map((card, i) => (
              <motion.button
                key={card.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(card.route)}
                className="text-left rounded-3xl p-7 border transition-all duration-200 flex flex-col group"
                style={{
                  background: card.bg,
                  border: `1px solid ${card.border}`,
                  alignItems: card.center ? "center" : "flex-start",
                  textAlign: card.center ? "center" : "left",
                }}
              >
                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: `${card.color}22` }}>
                  <card.Icon size={28} style={{ color: card.color }} />
                </div>

                {/* Title */}
                <h2 className="text-base font-bold mb-2 whitespace-pre-line leading-snug" style={{ color: fg }}>
                  {card.title[lang]}
                </h2>

                {/* Desc */}
                <p className="text-sm mb-5 flex-1" style={{ color: fgMuted }}>{card.desc[lang]}</p>

                {/* CTA */}
                <div className="flex items-center gap-1 text-sm font-bold group-hover:gap-2 transition-all" style={{ color: card.color }}>
                  {card.cta[lang]}
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.button>
            ))}
          </div>

          {/* Continue studying */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            onClick={() => router.push("/student/study")}
            className="w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all text-left group"
            style={{ background: surface, border: `1px solid ${surfaceBorder}` }}
            whileHover={{ borderColor: "rgba(245,166,35,0.3)", backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(27,79,216,0.15)" }}>
                <Clock size={16} style={{ color: "#1B4FD8" }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: fg }}>
                  {lang === "uz" ? "Davom etish" : lang === "ru" ? "Продолжить" : "Continue"}
                </p>
                <p className="text-xs" style={{ color: fgMuted }}>
                  {lang === "uz" ? "Oxirgi mavzu: Fizika — Termodinamika" : lang === "ru" ? "Последняя тема: Физика — Термодинамика" : "Last topic: Physics — Thermodynamics"}
                </p>
              </div>
            </div>
            <ArrowRight size={16} className="text-[#F5A623] group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
