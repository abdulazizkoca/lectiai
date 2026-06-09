"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";
import {
  Sparkles, Play, Users, Trophy, Clock, ChevronRight, Plus,
  Trash2, RotateCcw, QrCode, Zap, CheckCircle2, BarChart2,
  Crown, Loader2, ArrowLeft, Wifi, WifiOff, Star, Edit2,
  X, Check, BookOpen, Brain, ChevronDown, ChevronUp,
  Layers, AlignLeft, GripVertical, Copy, RefreshCw
} from "lucide-react";
import QRCode from "react-qr-code";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const SOCKET_URL = API_URL;

// ─── Types ────────────────────────────────────────────────────
type Phase = "setup" | "lobby" | "question" | "q_results" | "final";

interface Question {
  question: string;
  options: string[];
  correct: string;
  explanation: string;
  time_limit: number;
  points: number;
}

interface Participant {
  name: string;
  score: number;
}

interface QResults {
  correct_answer: string;
  explanation: string;
  stats: Record<string, number>;
  correct_count: number;
  top5_leaderboard: { rank: number; name: string; score: number }[];
}

const LETTERS = ["A", "B", "C", "D"];
const OPTION_COLORS = ["#E84855", "#1B4FD8", "#0D9373", "#F5A623"];

const EMPTY_QUESTION = (): Question => ({
  question: "",
  options: ["", "", "", ""],
  correct: "A",
  explanation: "",
  time_limit: 20,
  points: 1000,
});

