"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, MessageCircle, Lightbulb, ThumbsUp,
  HelpCircle, Flame, AlertTriangle, FileText, X, Send,
  Users, Wifi, Clock, Maximize2, BookOpen
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

const MOCK_SLIDES = [
  { id: 1, title: "Kirish: Kvant mexanikasi", content: "Kvant mexanikasi — mikroolamdagi zarrachalar xatti-harakatini o'rganuvchi fizika bo'limi.", bg: "from-indigo-900 to-purple-900" },
  { id: 2, title: "Tarix va kelib chiqishi", content: "1900-yilda Max Planck kvant gipotezasini taqdim etdi. Bu zamonaviy fizikaning boshlanishi bo'ldi.", bg: "from-blue-900 to-indigo-900" },
  { id: 3, title: "Heyzenberg noaniqlik prinsipi", content: "Zarrachaning holati va tezligini bir vaqtda aniq o'lchab bo'lmaydi: Δx · Δp ≥ ℏ/2", bg: "from-purple-900 to-pink-900" },
  { id: 4, title: "To'lqin-zarra ikkiligi", content: "Yorug'lik ham to'lqin, ham zarra xususiyatlarini namoyon etadi. De Broglie to'lqin uzunligi: λ = h/p", bg: "from-cyan-900 to-blue-900" },
  { id: 5, title: "Shrödinger tenglamasi", content: "iℏ ∂ψ/∂t = Ĥψ — kvant holatini tasvirlovchi asosiy tenglama.", bg: "from-emerald-900 to-teal-900" },
];

const REACTIONS = [
  { emoji: "💡", label: "Tushundim", id: "lightbulb" },
  { emoji: "👍", label: "Zo'r", id: "thumbsup" },
  { emoji: "❓", label: "Savol", id: "question" },
  { emoji: "🔥", label: "Ajoyib", id: "fire" },
];

type Note = { id: number; text: string; slideId: number; slideTitle: string; time: string };

