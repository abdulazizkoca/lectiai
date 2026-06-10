"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Zap, Camera, Flame, Trophy, Clock, Sun, Moon, ArrowRight, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const MAIN_CARDS = [
  {
    id: "independent",
    Icon: BookOpen,
    color: "#0D9373",
    bg: "rgba(13,147,115,0.09)",
    border: "rgba(13,147,115,0.25)",
    title: { uz: "MUSTAQIL O'QISH", ru: "САМООБУЧЕНИЕ", en: "SELF STUDY" },
    desc: {
      uz: "AI usto, flashcard, test, aqli xarita va xulosa — o'z tempingizda o'rganing.",
      ru: "AI наставник, флеш-карты, тесты — учитесь в своём темпе.",
      en: "AI tutor, flashcards, tests, mindmaps — learn at your own pace.",
    },
    cta: { uz: "Boshlash", ru: "Начать", en: "Start" },
    route: "/student/independent",
  },
  {
    id: "face",
    Icon: Camera,
    color: "#1B4FD8",
    bg: "rgba(27,79,216,0.09)",
    border: "rgba(27,79,216,0.25)",
    title: { uz: "YUZNI RO'YXATDAN\nO'TKAZISH", ru: "РЕГИСТРАЦИЯ\nЛИЦА", en: "FACE\nREGISTRATION" },
    desc: {
      uz: "Yuzingizni taniydigan tizimga ro'yxatdan o'tkazing. Darsda avtomatik taniladi.",
      ru: "Зарегистрируйтесь в системе распознавания лиц. На уроке вас узнают автоматически.",
      en: "Register your face for automatic recognition during lessons.",
    },
    cta: { uz: "Ro'yxatdan o'tish", ru: "Зарегистрироваться", en: "Register" },
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
    desc: {
      uz: "Professor boshlagan jonli darsga kod yozib yoki QR skanerlab ulaning.",
      ru: "Присоединитесь к уроку преподавателя по коду или QR-коду.",
      en: "Join a live lesson by code or QR scan.",
    },
    cta: { uz: "Kod kiritish", ru: "Ввести код", en: "Enter code" },
    route: "/join",
  },
];

interface DashboardStats {
  xp: number;
  streak: number;
  due_for_review: number;
  total_flashcards: number;
  full_name?: string;
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const lang = language as "uz" | "ru" | "en";

  const [stats, setStats] = useState<DashboardStats>({ xp: 0, streak: 0, due_for_review: 0, total_flashcards: 0 });
  const [userName, setUserName] = useState<string>("");
  const [lastTopic, setLastTopic] = useState<{ subject: string; topic: string } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("lectio_token");
    const raw = localStorage.getItem("lectio_user");

    // Auth guard — login qilinmagan bo'lsa redirect
    if (!token || !raw) {
      router.replace("/login");
      return;
    }

    let userId: number | null = null;
    try {
      const u = JSON.parse(raw);
      userId = u?.id ?? null;
      if (u?.full_name) setUserName(u.full_name);
    } catch {
      router.replace("/login");
      return;
    }

    if (!userId) {
      router.replace("/login");
      return;
    }