// ─── Question Editor Modal ────────────────────────────────────
function QuestionEditor({
  q, idx, onSave, onClose
}: {
  q: Question;
  idx: number;
  onSave: (updated: Question) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Question>({ ...q, options: [...q.options] });
  const questionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    questionRef.current?.focus();
  }, []);

  const setOpt = (i: number, val: string) => {
    const opts = [...draft.options];
    opts[i] = val;
    setDraft({ ...draft, options: opts });
  };

  const canSave = draft.question.trim() && draft.options.filter(o => o.trim()).length >= 2;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        className="w-full max-w-xl rounded-2xl border border-white/10 overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0f1118, #141720)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#F5A623]/20 flex items-center justify-center text-xs font-black text-[#F5A623]">
              {idx + 1}
            </div>
            <span className="font-bold text-white">Savol tahrirlash</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-white/8">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Question text */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Savol matni *</label>
            <textarea
              ref={questionRef}
              value={draft.question}
              onChange={e => setDraft({ ...draft, question: e.target.value })}
              placeholder="Savol matnini kiriting..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#F5A623]/50 transition resize-none text-sm"
            />
          </div>

          {/* Options */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Javob variantlari *</label>
            <div className="space-y-2">
              {LETTERS.map((letter, i) => (
                <div key={letter} className="flex items-center gap-2">
                  <button
                    onClick={() => setDraft({ ...draft, correct: letter })}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition border ${
                      draft.correct === letter
                        ? "border-transparent text-white"
                        : "border-white/15 text-slate-400 hover:border-white/30"
                    }`}
                    style={draft.correct === letter ? { background: OPTION_COLORS[i] } : {}}
                    title={`${letter} to'g'ri javob`}
                  >
                    {draft.correct === letter ? <Check size={12} /> : letter}
                  </button>
                  <input
                    value={draft.options[i] || ""}
                    onChange={e => setOpt(i, e.target.value)}
                    placeholder={`${letter} varianti...`}
                    className={`flex-1 px-3 py-2 rounded-xl bg-white/5 border text-sm text-white placeholder-slate-600 focus:outline-none transition ${
                      draft.correct === letter ? "border-[#0D9373]/40 bg-[#0D9373]/5" : "border-white/8 focus:border-white/25"
                    }`}
                  />
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-600 mt-1.5">To'g'ri javob tugmasini bosing (rang o'zgaradi)</p>
          </div>

          {/* Explanation */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Izoh (ixtiyoriy)</label>
            <input
              value={draft.explanation}
              onChange={e => setDraft({ ...draft, explanation: e.target.value })}
              placeholder="To'g'ri javob izohi..."
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/8 text-white placeholder-slate-600 focus:outline-none focus:border-white/25 transition text-sm"
            />
          </div>

          {/* Time + Points */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-1">
                <Clock size={10} /> Vaqt: {draft.time_limit}s
              </label>
              <input
                type="range" min={10} max={60} step={5}
                value={draft.time_limit}
                onChange={e => setDraft({ ...draft, time_limit: +e.target.value })}
                className="w-full accent-[#F5A623]"
              />
              <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
                <span>10s</span><span>60s</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-1">
                <Zap size={10} /> Ball
              </label>
              <select
                value={draft.points}
                onChange={e => setDraft({ ...draft, points: +e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/8 text-white focus:outline-none text-sm"
              >
                {[500, 750, 1000, 1500, 2000].map(p => (
                  <option key={p} value={p} className="bg-[#141720]">{p} ball</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/8 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold text-sm hover:bg-white/10 transition">
            Bekor
          </button>
          <button
            onClick={() => canSave && onSave(draft)}
            disabled={!canSave}
            className="flex-1 py-2.5 rounded-xl bg-[#F5A623] text-black font-bold text-sm disabled:opacity-40 hover:bg-amber-400 transition flex items-center justify-center gap-1.5"
          >
            <Check size={14} /> Saqlash
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function ProfessorQuizPage() {
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();

  // Setup state
  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [localLessons, setLocalLessons] = useState<any[]>([]);
  const [showLessonPicker, setShowLessonPicker] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [showAIPanel, setShowAIPanel] = useState(false);

  // Session state
  const [phase, setPhase] = useState<Phase>("setup");
  const [roomCode, setRoomCode] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [answerCount, setAnswerCount] = useState(0);
  const [qIdx, setQIdx] = useState(-1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [qResults, setQResults] = useState<QResults | null>(null);
  const [finalLeaderboard, setFinalLeaderboard] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Load local lessons ────────────────────────────────────────
  useEffect(() => {
    const ls = JSON.parse(localStorage.getItem("lectio_professor_lessons") || "[]");
    setLocalLessons(ls);
  }, []);

  // ── Load questions from local lesson ────────────────────────
  const loadFromLesson = (lesson: any) => {
    const quizArr: Question[] = (lesson.presentation_data?.quiz || []).map((q: any) => ({
      question: q.question || "",
      options: q.options || ["", "", "", ""],
      correct: typeof q.correct === "number" ? LETTERS[q.correct] : (q.correct || "A"),
      explanation: q.explanation || "",
      time_limit: q.time_limit || 20,
      points: q.points || 1000,
    })).filter((q: Question) => q.question.trim());

    if (quizArr.length > 0) {
      setQuestions(quizArr);
      setQuizTitle(lesson.title || lesson.presentation_data?.title || "");
      setShowLessonPicker(false);
      addToast({ title: `✅ ${quizArr.length} ta savol yuklandi`, type: "success" });
    } else {
      addToast({ title: "Bu darsda savollar yo'q", description: "Metodichkadan AI dars yaratishda savol yaratiladi", type: "warning" });
    }
  };

  // ── AI Question Generation ───────────────────────────────────
  const generateAIQuestions = async () => {
    if (!aiTopic.trim()) { addToast({ title: "Mavzu kiriting", type: "error" }); return; }
    setGeneratingAI(true);
    const token = localStorage.getItem("lectio_token") || "";

    try {
      const res = await fetch(`${API_URL}/api/chain/quiz-from-cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          topic: aiTopic.trim(),
          flashcards: [{ front: aiTopic, back: aiTopic }],
          count: 8,
        }),
      });

      const data = res.ok ? await res.json() : null;
      const mapped: Question[] = ((data?.questions || []) as any[]).slice(0, 10).map((q: any) => ({
        question: q.question || q.question_text || "",
        options: Array.isArray(q.options) ? q.options : ["A variant", "B variant", "C variant", "D variant"],
        correct: typeof q.correct === "number" ? LETTERS[q.correct] : (q.correct || "A"),
        explanation: q.explanation || "",
        time_limit: 20,
        points: 1000,
      })).filter((q: Question) => q.question.trim());

      if (mapped.length > 0) {
        setQuestions(mapped);
        setShowAIPanel(false);
        addToast({ title: `✨ ${mapped.length} ta savol yaratildi`, type: "success" });
      } else {
        throw new Error("AI bo'sh natija qaytardi");
      }
    } catch {
      addToast({ title: "AI xatosi", description: "Savol qo'lda qo'shing", type: "error" });
    } finally {
      setGeneratingAI(false);
    }
  };

  // ── Add / Edit / Delete ───────────────────────────────────────
  const addQuestion = () => {
    const newQ = EMPTY_QUESTION();
    setQuestions(prev => [...prev, newQ]);
    setEditingIdx(questions.length);
  };

  const saveQuestion = (idx: number, updated: Question) => {
    setQuestions(prev => {
      const arr = [...prev];
      arr[idx] = updated;
      return arr;
    });
    setEditingIdx(null);
  };

  const deleteQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
    if (editingIdx === idx) setEditingIdx(null);
  };

  const duplicateQuestion = (idx: number) => {
    const copy = { ...questions[idx], options: [...questions[idx].options] };
    const arr = [...questions];
    arr.splice(idx + 1, 0, copy);
    setQuestions(arr);
  };

  // ── Create session ─────────────────────────────────────────────
  const handleCreateSession = () => {
    if (!quizTitle.trim()) { addToast({ title: "Quiz nomini kiriting", type: "error" }); return; }
    if (questions.length === 0) { addToast({ title: "Kamida 1 savol kerak", type: "error" }); return; }
    const invalidQ = questions.find(q => !q.question.trim() || q.options.filter(o => o.trim()).length < 2);
    if (invalidQ) { addToast({ title: "Barcha savollarda kamida 2 ta variant bo'lishi kerak", type: "error" }); return; }

    const code = "LECTIO-" + Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
    setRoomCode(code);
    connectSocket(code);
  };

  // ── Socket ─────────────────────────────────────────────────────
  const connectSocket = useCallback((code: string) => {
    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("create_room", {
        room_code: code,
        lesson_id: null,
        questions: questions.map(q => ({
          question: q.question, type: "multiple_choice",
          options: q.options, correct_answer: q.correct,
          explanation: q.explanation, time_limit: q.time_limit, points: q.points,
        })),
        settings: { quiz_title: quizTitle },
      });
    });

    socket.on("room_created", (data: { room_code: string }) => {
      setRoomCode(data.room_code || code);
      setPhase("lobby");
      addToast({ title: "🎮 Quiz xonasi tayyor!", description: `Kod: ${data.room_code || code}`, type: "success" });
    });

    socket.on("room_joined", (data: { participant_count: number; nickname_list: string[] }) => {
      setParticipants(data.nickname_list.map(n => ({ name: n, score: 0 })));
    });

    socket.on("answer_stats", (data: { answered_count: number }) => setAnswerCount(data.answered_count));

    socket.on("question_results", (data: QResults) => {
      setQResults(data);
      if (timerRef.current) clearInterval(timerRef.current);
      setPhase("q_results");
    });

    socket.on("quiz_ended", (data: { final_leaderboard: any[] }) => {
      setFinalLeaderboard(data.final_leaderboard || []);
      setPhase("final");
    });

    socket.on("connect_error", () => {
      setConnected(false);
      setPhase("lobby");
      addToast({ title: "Demo rejim", description: "Socket ulanmadi, demo sifatida davom etmoqda", type: "warning" });
    });

    socket.on("disconnect", () => setConnected(false));
  }, [questions, quizTitle]);

  // ── Start question ─────────────────────────────────────────────
  const handleStartQuestion = () => {
    const next = qIdx + 1;
    if (next >= questions.length) return;
    setQIdx(next); setAnswerCount(0); setQResults(null); setPhase("question");

    const tl = questions[next].time_limit || 20;
    setTimeLeft(tl);
    if (timerRef.current) clearInterval(timerRef.current);
    let t = tl;
    timerRef.current = setInterval(() => {
      t -= 1; setTimeLeft(t);
      if (t <= 0) { clearInterval(timerRef.current!); handleEndQuestion(); }
    }, 1000);

    if (socketRef.current?.connected) {
      socketRef.current.emit("start_question", { room_code: roomCode, question_index: next });
    } else {
      let c = 0;
      const max = Math.max(participants.length, 2);
      const iv = setInterval(() => { c++; setAnswerCount(c); if (c >= max) clearInterval(iv); }, 700);
    }
  };

  const handleEndQuestion = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (socketRef.current?.connected) {
      socketRef.current.emit("end_question", { room_code: roomCode });
    } else {
      const q = questions[qIdx];
      const stats: Record<string, number> = {};
      LETTERS.slice(0, q.options.length).forEach(l => { stats[l] = Math.floor(Math.random() * Math.max(participants.length, 3)); });
      stats[q.correct] = Math.max(stats[q.correct] || 0, 2);
      setQResults({
        correct_answer: q.correct, explanation: q.explanation, stats,
        correct_count: stats[q.correct],
        top5_leaderboard: participants.slice(0, 5).map((p, i) => ({
          rank: i + 1, name: p.name, score: p.score + Math.floor(Math.random() * 800 + 200),
        })).sort((a, b) => b.score - a.score).map((p, i) => ({ ...p, rank: i + 1 })),
      });
      setPhase("q_results");
    }
  };

  const handleEndQuiz = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("end_quiz", { room_code: roomCode });
    } else {
      setFinalLeaderboard(
        participants.map((p, i) => ({ rank: i + 1, name: p.name, score: p.score || Math.floor(Math.random() * 2000 + 500) }))
          .sort((a, b) => b.score - a.score).map((p, i) => ({ ...p, rank: i + 1 }))
      );
      setPhase("final");
    }
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    socketRef.current?.disconnect(); socketRef.current = null;
    setPhase("setup"); setQIdx(-1); setRoomCode(""); setParticipants([]);
    setAnswerCount(0); setQResults(null); setFinalLeaderboard([]); setConnected(false);
  };

  const timePercent = questions[qIdx] ? (timeLeft / questions[qIdx].time_limit) * 100 : 0;
  const timeColor = timeLeft > 10 ? "#0D9373" : timeLeft > 5 ? "#F5A623" : "#E84855";

  const totalTime = questions.reduce((a, q) => a + q.time_limit, 0);
  const totalPoints = questions.reduce((a, q) => a + q.points, 0);

  return (
    <div className="min-h-full text-white p-4 md:p-6 relative z-10">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Question editor modal */}
      <AnimatePresence>
        {editingIdx !== null && questions[editingIdx] !== undefined && (
          <QuestionEditor
            key={editingIdx}
            q={questions[editingIdx]}
            idx={editingIdx}
            onSave={updated => saveQuestion(editingIdx, updated)}
            onClose={() => {
              // Remove empty question if closed without saving
              if (!questions[editingIdx]?.question?.trim()) {
                setQuestions(prev => prev.filter((_, i) => i !== editingIdx));
              }
              setEditingIdx(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">

        {/* ─────────────────── SETUP ─────────────────────────────── */}
        {phase === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">

            {/* Page title */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-[#F5A623]/15 border border-[#F5A623]/20 flex items-center justify-center shrink-0">
                <Zap size={22} className="text-[#F5A623]" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">Jonli Quiz</h1>
                <p className="text-sm text-slate-400">Real-vaqt testni sozlang va o'tkazing</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Left: main config */}
              <div className="lg:col-span-2 space-y-4">

                {/* Quiz title */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Quiz nomi *</label>
                  <input
                    value={quizTitle}
                    onChange={e => setQuizTitle(e.target.value)}
                    placeholder="Masalan: Algoritmlar 3-modul testi"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-white placeholder-slate-500 focus:outline-none focus:border-[#F5A623]/50 transition text-lg font-bold"
                  />
                </div>

                {/* Questions list */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{questions.length} ta savol</span>
                      {questions.length > 0 && (
                        <span className="text-[11px] text-slate-500">· ~{totalTime}s · {totalPoints.toLocaleString()} ball</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Load from local lessons */}
                      <button
                        onClick={() => setShowLessonPicker(!showLessonPicker)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#1B4FD8]/15 text-[#6B8FFF] hover:bg-[#1B4FD8]/25 font-bold transition"
                      >
                        <BookOpen size={12} /> Darsdan yuklash
                      </button>
                      {/* AI generate */}
                      <button
                        onClick={() => setShowAIPanel(!showAIPanel)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#7B2FBE]/15 text-[#A855F7] hover:bg-[#7B2FBE]/25 font-bold transition"
                      >
                        <Sparkles size={12} /> AI
                      </button>
                      {/* Add manually */}
                      <button
                        onClick={addQuestion}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#0D9373]/15 text-[#0D9373] hover:bg-[#0D9373]/25 font-bold transition"
                      >
                        <Plus size={12} /> Qo'shish
                      </button>
                    </div>
                  </div>

                  {/* Lesson picker */}
                  <AnimatePresence>
                    {showLessonPicker && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-4">
                        <div className="p-4 rounded-xl bg-[#1B4FD8]/8 border border-[#1B4FD8]/20">
                          <p className="text-sm font-bold text-[#6B8FFF] mb-3 flex items-center gap-1.5">
                            <BookOpen size={14} /> AI Darslaringizdan Savollar
                          </p>
                          {localLessons.length === 0 ? (
                            <p className="text-sm text-slate-400">Avval Metodichka sahifasida AI dars yarating.</p>
                          ) : (
                            <div className="space-y-2 max-h-52 overflow-y-auto">
                              {localLessons.map((l: any) => {
                                const qCount = l.presentation_data?.quiz?.length || 0;
                                return (
                                  <button key={l.id} onClick={() => loadFromLesson(l)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/8 bg-white/5 hover:bg-white/10 hover:border-white/20 text-left transition">
                                    <div className="w-8 h-8 rounded-lg bg-[#1B4FD8]/20 flex items-center justify-center shrink-0">
                                      <span className="text-xs font-bold text-[#6B8FFF]">{(l.title || "D")[0]}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-bold text-sm truncate">{l.title || l.presentation_data?.title || "Dars"}</p>
                                      <p className="text-[11px] text-slate-500">{qCount > 0 ? `${qCount} ta savol` : "Savol yo'q"}</p>
                                    </div>
                                    {qCount > 0 && (
                                      <span className="text-[11px] text-[#0D9373] border border-[#0D9373]/30 rounded-full px-2 py-0.5 shrink-0">Yuklash</span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* AI panel */}
                  <AnimatePresence>
                    {showAIPanel && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-4">
                        <div className="p-4 rounded-xl bg-[#7B2FBE]/8 border border-[#7B2FBE]/20">
                          <p className="text-sm font-bold text-[#A855F7] mb-2 flex items-center gap-1.5">
                            <Sparkles size={14} /> AI Savol Generatsiyasi
                          </p>
                          <div className="flex gap-2">
                            <input
                              value={aiTopic}
                              onChange={e => setAiTopic(e.target.value)}
                              placeholder="Mavzu: Algoritmlar, SQL, Fizika..."
                              className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#7B2FBE]/50 text-sm transition"
                              onKeyDown={e => e.key === "Enter" && generateAIQuestions()}
                            />
                            <button
                              onClick={generateAIQuestions}
                              disabled={generatingAI}
                              className="px-4 py-2 rounded-xl bg-[#7B2FBE] text-white font-bold text-sm disabled:opacity-50 flex items-center gap-1.5 hover:bg-purple-600 transition"
                            >
                              {generatingAI ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                              {generatingAI ? "..." : "Yaratish"}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Questions */}
                  {questions.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
                      <div className="text-4xl mb-3">📝</div>
                      <p className="font-bold text-white mb-1">Hali savollar yo'q</p>
                      <p className="text-sm text-slate-400 mb-4">Qo'lda qo'shing, darsdan yuklang yoki AI bilan yarating</p>
                      <button onClick={addQuestion}
                        className="px-5 py-2.5 rounded-xl bg-[#0D9373]/15 border border-[#0D9373]/25 text-[#0D9373] font-bold text-sm hover:bg-[#0D9373]/25 transition">
                        <Plus size={14} className="inline mr-1.5" /> Birinchi savolni qo'shish
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {questions.map((q, i) => (
                        <motion.div
                          key={i}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/8 hover:border-white/15 group transition"
                        >
                          <div className="w-7 h-7 rounded-lg bg-[#F5A623]/15 flex items-center justify-center text-xs font-black text-[#F5A623] shrink-0 mt-0.5">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white leading-relaxed truncate">
                              {q.question || <span className="text-slate-500 italic">Bo'sh savol (tahrirlang)</span>}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {q.options.slice(0, 4).map((opt, j) => (
                                opt.trim() ? (
                                  <span key={j} className={`text-[11px] px-1.5 py-0.5 rounded-md font-bold ${q.correct === LETTERS[j] ? "bg-[#0D9373]/20 text-[#0D9373]" : "bg-white/5 text-slate-600"}`}>
                                    {LETTERS[j]}) {opt.slice(0, 18)}{opt.length > 18 ? "…" : ""}
                                  </span>
                                ) : null
                              ))}
                              <span className="text-[11px] text-slate-600 ml-auto">{q.time_limit}s · {q.points}pt</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                            <button onClick={() => duplicateQuestion(i)} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/8 rounded-lg transition" title="Ko'chirish">
                              <Copy size={12} />
                            </button>
                            <button onClick={() => setEditingIdx(i)} className="p-1.5 text-[#F5A623] hover:bg-[#F5A623]/10 rounded-lg transition" title="Tahrirlash">
                              <Edit2 size={12} />
                            </button>
                            <button onClick={() => deleteQuestion(i)} className="p-1.5 text-[#E84855] hover:bg-[#E84855]/10 rounded-lg transition" title="O'chirish">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {questions.length > 0 && (
                    <button onClick={addQuestion}
                      className="mt-3 w-full py-2.5 rounded-xl border border-dashed border-white/15 text-slate-400 hover:border-[#0D9373]/40 hover:text-[#0D9373] hover:bg-[#0D9373]/5 text-sm font-bold transition flex items-center justify-center gap-1.5">
                      <Plus size={14} /> Savol qo'shish
                    </button>
                  )}
                </div>
              </div>

              {/* Right: summary + start */}
              <div className="space-y-4">
                {/* Summary */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                  <h3 className="font-bold text-slate-200 mb-4">Quiz xulosa</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Savollar", value: `${questions.length} ta`, icon: <AlignLeft size={13} />, color: "#F5A623" },
                      { label: "Jami vaqt", value: `${totalTime}s`, icon: <Clock size={13} />, color: "#1B4FD8" },
                      { label: "Maks. ball", value: totalPoints.toLocaleString(), icon: <Zap size={13} />, color: "#0D9373" },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between text-sm">
                        <span className="text-slate-400 flex items-center gap-1.5" style={{ color: item.color + "99" }}>
                          {item.icon} {item.label}
                        </span>
                        <span className="font-bold" style={{ color: item.color }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Start button */}
                <button
                  onClick={handleCreateSession}
                  disabled={!quizTitle.trim() || questions.length === 0}
                  className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: "linear-gradient(135deg, #F5A623, #f7b955)",
                    color: "#000",
                    boxShadow: questions.length > 0 ? "0 8px 30px rgba(245,166,35,0.3)" : "none"
                  }}
                >
                  <Play size={20} /> Quiz Boshlash
                </button>
                <p className="text-center text-xs text-slate-600">
                  Xona yaratiladi, o&apos;quvchilar kod orqali qo&apos;shiladi
                </p>

                {/* Quick tip */}
                {questions.length === 0 && (
                  <div className="p-4 rounded-xl bg-[#F5A623]/5 border border-[#F5A623]/15 text-xs text-slate-400">
                    <p className="font-bold text-[#F5A623] mb-1">💡 Maslahat</p>
                    AI dars yaratgandan so'ng <strong className="text-white">Metodichka</strong> sahifasidagi natija quiz savollarini o'z ichiga oladi — ularni to'g'ridan-to'g'ri shu yerga yuklashingiz mumkin.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ─────────────────── LOBBY ─────────────────────────────── */}
        {phase === "lobby" && (
          <motion.div key="lobby" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <button onClick={handleReset} className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm">
                <ArrowLeft size={16} /> Bekor qilish
              </button>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${connected ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"}`}>
                {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
                {connected ? "Jonli ulanish" : "Demo rejim"}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              {/* Room code + QR */}
              <div className="rounded-2xl border border-[#F5A623]/30 bg-[#F5A623]/5 p-6 text-center">
                <p className="text-xs text-[#F5A623] uppercase tracking-widest font-black mb-2">Xona kodi</p>
                <p className="text-4xl font-mono font-black text-[#F5A623] mb-4 tracking-widest">{roomCode}</p>
                <div className="bg-white p-3 rounded-2xl inline-block mb-3 shadow-lg">
                  <QRCode value={`${typeof window !== "undefined" ? window.location.origin : ""}/join?code=${roomCode}`} size={100} />
                </div>
                <p className="text-xs text-slate-400">QR skanerla yoki kodni kiriting</p>
              </div>

              {/* Participants */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold flex items-center gap-2 text-white">
                    <Users size={14} className="text-[#0D9373]" /> Ishtirokchilar
                  </span>
                  <motion.span
                    key={participants.length}
                    initial={{ scale: 1.4 }}
                    animate={{ scale: 1 }}
                    className="text-3xl font-black text-[#F5A623]"
                  >
                    {participants.length}
                  </motion.span>
                </div>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                  {participants.length === 0 ? (
                    <div className="w-full text-center py-6 text-slate-500 text-sm">
                      <div className="text-2xl mb-2 animate-pulse">⏳</div>
                      O&apos;quvchilar kutilmoqda...
                    </div>
                  ) : (
                    participants.map((p, i) => (
                      <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}
                        className="px-2.5 py-1.5 rounded-xl bg-white/8 text-xs font-bold border border-white/10">
                        {p.name}
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Quiz info */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 mb-5">
              <p className="font-bold text-lg text-white">{quizTitle}</p>
              <p className="text-slate-400 text-sm mt-0.5">
                {questions.length} ta savol · {totalTime}s · {totalPoints.toLocaleString()} maks. ball
              </p>
            </div>

            <button onClick={handleStartQuestion}
              className="w-full py-4 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.01]"
              style={{ background: "linear-gradient(135deg, #E84855, #f06470)", boxShadow: "0 8px 30px rgba(232,72,85,0.35)" }}>
              🚀 Quizni Boshlash! <span className="text-sm font-normal opacity-80">({participants.length} o&apos;quvchi)</span>
            </button>
          </motion.div>
        )}

        {/* ─────────────────── QUESTION ──────────────────────────── */}
        {phase === "question" && qIdx >= 0 && (
          <motion.div key={`q-${qIdx}`} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="max-w-3xl mx-auto">
            {/* Timer */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-400 font-bold">Savol {qIdx + 1} / {questions.length}</span>
                <div className="flex items-center gap-2 font-mono font-black text-2xl" style={{ color: timeColor }}>
                  <Clock size={20} /> {timeLeft}s
                </div>
              </div>
              <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ background: timeColor, width: `${timePercent}%` }}
                  transition={{ duration: 0.5 }} />
              </div>
            </div>

            {/* Question */}
            <div className="rounded-2xl border border-white/15 p-6 mb-4"
              style={{ background: "linear-gradient(135deg, rgba(245,166,35,0.06), rgba(27,79,216,0.06))" }}>
              <p className="text-xl md:text-2xl font-bold leading-relaxed text-white">{questions[qIdx].question}</p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {questions[qIdx].options.map((opt, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-2xl border border-white/10"
                  style={{ background: OPTION_COLORS[i] + "12" }}>
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0"
                    style={{ background: OPTION_COLORS[i] }}>
                    {LETTERS[i]}
                  </span>
                  <span className="text-sm font-medium text-slate-200">{opt}</span>
                </div>
              ))}
            </div>

            {/* Answer progress */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-400">Javob berganlar</span>
                <span className="font-mono font-black text-lg text-[#F5A623]">
                  {answerCount} / {Math.max(participants.length, 1)}
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div className="h-full rounded-full bg-[#F5A623]"
                  animate={{ width: `${(answerCount / Math.max(participants.length, 1)) * 100}%` }} />
              </div>
            </div>

            <button onClick={handleEndQuestion}
              className="w-full py-3.5 rounded-2xl bg-[#1B4FD8] text-white font-bold text-lg hover:bg-blue-600 transition flex items-center justify-center gap-2">
              Savolni Tugatish <ChevronRight size={20} />
            </button>
          </motion.div>
        )}

        {/* ─────────────────── Q RESULTS ─────────────────────────── */}
        {phase === "q_results" && qResults && (
          <motion.div key="q_results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-black mb-5 text-center">Savol {qIdx + 1} natijalari</h2>

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Javoblar taqsimoti</h3>
              <div className="space-y-3">
                {LETTERS.slice(0, questions[qIdx]?.options?.length || 4).map((l, i) => {
                  const count = qResults.stats[l] || 0;
                  const total = Object.values(qResults.stats).reduce((a, b) => a + (b as number), 0) || 1;
                  const pct = Math.round((count / total) * 100);
                  const isCorrect = l === qResults.correct_answer;
                  return (
                    <div key={l}>
                      <div className="flex justify-between items-center mb-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs text-white"
                            style={{ background: OPTION_COLORS[i] }}>
                            {l}
                          </span>
                          <span className={isCorrect ? "text-[#0D9373] font-bold" : "text-slate-300"}>
                            {questions[qIdx]?.options?.[i]}
                          </span>
                          {isCorrect && <CheckCircle2 size={13} className="text-[#0D9373]" />}
                        </div>
                        <span className={`font-mono font-bold ${isCorrect ? "text-[#0D9373]" : "text-slate-400"}`}>{count}</span>
                      </div>
                      <div className="h-4 rounded-full bg-white/8 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ background: isCorrect ? "#0D9373" : OPTION_COLORS[i] + "60" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {qResults.explanation && (
                <div className="mt-4 p-3 rounded-xl bg-[#0D9373]/8 border border-[#0D9373]/20 text-sm text-slate-200">
                  💡 <strong className="text-[#0D9373]">Izoh:</strong> {qResults.explanation}
                </div>
              )}
            </div>

            {qResults.top5_leaderboard?.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 mb-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Trophy size={13} /> Top 5
                </h3>
                {qResults.top5_leaderboard.map(p => (
                  <div key={p.name} className="flex items-center gap-3 text-sm py-1.5">
                    <span className="w-7 text-center text-base">{p.rank === 1 ? "🥇" : p.rank === 2 ? "🥈" : p.rank === 3 ? "🥉" : `#${p.rank}`}</span>
                    <span className="flex-1 font-medium">{p.name}</span>
                    <span className="font-mono font-bold text-[#F5A623]">{p.score}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              {qIdx < questions.length - 1 ? (
                <button onClick={handleStartQuestion}
                  className="flex-1 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition hover:scale-[1.01]"
                  style={{ background: "linear-gradient(135deg, #F5A623, #f7b955)", color: "#000" }}>
                  Keyingi Savol <ChevronRight size={20} />
                </button>
              ) : (
                <button onClick={handleEndQuiz}
                  className="flex-1 py-4 rounded-2xl text-white font-black text-lg flex items-center justify-center gap-2 transition"
                  style={{ background: "linear-gradient(135deg, #7B2FBE, #9b3fd6)" }}>
                  <Trophy size={20} /> Quizni Yakunlash
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ─────────────────── FINAL ─────────────────────────────── */}
        {phase === "final" && (
          <motion.div key="final" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto text-center">
            <motion.div animate={{ rotate: [0, 10, -10, 5, 0], scale: [1, 1.15, 1] }} transition={{ duration: 0.6 }} className="text-8xl mb-4">
              🏆
            </motion.div>
            <h2 className="text-3xl font-black mb-1">{quizTitle}</h2>
            <p className="text-slate-400 mb-8">Quiz yakunlandi · {questions.length} ta savol</p>

            {finalLeaderboard.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 mb-6 text-left">
                <h3 className="font-black text-center mb-5 flex items-center justify-center gap-2 text-lg">
                  <Crown size={18} className="text-amber-400" /> Yakuniy Reyting
                </h3>
                <div className="space-y-2">
                  {finalLeaderboard.map((p, i) => (
                    <motion.div key={p.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                      className={`flex items-center gap-4 p-4 rounded-xl border ${
                        i === 0 ? "border-amber-500/30 bg-amber-500/8" :
                        i === 1 ? "border-slate-400/20 bg-slate-400/5" :
                        i === 2 ? "border-orange-700/20 bg-orange-700/5" :
                        "border-white/8 bg-white/[0.025]"
                      }`}>
                      <span className="text-2xl w-9 text-center">
                        {p.rank === 1 ? "🥇" : p.rank === 2 ? "🥈" : p.rank === 3 ? "🥉" : (
                          <span className="text-sm font-black text-slate-500">#{p.rank}</span>
                        )}
                      </span>
                      <span className="flex-1 font-bold text-white">{p.name}</span>
                      <div className="flex items-center gap-1.5">
                        <Star size={13} className="text-[#F5A623]" />
                        <span className="font-mono font-black text-[#F5A623] text-lg">{p.score.toLocaleString()}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleReset}
                className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/10 font-bold hover:bg-white/10 transition flex items-center justify-center gap-2">
                <RotateCcw size={16} /> Yangi Quiz
              </button>
              <button onClick={() => router.push("/professor/analytics")}
                className="flex-1 py-3.5 rounded-xl bg-[#1B4FD8]/15 border border-[#1B4FD8]/25 text-[#6B8FFF] font-bold hover:bg-[#1B4FD8]/25 transition flex items-center justify-center gap-2">
                <BarChart2 size={16} /> Analitika
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