export default function LiveSessionPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { success, info } = useToast();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [confusionCount, setConfusionCount] = useState(0);
  const [myConfused, setMyConfused] = useState(false);
  const [reactionStream, setReactionStream] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const [questions, setQuestions] = useState<{ id: number; text: string; votes: number; time: string }[]>([
    { id: 1, text: "Kvant entanglement nima degani?", votes: 5, time: "10:03" },
    { id: 2, text: "Bu fizikaning qaysi sohasiga kiradi?", votes: 3, time: "10:07" },
  ]);
  const [questionText, setQuestionText] = useState("");
  const [showQA, setShowQA] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [studentCount] = useState(47);
  const reactionIdRef = useRef(0);
  const noteIdRef = useRef(1);

  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-remove reactions
  useEffect(() => {
    if (reactionStream.length === 0) return;
    const t = setTimeout(() => setReactionStream(r => r.slice(1)), 2000);
    return () => clearTimeout(t);
  }, [reactionStream]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
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
      id: Date.now(),
      text: questionText.trim(),
      votes: 0,
      time: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
    }]);
    setQuestionText("");
    success("Savol yuborildi", "Savolingiz anonim ravishda professor devorida ko'rinadi");
  };

  const voteQuestion = (id: number) => {
    setQuestions(q => q.map(qu => qu.id === id ? { ...qu, votes: qu.votes + 1 } : qu));
  };

  const endLesson = () => {
    router.push(`/student/live/session/${code}/summary`);
  };

  const slide = MOCK_SLIDES[currentSlide];

  return (
    <div className="min-h-screen text-white flex flex-col" style={{ background: "#0A0A0F" }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0" style={{ background: "rgba(10,10,20,0.95)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="font-mono font-bold text-yellow-400 text-sm">{String(code).toUpperCase()}</span>
          </div>
          <div className="hidden md:flex items-center gap-1 text-slate-400 text-sm">
            <Users size={14} />
            <span>{studentCount} o'quvchi</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}>
            <Wifi size={12} />
            JONLI EFIR
          </div>
          <div className="flex items-center gap-1 text-slate-400 text-sm">
            <Clock size={14} />
            <span className="font-mono">{formatTime(elapsed)}</span>
          </div>
          <button
            onClick={() => setIsNotesOpen(o => !o)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isNotesOpen ? "bg-blue-500/20 text-blue-400" : "bg-white/8 text-slate-400 hover:text-white"}`}
          >
            <FileText size={14} />
            <span className="hidden md:inline">Eslatmalar</span>
            {notes.length > 0 && <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">{notes.length}</span>}
          </button>
          <button
            onClick={() => setShowQA(o => !o)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showQA ? "bg-purple-500/20 text-purple-400" : "bg-white/8 text-slate-400 hover:text-white"}`}
          >
            <HelpCircle size={14} />
            <span className="hidden md:inline">Savollar</span>
            {questions.length > 0 && <span className="w-4 h-4 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">{questions.length}</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Slide Area */}
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
                  <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">{slide.title}</h2>
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

          {/* Slide Controls */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-white/10" style={{ background: "rgba(10,10,20,0.9)" }}>
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
                  className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? "w-6 bg-yellow-400" : "bg-white/20 hover:bg-white/40"}`}
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
                onClick={endLesson}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all text-yellow-400 hover:bg-yellow-400/10"
              >
                Dars yakunlandi <BookOpen size={18} />
              </button>
            )}
          </div>

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-center gap-3 px-6 py-3 border-t border-white/10" style={{ background: "rgba(10,10,20,0.95)" }}>
            {/* Confusion */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleConfusion}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${myConfused ? "bg-orange-500/25 text-orange-400 border border-orange-500/40" : "bg-white/8 text-slate-400 hover:text-orange-400 hover:bg-orange-500/10"}`}
            >
              <AlertTriangle size={16} />
              {myConfused ? "Tushundim!" : "Tushunmadim"}
              {confusionCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: "rgba(249,115,22,0.3)" }}>
                  {confusionCount}
                </span>
              )}
            </motion.button>

            {/* Reactions */}
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

        {/* Notes Panel */}
        <AnimatePresence>
          {isNotesOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-shrink-0 border-l border-white/10 flex flex-col overflow-hidden"
              style={{ background: "rgba(15,15,30,0.98)" }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2 font-bold">
                  <FileText size={16} style={{ color: "#3B82F6" }} />
                  Eslatmalarim
                  <span className="text-xs text-slate-500 font-normal">({notes.length} ta)</span>
                </div>
                <button onClick={() => setIsNotesOpen(false)} className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {notes.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    <FileText size={32} className="mx-auto mb-2 opacity-30" />
                    <p>Hali eslatma yo'q</p>
                    <p className="text-xs mt-1">Yozing — AI har bir eslatmani mavzuga bog'laydi</p>
                  </div>
                ) : (
                  notes.map(note => (
                    <div key={note.id} className="rounded-xl p-3 border border-white/8" style={{ background: "rgba(59,130,246,0.08)" }}>
                      <div className="text-xs text-blue-400 font-medium mb-1 flex justify-between">
                        <span>📌 {note.slideTitle}</span>
                        <span className="text-slate-500">{note.time}</span>
                      </div>
                      <p className="text-sm text-slate-200">{note.text}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-white/10">
                <div className="text-xs text-slate-500 mb-2">
                  Hozir: <span className="text-blue-400 font-medium">{slide.title}</span>
                </div>
                <div className="flex gap-2">
                  <textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addNote(); } }}
                    placeholder="Eslatma yozing... (Enter tugmasi)"
                    rows={3}
                    className="flex-1 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-400/50 resize-none"
                  />
                  <button
                    onClick={addNote}
                    disabled={!noteText.trim()}
                    className="px-3 rounded-xl text-white font-bold disabled:opacity-40 transition-all flex items-center"
                    style={{ background: "linear-gradient(135deg,#1B4FD8,#3B82F6)" }}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Q&A Panel */}
        <AnimatePresence>
          {showQA && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-shrink-0 border-l border-white/10 flex flex-col overflow-hidden"
              style={{ background: "rgba(15,15,30,0.98)" }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2 font-bold">
                  <HelpCircle size={16} style={{ color: "#8B5CF6" }} />
                  Savollar devori
                  <span className="text-xs text-slate-500 font-normal">({questions.length})</span>
                </div>
                <button onClick={() => setShowQA(false)} className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {questions.sort((a, b) => b.votes - a.votes).map(q => (
                  <div key={q.id} className="rounded-xl p-3 border border-white/8" style={{ background: "rgba(139,92,246,0.08)" }}>
                    <p className="text-sm text-slate-200 mb-2">{q.text}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">{q.time}</span>
                      <button
                        onClick={() => voteQuestion(q.id)}
                        className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg transition-all hover:bg-purple-500/20"
                        style={{ color: "#8B5CF6" }}
                      >
                        <ThumbsUp size={12} /> {q.votes}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-white/10">
                <p className="text-xs text-slate-500 mb-2">Savolingiz anonim yuboriladi</p>
                <div className="flex gap-2">
                  <input
                    value={questionText}
                    onChange={e => setQuestionText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && submitQuestion()}
                    placeholder="Savolingizni yozing..."
                    className="flex-1 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-400/50"
                  />
                  <button
                    onClick={submitQuestion}
                    disabled={!questionText.trim()}
                    className="px-3 rounded-xl text-white font-bold disabled:opacity-40 transition-all"
                    style={{ background: "linear-gradient(135deg,#7C3AED,#8B5CF6)" }}
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
