"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Zap, ArrowLeft, Send, Loader2, ChevronRight,
  RotateCcw, CheckCircle2, XCircle, Sun, Moon, Bot, BookOpen,
  Sparkles, Star, Trophy, Target, MessageSquare
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Mode = "menu" | "ai-cards" | "study" | "quiz" | "mentor";

interface Flashcard {
  front: string;
  back: string;
  hint?: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export default function IndependentStudyPage() {
  const router  = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const [mode, setMode] = useState<Mode>("menu");
  const [userName, setUserName] = useState("");

  // AI Cards state
  const [topic, setTopic]         = useState("");
  const [subject, setSubject]     = useState("");
  const [difficulty, setDiff]     = useState("medium");
  const [generating, setGen]      = useState(false);
  const [flashcards, setCards]    = useState<Flashcard[]>([]);
  const [savedIds, setSaved]      = useState<number[]>([]);
  const [genError, setGenErr]     = useState("");

  // Study state
  const [cardIndex, setCardIdx]   = useState(0);
  const [flipped, setFlipped]     = useState(false);

  // Quiz state
  const [qs, setQs]               = useState<QuizQuestion[]>([]);
  const [qIdx, setQIdx]           = useState(0);
  const [chosen, setChosen]       = useState<number | null>(null);
  const [results, setResults]     = useState<{ card_index: number; is_correct: boolean; time_ms: number }[]>([]);
  const [qStart, setQStart]       = useState(0);
  const [qDone, setQDone]         = useState(false);
  const [score, setScore]         = useState(0);
  const [genQuiz, setGenQuiz]     = useState(false);

  // Mentor state
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [msgs, setMsgs]           = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatIn, setChatIn]       = useState("");
  const [chatLoad, setChatLoad]   = useState(false);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("lectio_user") || "{}");
      if (u?.full_name) setUserName(u.full_name);
    } catch {}
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, chatLoad]);

  const getAuth = () => {
    try {
      const token = localStorage.getItem("lectio_token") || "";
      const u     = JSON.parse(localStorage.getItem("lectio_user") || "{}");
      return { token, id: u?.id ?? null, name: u?.full_name || "Talaba" };
    } catch { return { token: "", id: null, name: "Talaba" }; }
  };

  // ── Handlers ──────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!topic.trim()) { setGenErr("Mavzuni kiriting"); return; }
    setGen(true); setGenErr("");
    try {
      const { token, id } = getAuth();
      const res = await fetch(`${API_URL}/api/chain/flashcards`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ student_id: id || 0, topic: topic.trim(), subject: subject.trim() || topic.trim(), count: 6, difficulty, save_to_db: !!id }),
      });
      if (!res.ok) throw new Error("Xatolik");
      const data = await res.json();
      setCards(data.flashcards || []);
      setSaved(data.saved_ids || []);
      setCardIdx(0); setFlipped(false);
      setMode("study");
    } catch {
      setGenErr("Flashcardlar yaratishda xatolik. Backend ishlamoqdami?");
    } finally { setGen(false); }
  };

  const handleStartQuiz = async () => {
    setGenQuiz(true);
    try {
      const res = await fetch(`${API_URL}/api/chain/quiz-from-cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, flashcards, count: Math.min(flashcards.length, 5) }),
      });
      if (!res.ok) throw new Error("Xatolik");
      const data = await res.json();
      setQs(data.questions || []);
    } catch {
      setQs(flashcards.slice(0, 5).map((fc) => ({
        question: fc.front,
        options: [fc.back, "Bu noto'g'ri javob", "Boshqa variant", "Umuman boshqa narsa"],
        correct: 0,
        explanation: fc.back,
      })));
    } finally {
      setQIdx(0); setChosen(null); setResults([]); setQDone(false); setScore(0);
      setQStart(Date.now()); setMode("quiz"); setGenQuiz(false);
    }
  };

  const handleAnswer = (i: number) => {
    if (chosen !== null) return;
    const timeTaken = Date.now() - qStart;
    setChosen(i);
    const correct = i === qs[qIdx].correct;
    const newR = [...results, { card_index: qIdx, is_correct: correct, time_ms: timeTaken }];
    setResults(newR);
    if (correct) setScore((s) => s + 1);
    setTimeout(() => {
      if (qIdx + 1 >= qs.length) {
        setQDone(true);
        const { token, id } = getAuth();
        if (id && savedIds.length > 0) {
          fetch(`${API_URL}/api/chain/complete`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ student_id: id, topic, subject: subject || topic, quiz_results: newR, flashcard_ids: savedIds }),
          }).catch(() => {});
        }
      } else {
        setQIdx((n) => n + 1); setChosen(null); setQStart(Date.now());
      }
    }, 1200);
  };

  const handleChat = async () => {
    if (!chatIn.trim() || chatLoad) return;
    const msg = chatIn.trim();
    setChatIn("");
    setMsgs((p) => [...p, { role: "user", content: msg }]);
    setChatLoad(true);
    try {
      const { token, id, name } = getAuth();
      const res = await fetch(`${API_URL}/api/mentor/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ student_id: id || 0, message: msg, conversation_history: msgs.slice(-6), student_profile: { name, level: "Talaba", strong_subjects: [], weak_subjects: [], streak: 0, xp: 0, last_scores: {} } }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMsgs((p) => [...p, { role: "assistant", content: data.reply }]);
    } catch {
      setMsgs((p) => [...p, { role: "assistant", content: "Kechirasiz, hozir javob bera olmayapman. Qayta urinib ko'ring." }]);
    } finally { setChatLoad(false); }
  };

  // ── Theme tokens ──────────────────────────────────────────────────
  const bg      = isDark ? "#0A0A0F" : "#F8FAFC";
  const surf    = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const border  = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)";
  const fg      = isDark ? "#fff" : "#0A0A0F";
  const muted   = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const inputCls = isDark
    ? "bg-white/5 border-white/10 text-white placeholder-slate-500 focus:border-saffron"
    : "bg-black/[0.03] border-black/10 text-[#0A0A0F] placeholder-slate-400 focus:border-saffron";

  const MODES = [
    { id: "ai-cards", icon: Sparkles, label: "AI Flashcard Yaratish", desc: "Har qanday mavzu bo'yicha AI flashcard yaratsin", color: "var(--saffron)", hex: "#F5A623" },
    { id: "mentor",   icon: Bot,      label: "AI Mentor",              desc: "Savollaringizni AI ustoza bering",              color: "var(--amethyst)", hex: "#7B2FBE" },
    { id: "study",    icon: BookOpen, label: "Kartalarni O'qish",      desc: "Yaratilgan kartalarni ko'rib chiqish",          color: "var(--jade)", hex: "#0D9373", disabled: flashcards.length === 0 },
  ];

  const DIFFICULTIES = [["easy", "Oddiy 🌱"], ["medium", "O'rta 🌿"], ["hard", "Qiyin 🌳"]];

  const goBack = () => mode === "menu" ? router.push("/student/dashboard") : setMode("menu");

  const HEADER_LABELS: Record<Mode, string> = {
    menu:      "Mustaqil O'qish",
    "ai-cards":"AI Flashcard",
    study:     "Kartalar",
    quiz:      "Test",
    mentor:    "AI Mentor",
  };

  const firstName = userName.split(" ")[0];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: bg }}>
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 backdrop-blur-md"
        style={{ background: isDark ? "rgba(10,10,15,0.9)" : "rgba(248,250,252,0.9)", borderBottom: `1px solid ${border}` }}>
        <button onClick={goBack} className="p-2 rounded-xl transition" style={{ background: surf }}>
          <ArrowLeft size={18} style={{ color: fg }} />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-sm" style={{ color: fg }}>{HEADER_LABELS[mode]}</h1>
          {topic && mode !== "menu" && mode !== "ai-cards" && (
            <p className="text-xs truncate" style={{ color: muted }}>{topic}</p>
          )}
        </div>
        <button onClick={toggleTheme} className="p-2 rounded-xl transition" style={{ background: surf }}>
          {isDark ? <Sun size={15} style={{ color: "var(--saffron)" }} /> : <Moon size={15} style={{ color: "var(--lapis)" }} />}
        </button>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 pb-10">
        <AnimatePresence mode="wait">

          {/* ── MENU ──────────────────────────────────────────────── */}
          {mode === "menu" && (
            <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-6">

              {/* Hero card */}
              <div className="relative rounded-3xl p-6 mb-6 overflow-hidden text-center"
                style={{ background: isDark ? "rgba(245,166,35,0.05)" : "rgba(245,166,35,0.07)", border: "1px solid rgba(245,166,35,0.18)" }}>
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(245,166,35,0.15) 0%, transparent 70%)" }} />
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: "linear-gradient(135deg, var(--saffron), #e8941a)", boxShadow: "0 8px 24px rgba(245,166,35,0.35)" }}>
                    <BookOpen size={26} className="text-black" />
                  </div>
                  <h2 className="text-2xl font-bold mb-1" style={{ color: fg }}>
                    {firstName ? `${firstName}ning Studiosi` : "Mustaqil O'qish"}
                  </h2>
                  <p className="text-sm" style={{ color: muted }}>AI bilan o&apos;z tempingizda o&apos;rganing</p>
                </div>
              </div>

              {/* Session mini-stats — only when data exists */}
              {(flashcards.length > 0 || msgs.length > 0) && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-2 gap-3 mb-6">
                  <div className="rounded-2xl p-4 flex items-center gap-3"
                    style={{ background: "rgba(13,147,115,0.07)", border: "1px solid rgba(13,147,115,0.18)" }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "rgba(13,147,115,0.15)" }}>
                      <Star size={15} style={{ color: "var(--jade)" }} />
                    </div>
                    <div>
                      <p className="font-bold text-sm leading-tight" style={{ color: fg }}>{flashcards.length} karta</p>
                      <p className="text-xs" style={{ color: muted }}>Bu sessiya</p>
                    </div>
                  </div>
                  <div className="rounded-2xl p-4 flex items-center gap-3"
                    style={{ background: "rgba(123,47,190,0.07)", border: "1px solid rgba(123,47,190,0.18)" }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "rgba(123,47,190,0.15)" }}>
                      <MessageSquare size={15} style={{ color: "var(--amethyst)" }} />
                    </div>
                    <div>
                      <p className="font-bold text-sm leading-tight" style={{ color: fg }}>{msgs.length} xabar</p>
                      <p className="text-xs" style={{ color: muted }}>Mentor chat</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Mode cards */}
              <div className="space-y-3 mb-6">
                {MODES.map((m, i) => {
                  const Icon = m.icon;
                  return (
                    <motion.button
                      key={m.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      whileHover={!m.disabled ? { x: 4 } : {}}
                      whileTap={!m.disabled ? { scale: 0.98 } : {}}
                      onClick={() => !m.disabled && setMode(m.id as Mode)}
                      disabled={m.disabled}
                      className="w-full flex items-center gap-4 p-5 rounded-2xl text-left transition-all group"
                      style={{
                        background: m.disabled ? surf : `${m.hex}0D`,
                        border: `1px solid ${m.disabled ? border : `${m.hex}28`}`,
                        opacity: m.disabled ? 0.65 : 1,
                        cursor: m.disabled ? "not-allowed" : "pointer",
                      }}
                    >
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                        style={{ background: m.disabled ? (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)") : `${m.hex}22` }}>
                        <Icon size={22} style={{ color: m.disabled ? muted : m.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm mb-0.5" style={{ color: m.disabled ? muted : fg }}>{m.label}</p>
                        <p className="text-xs leading-relaxed" style={{ color: muted }}>{m.desc}</p>
                        {m.id === "study" && m.disabled && (
                          <p className="text-xs mt-1.5 font-semibold" style={{ color: "var(--saffron)" }}>
                            ↑ Avval "AI Flashcard Yaratish" ni bosing
                          </p>
                        )}
                        {m.id === "study" && !m.disabled && (
                          <p className="text-xs mt-1.5 font-semibold" style={{ color: "var(--jade)" }}>
                            ✓ {flashcards.length} ta karta tayyor
                          </p>
                        )}
                      </div>
                      {!m.disabled && (
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: `${m.hex}18` }}>
                          <ChevronRight size={15} style={{ color: m.color }} />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Tip / motivational card */}
              <div className="rounded-2xl p-4 flex items-start gap-3"
                style={{ background: isDark ? "rgba(27,79,216,0.06)" : "rgba(27,79,216,0.05)", border: "1px solid rgba(27,79,216,0.15)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "rgba(27,79,216,0.12)" }}>
                  <Brain size={16} style={{ color: "var(--lapis)" }} />
                </div>
                <div>
                  <p className="text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: "var(--lapis)" }}>Bilimga asoslangan maslahat</p>
                  <p className="text-sm leading-relaxed" style={{ color: muted }}>
                    Har kuni 20-30 daqiqa takrorlash bilimni 80% uzoqroq saqlab qolishga yordam beradi — Spaced Repetition effekti.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── AI CARD GENERATION ────────────────────────────────── */}
          {mode === "ai-cards" && (
            <motion.div key="ai-cards" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-6">
              <h2 className="text-lg font-bold mb-5 flex items-center gap-2" style={{ color: fg }}>
                <Sparkles size={18} style={{ color: "var(--saffron)" }} /> AI Flashcard Yaratish
              </h2>

              {genError && (
                <div className="p-3 mb-4 rounded-xl text-sm"
                  style={{ background: "rgba(232,72,85,0.1)", border: "1px solid rgba(232,72,85,0.2)", color: "var(--coral)" }}>
                  {genError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-sm mb-1.5 block font-medium" style={{ color: muted }}>Mavzu *</label>
                  <input
                    value={topic}
                    onChange={(e) => { setTopic(e.target.value); setGenErr(""); }}
                    placeholder="Masalan: Integral hisob, Binary Search, Fotosintez…"
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none transition text-sm ${inputCls}`}
                  />
                </div>
                <div>
                  <label className="text-sm mb-1.5 block font-medium" style={{ color: muted }}>Fan (ixtiyoriy)</label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Matematika, Biologiya, Ingliz tili…"
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none transition text-sm ${inputCls}`}
                  />
                </div>
                <div>
                  <label className="text-sm mb-2 block font-medium" style={{ color: muted }}>Murakkablik</label>
                  <div className="flex gap-2">
                    {DIFFICULTIES.map(([val, label]) => (
                      <button key={val} onClick={() => setDiff(val)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold transition"
                        style={difficulty === val
                          ? { background: "var(--saffron)", color: "#000" }
                          : { background: surf, color: muted, border: `1px solid ${border}` }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGenerate}
                  disabled={generating || !topic.trim()}
                  className="w-full py-4 rounded-xl font-bold text-black text-base disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "var(--saffron)" }}
                >
                  {generating
                    ? <><Loader2 size={18} className="animate-spin" /> AI yaratmoqda…</>
                    : <><Zap size={18} /> 6 ta Flashcard Yaratish</>}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── STUDY MODE ────────────────────────────────────────── */}
          {mode === "study" && flashcards.length > 0 && (
            <motion.div key="study" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium" style={{ color: muted }}>{cardIndex + 1} / {flashcards.length}</span>
                <div className="flex gap-2">
                  <button onClick={() => setMode("ai-cards")}
                    className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition font-medium"
                    style={{ background: surf, color: muted, border: `1px solid ${border}` }}>
                    <RotateCcw size={12} /> Yangi mavzu
                  </button>
                  <button onClick={handleStartQuiz} disabled={genQuiz}
                    className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold transition"
                    style={{ background: "rgba(13,147,115,0.15)", color: "var(--jade)", border: "1px solid rgba(13,147,115,0.25)" }}>
                    {genQuiz ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />} Test
                  </button>
                </div>
              </div>

              <div className="h-1.5 rounded-full mb-6 overflow-hidden" style={{ background: border }}>
                <div className="h-full rounded-full transition-all" style={{ background: "var(--saffron)", width: `${((cardIndex + 1) / flashcards.length) * 100}%` }} />
              </div>

              <motion.div
                key={cardIndex}
                onClick={() => setFlipped((f) => !f)}
                whileTap={{ scale: 0.98 }}
                className="min-h-60 rounded-2xl flex flex-col items-center justify-center text-center p-8 cursor-pointer transition-all select-none"
                style={{ background: surf, border: `1px solid ${border}` }}
              >
                <AnimatePresence mode="wait">
                  {!flipped ? (
                    <motion.div key="f" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <p className="text-xs text-saffron uppercase tracking-widest mb-3 font-bold">SAVOL</p>
                      <p className="text-xl font-bold leading-relaxed" style={{ color: fg }}>{flashcards[cardIndex].front}</p>
                      {flashcards[cardIndex].hint && (
                        <p className="text-sm mt-4" style={{ color: muted }}>💡 {flashcards[cardIndex].hint}</p>
                      )}
                      <p className="text-xs mt-6" style={{ color: muted }}>Javobni ko&apos;rish uchun bosing</p>
                    </motion.div>
                  ) : (
                    <motion.div key="b" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <p className="text-xs text-jade uppercase tracking-widest mb-3 font-bold">JAVOB</p>
                      <p className="text-lg leading-relaxed" style={{ color: fg }}>{flashcards[cardIndex].back}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <div className="flex gap-3 mt-4">
                {[
                  { label: "← Oldingi", action: () => { setCardIdx((i) => Math.max(0, i - 1)); setFlipped(false); }, disabled: cardIndex === 0 },
                  { label: "Keyingi →", action: () => { setCardIdx((i) => Math.min(flashcards.length - 1, i + 1)); setFlipped(false); }, disabled: cardIndex === flashcards.length - 1 },
                ].map(({ label, action, disabled }) => (
                  <button key={label} onClick={action} disabled={disabled}
                    className="flex-1 py-3 rounded-xl font-bold transition disabled:opacity-30"
                    style={{ background: surf, border: `1px solid ${border}`, color: fg }}>
                    {label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── QUIZ MODE ─────────────────────────────────────────── */}
          {mode === "quiz" && qs.length > 0 && (
            <motion.div key="quiz" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-6">
              {!qDone ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm" style={{ color: muted }}>Savol {qIdx + 1}/{qs.length}</span>
                    <span className="text-sm font-bold text-saffron">{score} to&apos;g&apos;ri</span>
                  </div>
                  <div className="h-1.5 rounded-full mb-5 overflow-hidden" style={{ background: border }}>
                    <div className="h-full rounded-full transition-all" style={{ background: "var(--jade)", width: `${(qIdx / qs.length) * 100}%` }} />
                  </div>

                  <div className="rounded-2xl p-5 mb-4" style={{ background: surf, border: `1px solid ${border}` }}>
                    <p className="font-bold text-lg leading-relaxed" style={{ color: fg }}>{qs[qIdx].question}</p>
                  </div>

                  <div className="space-y-2">
                    {qs[qIdx].options.map((opt, i) => {
                      const sel = chosen === i;
                      const cor = qs[qIdx].correct === i;
                      let bgCol = surf, bdrCol = border, clrCol = fg;
                      if (chosen !== null) {
                        if (cor)       { bgCol = "rgba(13,147,115,0.12)"; bdrCol = "rgba(13,147,115,0.4)"; clrCol = "var(--jade)"; }
                        else if (sel)  { bgCol = "rgba(232,72,85,0.12)";  bdrCol = "rgba(232,72,85,0.4)";  clrCol = "var(--coral)"; }
                      }
                      return (
                        <button key={i} onClick={() => handleAnswer(i)} disabled={chosen !== null}
                          className="w-full flex items-center gap-3 p-4 rounded-xl transition-all text-left disabled:cursor-not-allowed"
                          style={{ background: bgCol, border: `1px solid ${bdrCol}` }}>
                          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                            style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)", color: fg }}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="flex-1 text-sm" style={{ color: clrCol }}>{opt}</span>
                          {chosen !== null && cor && <CheckCircle2 size={16} className="text-jade shrink-0" />}
                          {chosen !== null && sel && !cor && <XCircle size={16} className="text-coral shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {chosen !== null && qs[qIdx].explanation && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="mt-3 p-3 rounded-xl text-sm"
                      style={{ background: "rgba(27,79,216,0.1)", border: "1px solid rgba(27,79,216,0.2)", color: isDark ? "#93c5fd" : "var(--lapis)" }}>
                      💡 {qs[qIdx].explanation}
                    </motion.div>
                  )}
                </>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center mt-8">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                    style={{ background: score >= qs.length * 0.8 ? "rgba(245,166,35,0.15)" : "rgba(27,79,216,0.12)", border: `2px solid ${score >= qs.length * 0.8 ? "rgba(245,166,35,0.4)" : "rgba(27,79,216,0.3)"}` }}>
                    <Trophy size={32} style={{ color: score >= qs.length * 0.8 ? "var(--saffron)" : "var(--lapis)" }} />
                  </div>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: fg }}>Test tugadi!</h2>
                  <p className="text-4xl font-bold mb-1 text-saffron">{score}/{qs.length}</p>
                  <p className="text-sm mb-8" style={{ color: muted }}>{Math.round((score / qs.length) * 100)}% to&apos;g&apos;ri</p>
                  <div className="flex flex-col gap-3">
                    <button onClick={() => { setMode("study"); setCardIdx(0); setFlipped(false); }}
                      className="py-3 rounded-xl font-bold transition"
                      style={{ background: "rgba(13,147,115,0.15)", color: "var(--jade)", border: "1px solid rgba(13,147,115,0.3)" }}>
                      📚 Kartalarni qayta o&apos;qish
                    </button>
                    <button onClick={() => setMode("ai-cards")}
                      className="py-3 rounded-xl font-bold text-black transition hover:brightness-105"
                      style={{ background: "var(--saffron)" }}>
                      ✨ Yangi mavzu o&apos;rganish
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── AI MENTOR ─────────────────────────────────────────── */}
          {mode === "mentor" && (
            <motion.div key="mentor" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col pt-4" style={{ height: "calc(100vh - 120px)" }}>
              <div className="flex-1 overflow-y-auto space-y-3 pb-4">
                {msgs.length === 0 && (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      style={{ background: "rgba(123,47,190,0.12)", border: "1px solid rgba(123,47,190,0.2)" }}>
                      <Bot size={28} style={{ color: "var(--amethyst)" }} />
                    </div>
                    <p className="font-bold text-lg mb-1" style={{ color: fg }}>AI Mentor</p>
                    <p className="text-sm mb-5" style={{ color: muted }}>Har qanday savolingizni bering</p>
                    <div className="flex flex-col gap-2 max-w-xs mx-auto">
                      {["Integral nima?", "Binary search tushuntir", "Fotosintez jarayonini izohla"].map((q) => (
                        <button key={q} onClick={() => setChatIn(q)}
                          className="text-sm px-4 py-2.5 rounded-xl transition text-left"
                          style={{ background: surf, border: `1px solid ${border}`, color: fg }}>
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {msgs.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      m.role === "user" ? "text-black rounded-br-none" : ""
                    }`}
                      style={m.role === "user"
                        ? { background: "var(--saffron)" }
                        : { background: surf, border: `1px solid ${border}`, color: fg, borderRadius: "16px 16px 16px 4px" }}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {chatLoad && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-none px-4 py-3" style={{ background: surf }}>
                      <div className="flex gap-1">
                        {[0, 0.2, 0.4].map((d, i) => (
                          <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: d }}
                            className="w-2 h-2 rounded-full" style={{ background: muted }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              <div className="flex gap-2 pt-3" style={{ borderTop: `1px solid ${border}` }}>
                <input
                  value={chatIn}
                  onChange={(e) => setChatIn(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleChat()}
                  placeholder="Savolingizni yozing…"
                  className={`flex-1 px-4 py-3 rounded-xl border focus:outline-none transition text-sm ${inputCls}`}
                />
                <button onClick={handleChat} disabled={!chatIn.trim() || chatLoad}
                  className="p-3 rounded-xl font-bold text-black disabled:opacity-50 transition hover:brightness-105"
                  style={{ background: "var(--saffron)" }}>
                  <Send size={18} />
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
