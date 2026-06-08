"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, BookOpen, Zap, ArrowLeft, Send, Loader2, ChevronRight, RotateCcw, CheckCircle2, XCircle } from "lucide-react";

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
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("menu");

  // AI Cards generation
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [generating, setGenerating] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [genError, setGenError] = useState("");

  // Study mode
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Quiz mode
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [quizResults, setQuizResults] = useState<{ card_index: number; is_correct: boolean; time_ms: number }[]>([]);
  const [quizStartTime, setQuizStartTime] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  // Mentor chat
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const getStudentId = () => {
    try { return JSON.parse(localStorage.getItem("lectio_user") || "{}").id || null; } catch { return null; }
  };

  // Generate flashcards
  const handleGenerateCards = async () => {
    if (!topic.trim()) { setGenError("Mavzuni kiriting"); return; }
    setGenerating(true);
    setGenError("");
    try {
      const studentId = getStudentId();
      const res = await fetch(`${API_URL}/api/chain/flashcards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId || 0,
          topic: topic.trim(),
          subject: subject.trim() || topic.trim(),
          count: 6,
          difficulty,
          save_to_db: !!studentId,
        }),
      });
      if (!res.ok) throw new Error("Xatolik");
      const data = await res.json();
      setFlashcards(data.flashcards || []);
      setSavedIds(data.saved_ids || []);
      setCardIndex(0);
      setFlipped(false);
      setMode("study");
    } catch {
      setGenError("Flashcardlar yaratishda xatolik. Backend ishlamoqdami?");
    } finally {
      setGenerating(false);
    }
  };

  // Generate quiz from flashcards
  const handleStartQuiz = async () => {
    setGeneratingQuiz(true);
    try {
      const res = await fetch(`${API_URL}/api/chain/quiz-from-cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, flashcards, count: Math.min(flashcards.length, 5) }),
      });
      if (!res.ok) throw new Error("Xatolik");
      const data = await res.json();
      setQuizQuestions(data.questions || []);
      setQuizIndex(0);
      setSelectedOpt(null);
      setQuizResults([]);
      setQuizDone(false);
      setQuizScore(0);
      setQuizStartTime(Date.now());
      setMode("quiz");
    } catch {
      // Fallback: create simple quiz from flashcards
      const questions: QuizQuestion[] = flashcards.slice(0, 5).map((fc) => ({
        question: fc.front,
        options: [fc.back, "Bu noto'g'ri javob", "Boshqa variant", "Umuman boshqa narsa"],
        correct: 0,
        explanation: fc.back,
      }));
      setQuizQuestions(questions);
      setQuizIndex(0);
      setSelectedOpt(null);
      setQuizResults([]);
      setQuizDone(false);
      setQuizScore(0);
      setQuizStartTime(Date.now());
      setMode("quiz");
    } finally {
      setGeneratingQuiz(false);
    }
  };

  // Submit quiz answer
  const handleQuizAnswer = (optIndex: number) => {
    if (selectedOpt !== null) return;
    const timeTaken = Date.now() - quizStartTime;
    setSelectedOpt(optIndex);
    const isCorrect = optIndex === quizQuestions[quizIndex].correct;
    const newResults = [...quizResults, { card_index: quizIndex, is_correct: isCorrect, time_ms: timeTaken }];
    setQuizResults(newResults);
    if (isCorrect) setQuizScore((s) => s + 1);

    setTimeout(() => {
      if (quizIndex + 1 >= quizQuestions.length) {
        setQuizDone(true);
        // Complete chain if student is logged in
        const studentId = getStudentId();
        if (studentId && savedIds.length > 0) {
          fetch(`${API_URL}/api/chain/complete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              student_id: studentId,
              topic,
              subject: subject || topic,
              quiz_results: newResults,
              flashcard_ids: savedIds,
            }),
          }).catch(() => {});
        }
      } else {
        setQuizIndex((i) => i + 1);
        setSelectedOpt(null);
        setQuizStartTime(Date.now());
      }
    }, 1200);
  };

  // AI Mentor chat
  const handleSendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatLoading(true);
    try {
      const studentId = getStudentId();
      let userName = "Talaba";
      try { userName = JSON.parse(localStorage.getItem("lectio_user") || "{}").full_name || "Talaba"; } catch {}

      const res = await fetch(`${API_URL}/api/mentor/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId || 0,
          message: userMsg,
          conversation_history: chatMessages.slice(-6),
          student_profile: { name: userName, level: "Talaba", strong_subjects: [], weak_subjects: [], streak: 0, xp: 0, last_scores: {} },
        }),
      });
      if (!res.ok) throw new Error("Xatolik");
      const data = await res.json();
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Kechirasiz, hozir javob bera olmayapman. Qayta urinib ko'ring." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const MODES = [
    { id: "ai-cards", icon: "✨", label: "AI Flashcard Yaratish", desc: "Har qanday mavzu bo'yicha AI flashcard yaratsin", color: "#F5A623", bg: "rgba(245,166,35,0.1)" },
    { id: "mentor", icon: "🤖", label: "AI Mentor", desc: "Savollaringizni AI ustoza bering", color: "#7B2FBE", bg: "rgba(123,47,190,0.1)" },
    { id: "study", icon: "📚", label: "Flashcardlarni O'qish", desc: "Yaratilgan kartalarni o'rganish", color: "#0D9373", bg: "rgba(13,147,115,0.1)", disabled: flashcards.length === 0 },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#0A0A0F]/90 backdrop-blur">
        <button onClick={() => mode === "menu" ? router.push("/student/dashboard") : setMode("menu")} className="p-2 rounded-xl hover:bg-white/5 transition">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-bold text-sm">
            {mode === "menu" ? "Mustaqil O'qish" : mode === "ai-cards" ? "AI Flashcard" : mode === "study" ? "O'qish" : mode === "quiz" ? "Test" : "AI Mentor"}
          </h1>
          {topic && mode !== "menu" && <p className="text-xs text-slate-400">{topic}</p>}
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        <AnimatePresence mode="wait">

          {/* MENU */}
          {mode === "menu" && (
            <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="text-center mb-8 mt-4">
                <div className="text-5xl mb-3">📖</div>
                <h2 className="text-2xl font-bold mb-1">Mustaqil O&apos;qish</h2>
                <p className="text-slate-400 text-sm">O&apos;z tempingizda o&apos;rganing</p>
              </div>
              <div className="space-y-3">
                {MODES.map((m) => (
                  <motion.button
                    key={m.id}
                    whileHover={{ x: 4 }}
                    onClick={() => !m.disabled && setMode(m.id as Mode)}
                    disabled={m.disabled}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${m.disabled ? "opacity-40 cursor-not-allowed border-white/5" : "border-white/10 hover:border-white/25 cursor-pointer"}`}
                    style={{ background: m.disabled ? "rgba(255,255,255,0.02)" : m.bg }}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: `${m.color}22` }}>
                      {m.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold" style={{ color: m.disabled ? "rgba(255,255,255,0.3)" : m.color }}>{m.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{m.desc}</p>
                      {m.id === "study" && m.disabled && <p className="text-xs text-slate-500 mt-0.5">Avval flashcard yarating</p>}
                    </div>
                    {!m.disabled && <ChevronRight size={16} className="text-slate-500 shrink-0" />}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* AI CARDS GENERATION */}
          {mode === "ai-cards" && (
            <motion.div key="ai-cards" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
              <h2 className="text-lg font-bold mb-4">✨ AI Flashcard Yaratish</h2>
              {genError && <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{genError}</div>}
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">Mavzu *</label>
                  <input
                    value={topic}
                    onChange={(e) => { setTopic(e.target.value); setGenError(""); }}
                    placeholder="Masalan: Integral hisob, Binary Search, Fotosintez..."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#F5A623] transition"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">Fan (ixtiyoriy)</label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Matematika, Biologiya, Ingliz tili..."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#F5A623] transition"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Murakkablik</label>
                  <div className="flex gap-2">
                    {[["easy", "Oddiy 🌱"], ["medium", "O'rta 🌿"], ["hard", "Qiyin 🌳"]].map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setDifficulty(val)}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${difficulty === val ? "bg-[#F5A623] text-black" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleGenerateCards}
                  disabled={generating || !topic.trim()}
                  className="w-full py-4 rounded-xl bg-[#F5A623] text-black font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generating ? <><Loader2 size={18} className="animate-spin" /> AI yaratmoqda...</> : <><Zap size={18} /> 6 ta Flashcard Yaratish</>}
                </button>
              </div>
            </motion.div>
          )}

          {/* STUDY MODE */}
          {mode === "study" && flashcards.length > 0 && (
            <motion.div key="study" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-400">{cardIndex + 1} / {flashcards.length}</span>
                <div className="flex gap-2">
                  <button onClick={() => setMode("ai-cards")} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 flex items-center gap-1">
                    <RotateCcw size={12} /> Yangi mavzu
                  </button>
                  <button
                    onClick={handleStartQuiz}
                    disabled={generatingQuiz}
                    className="text-xs px-3 py-1.5 rounded-lg bg-[#0D9373]/20 text-[#0D9373] hover:bg-[#0D9373]/30 flex items-center gap-1 font-bold"
                  >
                    {generatingQuiz ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                    Test Boshlash
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-white/10 mb-6 overflow-hidden">
                <div className="h-full rounded-full bg-[#F5A623] transition-all" style={{ width: `${((cardIndex + 1) / flashcards.length) * 100}%` }} />
              </div>

              {/* Card */}
              <motion.div
                key={cardIndex}
                onClick={() => setFlipped((f) => !f)}
                whileTap={{ scale: 0.98 }}
                className="min-h-64 rounded-2xl border border-white/10 bg-white/5 p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-white/20 transition-all select-none"
              >
                <AnimatePresence mode="wait">
                  {!flipped ? (
                    <motion.div key="front" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <p className="text-xs text-[#F5A623] uppercase tracking-widest mb-3 font-bold">SAVOL</p>
                      <p className="text-xl font-bold leading-relaxed">{flashcards[cardIndex].front}</p>
                      {flashcards[cardIndex].hint && (
                        <p className="text-sm text-slate-500 mt-4">💡 {flashcards[cardIndex].hint}</p>
                      )}
                      <p className="text-xs text-slate-600 mt-6">Javobni ko&apos;rish uchun bosing</p>
                    </motion.div>
                  ) : (
                    <motion.div key="back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <p className="text-xs text-[#0D9373] uppercase tracking-widest mb-3 font-bold">JAVOB</p>
                      <p className="text-lg leading-relaxed text-slate-200">{flashcards[cardIndex].back}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Navigation */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setCardIndex((i) => Math.max(0, i - 1)); setFlipped(false); }}
                  disabled={cardIndex === 0}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 font-bold disabled:opacity-30 hover:bg-white/10 transition"
                >← Oldingi</button>
                <button
                  onClick={() => { setCardIndex((i) => Math.min(flashcards.length - 1, i + 1)); setFlipped(false); }}
                  disabled={cardIndex === flashcards.length - 1}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 font-bold disabled:opacity-30 hover:bg-white/10 transition"
                >Keyingi →</button>
              </div>
            </motion.div>
          )}

          {/* QUIZ MODE */}
          {mode === "quiz" && quizQuestions.length > 0 && (
            <motion.div key="quiz" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
              {!quizDone ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-slate-400">Savol {quizIndex + 1}/{quizQuestions.length}</span>
                    <span className="text-sm font-bold text-[#F5A623]">{quizScore} to&apos;g&apos;ri</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 mb-5 overflow-hidden">
                    <div className="h-full rounded-full bg-[#0D9373] transition-all" style={{ width: `${(quizIndex / quizQuestions.length) * 100}%` }} />
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-4">
                    <p className="font-bold text-lg leading-relaxed">{quizQuestions[quizIndex].question}</p>
                  </div>

                  <div className="space-y-2">
                    {quizQuestions[quizIndex].options.map((opt, i) => {
                      const isSelected = selectedOpt === i;
                      const isCorrect = quizQuestions[quizIndex].correct === i;
                      let style = "border-white/10 bg-white/5 hover:bg-white/10";
                      if (selectedOpt !== null) {
                        if (isCorrect) style = "border-[#0D9373] bg-[#0D9373]/10";
                        else if (isSelected && !isCorrect) style = "border-[#E84855] bg-[#E84855]/10";
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => handleQuizAnswer(i)}
                          disabled={selectedOpt !== null}
                          className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left disabled:cursor-not-allowed ${style}`}
                        >
                          <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-sm font-bold shrink-0">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="flex-1 text-sm">{opt}</span>
                          {selectedOpt !== null && isCorrect && <CheckCircle2 size={16} className="text-[#0D9373] shrink-0" />}
                          {selectedOpt !== null && isSelected && !isCorrect && <XCircle size={16} className="text-[#E84855] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {selectedOpt !== null && quizQuestions[quizIndex].explanation && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 p-3 rounded-xl bg-[#1B4FD8]/10 border border-[#1B4FD8]/20 text-sm text-slate-300">
                      💡 {quizQuestions[quizIndex].explanation}
                    </motion.div>
                  )}
                </>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center mt-8">
                  <div className="text-5xl mb-4">{quizScore >= quizQuestions.length * 0.8 ? "🏆" : quizScore >= quizQuestions.length * 0.5 ? "👍" : "📚"}</div>
                  <h2 className="text-2xl font-bold mb-2">Test tugadi!</h2>
                  <p className="text-4xl font-bold text-[#F5A623] mb-1">{quizScore}/{quizQuestions.length}</p>
                  <p className="text-slate-400 mb-8">{Math.round((quizScore / quizQuestions.length) * 100)}% to&apos;g&apos;ri</p>
                  <div className="flex flex-col gap-3">
                    <button onClick={() => { setMode("study"); setCardIndex(0); setFlipped(false); }}
                      className="py-3 rounded-xl bg-[#0D9373]/20 text-[#0D9373] font-bold border border-[#0D9373]/30 hover:bg-[#0D9373]/30 transition">
                      📚 Kartalarni qayta o&apos;qish
                    </button>
                    <button onClick={() => setMode("ai-cards")}
                      className="py-3 rounded-xl bg-[#F5A623] text-black font-bold hover:bg-[#f7b955] transition">
                      ✨ Yangi mavzu o&apos;rganish
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* AI MENTOR */}
          {mode === "mentor" && (
            <motion.div key="mentor" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex flex-col" style={{ height: "calc(100vh - 120px)" }}>
              <div className="flex-1 overflow-y-auto space-y-3 pb-4">
                {chatMessages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-3">🤖</div>
                    <p className="font-bold text-lg mb-1">AI Mentor</p>
                    <p className="text-slate-400 text-sm mb-4">Har qanday savolingizni bering</p>
                    <div className="flex flex-col gap-2 max-w-xs mx-auto">
                      {["Integral nima?", "Binary search tushuntir", "Fotosintez jarayonini izohla"].map((q) => (
                        <button key={q} onClick={() => { setChatInput(q); }} className="text-sm px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition text-left">
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[#F5A623] text-black rounded-br-none"
                        : "bg-white/10 text-white rounded-bl-none"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 rounded-2xl rounded-bl-none px-4 py-3">
                      <div className="flex gap-1">
                        {[0, 0.2, 0.4].map((d, i) => (
                          <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: d }}
                            className="w-2 h-2 rounded-full bg-slate-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="flex gap-2 pt-3 border-t border-white/10">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendChat()}
                  placeholder="Savolingizni yozing..."
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#F5A623] transition text-sm"
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim() || chatLoading}
                  className="p-3 rounded-xl bg-[#F5A623] text-black disabled:opacity-50 hover:bg-[#f7b955] transition"
                >
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