    // Dashboard stats — token bilan
    fetch(`${API_URL}/api/student/${userId}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 401) { router.replace("/login"); return null; }
        return r.ok ? r.json() : null;
      })
      .then((d) => {
        if (!d) return;
        setStats({
          xp: d.xp ?? 0,
          streak: d.streak ?? 0,
          due_for_review: d.due_for_review ?? 0,
          total_flashcards: d.total_flashcards ?? 0,
        });
        if (d.full_name) setUserName(d.full_name);
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false));

    // Oxirgi o'rganilgan mavzuni olish
    fetch(`${API_URL}/api/chain/progress/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const subjects: { subject: string; topic: string }[] = d?.subjects || [];
        if (subjects.length > 0) setLastTopic(subjects[subjects.length - 1]);
      })
      .catch(() => {});
  }, [router]);

  const bg = isDark ? "#0A0A0F" : "#F8FAFC";
  const fg = isDark ? "#fff" : "#0A0A0F";
  const fgMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const surface = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const surfaceBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";

  const firstName = userName.split(" ")[0] || "";

  const STAT_CARDS = [
    {
      label: { uz: "Flashcardlar", ru: "Флеш-карты", en: "Flashcards" },
      value: statsLoading ? "—" : String(stats.total_flashcards),
      unit: { uz: " ta", ru: " шт", en: "" },
      Icon: BookOpen,
      color: "#1B4FD8",
    },
    {
      label: { uz: "XP ball", ru: "XP очки", en: "XP Points" },
      value: statsLoading ? "—" : String(stats.xp),
      unit: { uz: "", ru: "", en: "" },
      Icon: Trophy,
      color: "#F5A623",
    },
    {
      label: { uz: "Kunlik streak", ru: "Стрик", en: "Streak" },
      value: statsLoading ? "—" : String(stats.streak),
      unit: { uz: " kun", ru: " дней", en: " days" },
      Icon: Flame,
      color: "#E84855",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: bg }}>
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-4 md:px-6 py-4 sticky top-0 z-40"
        style={{
          background: isDark ? "rgba(10,10,15,0.9)" : "rgba(248,250,252,0.9)",
          backdropFilter: "blur(16px)",
          borderBottom: `1px solid ${surfaceBorder}`,
        }}
      >
        <div className="flex items-center gap-3">
          <Link href="/">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F5A623] to-[#e8941a] flex items-center justify-center font-bold text-black shrink-0 shadow-lg shadow-[#F5A623]/20 cursor-pointer hover:scale-105 transition-transform">
              L
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-widest uppercase hidden sm:inline" style={{ color: fgMuted }}>
              {lang === "uz" ? "O'quvchi" : lang === "ru" ? "Студент" : "Student"}
            </span>
            {stats.streak > 0 && !statsLoading && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "rgba(232,72,85,0.15)", color: "#E84855" }}>
                <Flame size={10} className="inline mr-1" />
                {stats.streak} {lang === "uz" ? "kun" : lang === "ru" ? "дней" : "days"}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language switcher */}
          <div className="flex items-center rounded-lg p-1" style={{ background: surface, border: `1px solid ${surfaceBorder}` }}>
            {(["uz", "ru", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                className="px-2 py-1 text-[10px] font-bold rounded-md transition-all"
                style={{
                  background: language === l ? "#F5A623" : "transparent",
                  color: language === l ? "#000" : fgMuted,
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
            style={{ background: surface, color: isDark ? "#F5A623" : "#1B4FD8", border: `1px solid ${surfaceBorder}` }}
            aria-label="Mavzuni o'zgartirish"
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
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
            <h1 className="text-3xl md:text-5xl font-bold mb-2 md:mb-3" style={{ color: fg }}>
              {firstName
                ? lang === "uz"
                  ? `Salom, ${firstName}! 👋`
                  : lang === "ru"
                  ? `Привет, ${firstName}! 👋`
                  : `Hi, ${firstName}! 👋`
                : lang === "uz"
                ? "Xush kelibsiz! 👋"
                : lang === "ru"
                ? "Добро пожаловать! 👋"
                : "Welcome! 👋"}
            </h1>
            <p className="text-lg" style={{ color: "#0D9373" }}>
              {lang === "uz" ? "Bugun nima qilasiz?" : lang === "ru" ? "Что будем делать сегодня?" : "What will you do today?"}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {STAT_CARDS.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="rounded-2xl p-4 text-center"
                style={{ background: surface, border: `1px solid ${surfaceBorder}` }}
              >
                <s.Icon size={18} className="mx-auto mb-1" style={{ color: s.color }} />
                <p className="text-lg font-bold" style={{ color: statsLoading ? fgMuted : fg }}>
                  {s.value}
                  {!statsLoading && s.unit[lang]}
                </p>
                <p className="text-xs mt-0.5" style={{ color: fgMuted }}>
                  {s.label[lang]}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Takrorlash eslatmasi */}
          {!statsLoading && stats.due_for_review > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              onClick={() => router.push("/student/flashcards")}
              className="w-full flex items-center justify-between gap-4 px-5 py-3 rounded-2xl mb-5 transition-all"
              style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.35)" }}
              whileHover={{ backgroundColor: "rgba(245,166,35,0.15)" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(245,166,35,0.2)" }}>
                  <RefreshCw size={15} style={{ color: "#F5A623" }} />
                </div>
                <p className="text-sm font-bold text-left" style={{ color: fg }}>
                  {lang === "uz"
                    ? `${stats.due_for_review} ta flashcard takrorlash vaqti keldi!`
                    : lang === "ru"
                    ? `${stats.due_for_review} флеш-карт готовы к повторению!`
                    : `${stats.due_for_review} flashcards ready for review!`}
                </p>
              </div>
              <ArrowRight size={15} style={{ color: "#F5A623" }} className="shrink-0" />
            </motion.button>
          )}

          {/* Main cards */}
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
                className="text-left rounded-3xl p-7 transition-all duration-200 flex flex-col group"
                style={{
                  background: card.bg,
                  border: `1px solid ${card.border}`,
                  alignItems: card.center ? "center" : "flex-start",
                  textAlign: card.center ? "center" : "left",
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: `${card.color}22` }}
                >
                  <card.Icon size={28} style={{ color: card.color }} />
                </div>

                <h2 className="text-base font-bold mb-2 whitespace-pre-line leading-snug" style={{ color: fg }}>
                  {card.title[lang]}
                </h2>

                <p className="text-sm mb-5 flex-1" style={{ color: fgMuted }}>
                  {card.desc[lang]}
                </p>

                <div
                  className="flex items-center gap-1 text-sm font-bold group-hover:gap-2 transition-all"
                  style={{ color: card.color }}
                >
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
            onClick={() => router.push("/student/flashcards")}
            className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 px-5 md:px-6 py-4 rounded-2xl transition-all text-left group"
            style={{ background: surface, border: `1px solid ${surfaceBorder}` }}
            whileHover={{
              borderColor: "rgba(245,166,35,0.3)",
              backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
            }}
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
                  {lastTopic
                    ? lang === "uz"
                      ? `Oxirgi mavzu: ${lastTopic.subject} — ${lastTopic.topic}`
                      : lang === "ru"
                      ? `Последняя тема: ${lastTopic.subject} — ${lastTopic.topic}`
                      : `Last topic: ${lastTopic.subject} — ${lastTopic.topic}`
                    : lang === "uz"
                    ? "Hali mavzu tanlanmagan. Boshlang!"
                    : lang === "ru"
                    ? "Тема ещё не выбрана. Начните!"
                    : "No topic yet. Start learning!"}
                </p>
              </div>
            </div>
            <ArrowRight size={16} className="text-[#F5A623] group-hover:translate-x-1 transition-transform shrink-0" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
