"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Loader2, CheckCircle2, XCircle, Minus,
  RotateCcw, Sun, Moon, Keyboard, Trophy, Flame, Target
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Card {
  id: number;
  question: string;
  answer: string;
  hint?: string;
  subject?: string;
  interval: number;
  difficulty: number;
}

const RATINGS = [
  { q: 1, label: "Bilmadim", icon: XCircle, color: "#E84855", bg: "rgba(232,72,85,0.12)", darkBg: "rgba(232,72,85,0.15)", key: "1" },
  { q: 3, label: "Qiyin",    icon: Minus,      color: "#F5A623", bg: "rgba(245,166,35,0.12)", darkBg: "rgba(245,166,35,0.15)", key: "2" },
  { q: 5, label: "Oson",    icon: CheckCircle2, color: "#0D9373", bg: "rgba(13,147,115,0.12)", darkBg: "rgba(13,147,115,0.15)", key: "3" },
];

export default function FlashcardsPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();

  const [cards, setCards]     = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex]     = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState("");

  // Session stats
  const [sessionStart]               = useState(Date.now());
  const [ratings, setRatings]        = useState<Record<number, number>>({});
  const [showShortcuts, setShowShortcuts] = useState(false);

  const getAuth = () => {
    try {
      const token = localStorage.getItem("lectio_token") || "";
      const user  = JSON.parse(localStorage.getItem("lectio_user") || "{}");
      return { token, id: user?.id ?? null };
    } catch { return { token: "", id: null }; }
  };

  useEffect(() => {
    const { token, id } = getAuth();
    if (!token || !id) {
      router.replace("/login");
      return;
    }
    fetch(`${API_URL}/api/sr/due-cards/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 401) { router.replace("/login"); return null; }
        return r.ok ? r.json() : null;
      })
      .then((d) => {
        setCards(d?.cards ?? []);
        setLoading(false);
      })
      .catch(() => { setError("Flashcardlarni yuklashda xatolik"); setLoading(false); });
  }, [router]);

  const handleRate = useCallback(async (quality: number) => {
    if (!flipped) return;
    const card = cards[index];
    const { token } = getAuth();

    // Fire-and-forget review submission with auth
    fetch(`${API_URL}/api/sr/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ card_id: card.id, quality }),
    }).catch(() => {});

    setRatings((r) => ({ ...r, [quality]: (r[quality] ?? 0) + 1 }));

    if (index + 1 >= cards.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setFlipped(false);
    }
  }, [flipped, cards, index]);

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); setFlipped((f) => !f); }
      if (flipped) {
        if (e.key === "1") handleRate(1);
        if (e.key === "2") handleRate(3);
        if (e.key === "3") handleRate(5);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [flipped, handleRate]);

  const bg       = isDark ? "#0A0A0F" : "#F8FAFC";
  const surface  = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const border   = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)";
  const fg       = isDark ? "#fff" : "#0A0A0F";
  const fgMuted  = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";

  // ── Loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin" size={32} style={{ color: "#F5A623" }} />
          <p className="text-sm" style={{ color: fgMuted }}>Flashcardlar yuklanmoqda…</p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: bg }}>
        <div className="text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="font-bold mb-2" style={{ color: fg }}>{error}</p>
          <button onClick={() => router.push("/student/dashboard")}
            className="mt-4 px-6 py-3 rounded-xl font-bold text-black bg-[#F5A623]">
            Orqaga
          </button>
        </div>
      </div>
    );
  }

  // ── Done screen ────────────────────────────────────────────────────
  if (done || cards.length === 0) {
    const elapsed   = Math.round((Date.now() - sessionStart) / 60000);
    const easy      = ratings[5] ?? 0;
    const medium    = ratings[3] ?? 0;
    const hard      = ratings[1] ?? 0;
    const total     = easy + medium + hard;
    const accuracy  = total > 0 ? Math.round((easy / total) * 100) : 0;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: bg }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="text-6xl mb-4">{cards.length === 0 ? "✅" : accuracy >= 70 ? "🏆" : "📚"}</div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: fg }}>
            {cards.length === 0 ? "Bugun takrorlash yo'q!" : "Sessiya tugadi!"}
          </h2>
          <p className="text-sm mb-8" style={{ color: fgMuted }}>
            {cards.length === 0
              ? "Barcha kartalaringiz kelajakda takrorlanadi."
              : `${total} ta karta ko'rib chiqildi · ${elapsed} daqiqa`}
          </p>

          {total > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { label: "Oson", val: easy,   color: "#0D9373", icon: "✅" },
                { label: "Qiyin", val: medium, color: "#F5A623", icon: "😅" },
                { label: "Bilmadim", val: hard, color: "#E84855", icon: "❌" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl p-4" style={{ background: surface, border: `1px solid ${border}` }}>
                  <div className="text-xl mb-1">{s.icon}</div>
                  <div className="text-lg font-black" style={{ color: s.color }}>{s.val}</div>
                  <div className="text-xs mt-0.5" style={{ color: fgMuted }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {total > 0 && (
            <div className="rounded-2xl p-4 mb-6 flex items-center justify-between"
              style={{ background: surface, border: `1px solid ${border}` }}>
              <div className="flex items-center gap-2" style={{ color: fgMuted }}>
                <Target size={16} style={{ color: "#1B4FD8" }} />
                <span className="text-sm">Aniqlik</span>
              </div>
              <span className="font-black text-lg" style={{ color: accuracy >= 70 ? "#0D9373" : "#F5A623" }}>{accuracy}%</span>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button onClick={() => router.push("/student/independent")}
              className="w-full py-3 rounded-xl font-bold text-black bg-[#F5A623] hover:bg-[#f7b955] transition">
              Yangi mavzu o'rganish
            </button>
            <button onClick={() => router.push("/student/dashboard")}
              className="w-full py-3 rounded-xl font-bold transition"
              style={{ background: surface, border: `1px solid ${border}`, color: fg }}>
              Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const card       = cards[index];
  const progress   = (index / cards.length) * 100;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: bg }}>
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 backdrop-blur-md"
        style={{ background: isDark ? "rgba(10,10,15,0.9)" : "rgba(248,250,252,0.9)", borderBottom: `1px solid ${border}` }}>
        <button onClick={() => router.push("/student/dashboard")}
          className="p-2 rounded-xl transition hover:scale-105"
          style={{ background: surface }}>
          <ArrowLeft size={18} style={{ color: fg }} />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-sm truncate" style={{ color: fg }}>Bugungi Takrorlash</h1>
          <p className="text-xs" style={{ color: fgMuted }}>
            {index + 1} / {cards.length} karta
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(ratings[5] ?? 0) + (ratings[3] ?? 0) + (ratings[1] ?? 0) > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
              style={{ background: "rgba(13,147,115,0.12)", color: "#0D9373" }}>
              <Trophy size={11} />
              {Math.round(((ratings[5] ?? 0) / ((ratings[5] ?? 0) + (ratings[3] ?? 0) + (ratings[1] ?? 0))) * 100)}%
            </div>
          )}
          <button onClick={() => setShowShortcuts((s) => !s)}
            className="p-2 rounded-xl transition"
            style={{ background: surface }}
            title="Klaviatura yorliqlari">
            <Keyboard size={15} style={{ color: fgMuted }} />
          </button>
          <button onClick={toggleTheme}
            className="p-2 rounded-xl transition"
            style={{ background: surface }}>
            {isDark ? <Sun size={15} style={{ color: "#F5A623" }} /> : <Moon size={15} style={{ color: "#1B4FD8" }} />}
          </button>
        </div>
      </header>

      {/* Keyboard shortcuts tooltip */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mx-4 mt-2 p-3 rounded-xl text-xs"
            style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", border: `1px solid ${border}`, color: fgMuted }}
          >
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">Space</kbd> Kartani aylantirish</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">1</kbd> Bilmadim</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">2</kbd> Qiyin</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">3</kbd> Oson</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar */}
      <div className="h-1 w-full" style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }}>
        <motion.div
          className="h-full bg-[#F5A623]"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 pb-8 max-w-lg mx-auto w-full">

        {card.subject && (
          <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: fgMuted }}>
            {card.subject}
          </p>
        )}

        {/* Flashcard */}
        <div className="w-full perspective-1000 mb-6" style={{ perspective: "1000px" }}>
          <motion.div
            key={index}
            onClick={() => setFlipped((f) => !f)}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            className="relative w-full min-h-60 cursor-pointer"
            style={{ transformStyle: "preserve-3d" }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center p-8 text-center"
              style={{
                background: surface,
                border: `1px solid ${border}`,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
            >
              <p className="text-[11px] font-bold uppercase tracking-widest mb-4 text-[#F5A623]">SAVOL</p>
              <p className="text-xl font-bold leading-relaxed" style={{ color: fg }}>{card.question}</p>
              {card.hint && (
                <p className="text-xs mt-5 px-3 py-2 rounded-xl" style={{ background: "rgba(245,166,35,0.1)", color: "#F5A623" }}>
                  💡 {card.hint}
                </p>
              )}
              <p className="text-xs mt-6" style={{ color: fgMuted }}>
                Bosing yoki <kbd className="px-1.5 py-0.5 rounded text-[10px]"
                  style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }}>Space</kbd> bosing
              </p>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center p-8 text-center"
              style={{
                background: isDark ? "rgba(13,147,115,0.08)" : "rgba(13,147,115,0.06)",
                border: `1px solid rgba(13,147,115,0.25)`,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <p className="text-[11px] font-bold uppercase tracking-widest mb-4 text-[#0D9373]">JAVOB</p>
              <p className="text-lg leading-relaxed font-medium" style={{ color: fg }}>{card.answer}</p>
            </div>
          </motion.div>
        </div>

        {/* Interval info */}
        <div className="flex items-center gap-4 mb-6">
          {[
            { label: "Interval", val: `${card.interval} kun` },
            { label: "Qiyinlik", val: card.difficulty?.toFixed(1) ?? "—" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-xs font-bold" style={{ color: fgMuted }}>{s.label}</p>
              <p className="text-sm font-black" style={{ color: fg }}>{s.val}</p>
            </div>
          ))}
          <div className="h-8 w-px" style={{ background: border }} />
          <div className="text-center">
            <p className="text-xs font-bold" style={{ color: fgMuted }}>Sessiya</p>
            <p className="text-sm font-black" style={{ color: fg }}>
              {(ratings[5] ?? 0) + (ratings[3] ?? 0) + (ratings[1] ?? 0)} baholandi
            </p>
          </div>
        </div>

        {/* Rating buttons */}
        <AnimatePresence>
          {flipped && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="w-full"
            >
              <p className="text-center text-sm mb-3" style={{ color: fgMuted }}>
                Qanchalik yaxshi bilasiz?
              </p>
              <div className="grid grid-cols-3 gap-3">
                {RATINGS.map(({ q, label, icon: Icon, color, bg: rateBg, darkBg, key }) => (
                  <motion.button
                    key={q}
                    onClick={() => handleRate(q)}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="flex flex-col items-center gap-2 py-4 rounded-2xl border font-bold text-sm transition-all"
                    style={{
                      background: isDark ? darkBg : rateBg,
                      border: `1px solid ${color}40`,
                      color,
                    }}
                  >
                    <Icon size={20} />
                    <span>{label}</span>
                    <span className="text-[10px] opacity-60 font-normal">Tugma: {key}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!flipped && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setFlipped(true)}
            className="mt-2 flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition"
            style={{ background: "rgba(245,166,35,0.12)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.25)" }}
          >
            <RotateCcw size={14} />
            Javobni ko'rish
          </motion.button>
        )}
      </div>

      {/* Bottom mini-stats */}
      <div className="border-t px-4 py-3 flex justify-center gap-6"
        style={{ borderColor: border, background: isDark ? "rgba(10,10,15,0.6)" : "rgba(248,250,252,0.8)" }}>
        {[
          { color: "#0D9373", count: ratings[5] ?? 0, label: "Oson" },
          { color: "#F5A623", count: ratings[3] ?? 0, label: "Qiyin" },
          { color: "#E84855", count: ratings[1] ?? 0, label: "Bilmadim" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
            <span className="text-xs font-bold" style={{ color: s.count > 0 ? s.color : fgMuted }}>
              {s.count} {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
