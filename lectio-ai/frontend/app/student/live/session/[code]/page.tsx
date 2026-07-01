"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, HelpCircle, ThumbsUp,
  AlertTriangle, FileText, X, Send,
  Users, Wifi, Clock, BookOpen
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

const MOCK_SLIDES = [
  { id: 1, title: "Kirish: Kvant mexanikasi",    content: "Kvant mexanikasi — mikroolamdagi zarrachalar xatti-harakatini o'rganuvchi fizika bo'limi.",     bg: "from-lapis/80 to-amethyst/60"   },
  { id: 2, title: "Tarix va kelib chiqishi",      content: "1900-yilda Max Planck kvant gipotezasini taqdim etdi. Bu zamonaviy fizikaning boshlanishi bo'ldi.", bg: "from-amethyst/70 to-midnight/90" },
  { id: 3, title: "Heyzenberg noaniqlik prinsipi",content: "Zarrachaning holati va tezligini bir vaqtda aniq o'lchab bo'lmaydi: Δx · Δp ≥ ℏ/2",              bg: "from-lapis/60 to-jade/70"       },
  { id: 4, title: "To'lqin-zarra ikkiligi",       content: "Yorug'lik ham to'lqin, ham zarra xususiyatlarini namoyon etadi. λ = h/p",                         bg: "from-jade/70 to-lapis/60"       },
  { id: 5, title: "Shrödinger tenglamasi",        content: "iℏ ∂ψ/∂t = Ĥψ — kvant holatini tasvirlovchi asosiy tenglama.",                                    bg: "from-amethyst/60 to-coral/50"   },
];

const REACTIONS = [
  { emoji: "💡", label: "Tushundim", id: "lightbulb" },
  { emoji: "👍", label: "Zo'r",     id: "thumbsup"  },
  { emoji: "❓", label: "Savol",    id: "question"  },
  { emoji: "🔥", label: "Ajoyib",   id: "fire"      },
];

type Note = { id: number; text: string; slideId: number; slideTitle: string; time: string };

export default function LiveSessionPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { success, info } = useToast();

  const [currentSlide, setCurrentSlide]     = useState(0);
  const [isNotesOpen, setIsNotesOpen]       = useState(false);
  const [noteText, setNoteText]             = useState("");
  const [notes, setNotes]                   = useState<Note[]>([]);
  const [confusionCount, setConfusionCount] = useState(0);
  const [myConfused, setMyConfused]         = useState(false);
  const [reactionStream, setReactionStream] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const [questions, setQuestions]           = useState([
    { id: 1, text: "Kvant entanglement nima degani?",       votes: 5, time: "10:03" },
    { id: 2, text: "Bu fizikaning qaysi sohasiga kiradi?",  votes: 3, time: "10:07" },
  ]);
  const [questionText, setQuestionText] = useState("");
  const [showQA, setShowQA]             = useState(false);
  const [elapsed, setElapsed]           = useState(0);
  const [studentCount]                  = useState(47);
  const reactionIdRef = useRef(0);
  const noteIdRef     = useRef(1);

  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (reactionStream.length === 0) return;
    const t = setTimeout(() => setReactionStream(r => r.slice(1)), 2000);
    return () => clearTimeout(t);
  }, [reactionStream]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    return `${m}:${(s % 60).toString().padStart(2, "0")}`;
  };

  const sendReaction = (emoji: string) => {
    const id = reactionIdRef.current++;
    setReactionStream(r => [...r, { id, emoji, x: Math.random() * 80 + 10 }]);
    info("Reaksiya yuborildi", `${emoji} reaksiyangiz professor ekranida ko'rinadi`);
  };

  const toggleConfusion = () => {
    if (myConfused) {
      setMyConfused(false);
      setConfusionCount(c => Math.max(0, c - 1));
    } else {
      setMyConfused(true);
      setConfusionCount(c => c + 1);
      info("Tushunmadim belgisi yuborildi", "Professor siz kabi tushunmagan o'quvchilar sonini ko'radi");
    }
  };

  const addNote = () => {
    if (!noteText.trim()) return;
    const slide = MOCK_SLIDES[currentSlide];
    setNotes(n => [...n, {
      id: noteIdRef.current++,
      text: noteText.trim(),
      slideId: slide.id,
      slideTitle: slide.title,
      time: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
    }]);
    setNoteText("");
    success("Eslatma saqlandi", `Eslatma "${slide.title}" slaydiga bog'landi`);
  };

  const submitQuestion = () => {
    if (!questionText.trim()) return;
    setQuestions(q => [...q, {
      id: Date.now(), text: questionText.trim(), votes: 0,
      time: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
    }]);
    setQuestionText("");
    success("Savol yuborildi", "Savolingiz anonim ravishda professor devorida ko'rinadi");
  };

  const slide = MOCK_SLIDES[currentSlide];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0"
        style={{ background: "rgba(10,10,15,0.95)", backdropFilter: "blur(20px)" }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" style={{ color: "var(--muted-foreground)" }}>
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-jade animate-pulse" />
            <span className="font-mono font-bold text-saffron text-sm">{String(code).toUpperCase()}</span>
          </div>
          <div className="hidden md:flex items-center gap-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
            <Users size={14} />
            <span>{studentCount} o&apos;quvchi</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Live badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: "rgba(13,147,115,0.18)", color: "var(--jade)" }}
          >
            <Wifi size={12} /> JONLI EFIR
          </div>

          {/* Timer */}
          <div className="flex items-center gap-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
            <Clock size={14} />
            <span className="font-mono">{formatTime(elapsed)}</span>
          </div>

          {/* Notes toggle */}
          <button
            onClick={() => setIsNotesOpen(o => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{
              background: isNotesOpen ? "rgba(27,79,216,0.2)" : "rgba(255,255,255,0.06)",
              color: isNotesOpen ? "var(--lapis)" : "var(--muted-foreground)",
            }}
          >
            <FileText size={14} />
            <span className="hidden md:inline">Eslatmalar</span>
            {notes.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-lapis text-white text-xs flex items-center justify-center">
                {notes.length}
              </span>
            )}
          </button>

          {/* Q&A toggle */}
          <button
            onClick={() => setShowQA(o => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{
              background: showQA ? "rgba(123,47,190,0.2)" : "rgba(255,255,255,0.06)",
              color: showQA ? "var(--amethyst)" : "var(--muted-foreground)",
            }}
          >
            <HelpCircle size={14} />
            <span className="hidden md:inline">Savollar</span>
            {questions.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amethyst text-white text-xs flex items-center justify-center">
                {questions.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Slide area */}
        <div className="flex-1 flex flex-col relative">
          {/* Slide */}
          <div className="flex-1 relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3 }}
                className={`absolute inset-0 bg-gradient-to-br ${slide.bg} flex flex-col items-center justify-center p-12 text-center`}
              >
                <div className="max-w-3xl mx-auto">
                  <div className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">
                    Slayd {currentSlide + 1} / {MOCK_SLIDES.length}
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold font-display mb-6 leading-tight text-white">{slide.title}</h2>
                  <p className="text-lg md:text-xl text-white/80 leading-relaxed">{slide.content}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Floating reactions */}
            <div className="absolute bottom-4 left-0 w-full pointer-events-none overflow-hidden h-24">
              <AnimatePresence>
                {reactionStream.map(r => (
                  <motion.div
                    key={r.id}
                    initial={{ y: 80, opacity: 1 }}
                    animate={{ y: -40, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2 }}
                    className="absolute text-2xl"
                    style={{ left: `${r.x}%` }}
                  >
                    {r.emoji}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Slide navigation controls */}
          <div
            className="flex items-center justify-between px-6 py-3 border-t border-white/10"
            style={{ background: "rgba(10,10,15,0.9)" }}
          >
            <button
              onClick={() => setCurrentSlide(s => Math.max(0, s - 1))}
              disabled={currentSlide === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-30 transition-all hover:bg-white/10"
            >
              <ChevronLeft size={18} /> Oldingi
            </button>

            <div className="flex gap-1.5">
              {MOCK_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: i === currentSlide ? 24 : 8,
                    background: i === currentSlide ? "var(--saffron)" : "rgba(255,255,255,0.2)",
                  }}
                />
              ))}
            </div>

            {currentSlide < MOCK_SLIDES.length - 1 ? (
              <button
                onClick={() => setCurrentSlide(s => Math.min(MOCK_SLIDES.length - 1, s + 1))}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all hover:bg-white/10"
              >
                Keyingi <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={() => router.push(`/student/live/session/${code}/summary`)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all text-saffron hover:bg-saffron/10"
              >
                Dars yakunlandi <BookOpen size={18} />
              </button>
            )}
          </div>

          {/* Bottom action bar */}
          <div
            className="flex items-center justify-center gap-3 px-6 py-3 border-t border-white/10"
            style={{ background: "rgba(10,10,15,0.95)" }}
          >
            {/* Confusion button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleConfusion}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
              style={
                myConfused
                  ? { background: "rgba(232,72,85,0.2)", color: "var(--coral)", border: "1px solid rgba(232,72,85,0.35)" }
                  : { background: "rgba(255,255,255,0.06)", color: "var(--muted-foreground)" }
              }
            >
              <AlertTriangle size={16} />
              {myConfused ? "Tushundim!" : "Tushunmadim"}
              {confusionCount > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded text-xs"
                  style={{ background: "rgba(232,72,85,0.3)" }}
                >
                  {confusionCount}
                </span>
              )}
            </motion.button>

            {/* Reaction buttons */}
            {REACTIONS.map(r => (
              <motion.button
                key={r.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => sendReaction(r.emoji)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all hover:bg-white/10"
                title={r.label}
              >
                {r.emoji}
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Notes Panel ────────────────────────────────────────── */}
        <AnimatePresence>
          {isNotesOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-shrink-0 border-l border-white/10 flex flex-col overflow-hidden"
              style={{ background: "var(--card)" }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2 font-bold">
                  <FileText size={16} style={{ color: "var(--lapis)" }} />
                  Eslatmalarim
                  <span className="text-xs font-normal" style={{ color: "var(--muted-foreground)" }}>
                    ({notes.length} ta)
                  </span>
                </div>
                <button onClick={() => setIsNotesOpen(false)} className="p-1 rounded-lg hover:bg-white/10 transition-colors" style={{ color: "var(--muted-foreground)" }}>
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {notes.length === 0 ? (
                  <div className="text-center py-8 text-sm" style={{ color: "var(--muted-foreground)" }}>
                    <FileText size={32} className="mx-auto mb-2 opacity-30" />
                    <p>Hali eslatma yo&apos;q</p>
                    <p className="text-xs mt-1">Yozing — AI har bir eslatmani mavzuga bog&apos;laydi</p>
                  </div>
                ) : (
                  notes.map(note => (
                    <div
                      key={note.id}
                      className="rounded-xl p-3 border border-lapis/20"
                      style={{ background: "rgba(27,79,216,0.08)" }}
                    >
                      <div className="text-xs font-medium mb-1 flex justify-between text-lapis">
                        <span>📌 {note.slideTitle}</span>
                        <span style={{ color: "var(--muted-foreground)" }}>{note.time}</span>
                      </div>
                      <p className="text-sm" style={{ color: "var(--foreground)" }}>{note.text}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-white/10">
                <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
                  Hozir: <span className="text-lapis font-medium">{slide.title}</span>
                </div>
                <div className="flex gap-2">
                  <textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addNote(); } }}
                    placeholder="Eslatma yozing... (Enter)"
                    rows={3}
                    className="flex-1 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm placeholder-slate-500 focus:outline-none focus:border-lapis/40 resize-none"
                    style={{ color: "var(--foreground)" }}
                  />
                  <button
                    onClick={addNote}
                    disabled={!noteText.trim()}
                    className="px-3 rounded-xl text-white font-bold disabled:opacity-40 transition-all flex items-center"
                    style={{ background: "linear-gradient(135deg,var(--lapis),#2563eb)" }}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Q&A Panel ──────────────────────────────────────────── */}
        <AnimatePresence>
          {showQA && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-shrink-0 border-l border-white/10 flex flex-col overflow-hidden"
              style={{ background: "var(--card)" }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2 font-bold">
                  <HelpCircle size={16} style={{ color: "var(--amethyst)" }} />
                  Savollar devori
                  <span className="text-xs font-normal" style={{ color: "var(--muted-foreground)" }}>
                    ({questions.length})
                  </span>
                </div>
                <button onClick={() => setShowQA(false)} className="p-1 rounded-lg hover:bg-white/10 transition-colors" style={{ color: "var(--muted-foreground)" }}>
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {questions.sort((a, b) => b.votes - a.votes).map(q => (
                  <div
                    key={q.id}
                    className="rounded-xl p-3 border border-amethyst/20"
                    style={{ background: "rgba(123,47,190,0.08)" }}
                  >
                    <p className="text-sm mb-2" style={{ color: "var(--foreground)" }}>{q.text}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{q.time}</span>
                      <button
                        onClick={() => setQuestions(prev => prev.map(qu => qu.id === q.id ? { ...qu, votes: qu.votes + 1 } : qu))}
                        className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg transition-all hover:bg-amethyst/20"
                        style={{ color: "var(--amethyst)" }}
                      >
                        <ThumbsUp size={12} /> {q.votes}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-white/10">
                <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
                  Savolingiz anonim yuboriladi
                </p>
                <div className="flex gap-2">
                  <input
                    value={questionText}
                    onChange={e => setQuestionText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && submitQuestion()}
                    placeholder="Savolingizni yozing..."
                    className="flex-1 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm placeholder-slate-500 focus:outline-none focus:border-amethyst/40"
                    style={{ color: "var(--foreground)" }}
                  />
                  <button
                    onClick={submitQuestion}
                    disabled={!questionText.trim()}
                    className="px-3 rounded-xl text-white font-bold disabled:opacity-40 transition-all"
                    style={{ background: "linear-gradient(135deg,var(--amethyst),#9333ea)" }}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
