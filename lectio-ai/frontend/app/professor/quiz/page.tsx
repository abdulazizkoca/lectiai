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
  Crown, Loader2, ArrowLeft, Settings2, Wifi, WifiOff, Star
} from "lucide-react";
import QRCode from "react-qr-code";
import { lessonsAPI, sessionsAPI } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const SOCKET_URL = API_URL;

// ─── Types ────────────────────────────────────────────────────
type Phase = "setup" | "lobby" | "question" | "q_results" | "final";

interface Question {
  question: string;
  options: string[];
  correct: string;      // "A" | "B" | "C" | "D"
  explanation: string;
  time_limit: number;
  points: number;
  type?: string;
}

interface Participant {
  name: string;
  score: number;
  streak?: number;
}

interface QResults {
  correct_answer: string;
  explanation: string;
  stats: Record<string, number>;
  correct_count: number;
  top5_leaderboard: { rank: number; name: string; score: number }[];
}

// ─── Default questions ────────────────────────────────────────
const DEFAULT_QUESTIONS: Question[] = [
  { question: "Algoritm nima?", options: ["Aniq qadamlar ketma-ketligi", "Dasturlash tili", "Ma'lumotlar bazasi", "Tarmoq protokoli"], correct: "A", explanation: "Algoritm — muammoni hal qilish uchun aniq qadamlar ketma-ketligi", time_limit: 20, points: 1000 },
  { question: "Big O O(log n) — qaysi algoritmga tegishli?", options: ["Bubble Sort", "Binary Search", "Linear Search", "Merge Sort"], correct: "B", explanation: "Binary Search har qadamda yarmini tashlab ketadi → O(log n)", time_limit: 25, points: 1000 },
  { question: "Stack qaysi printsipda ishlaydi?", options: ["FIFO", "Random Access", "LIFO", "Priority Queue"], correct: "C", explanation: "LIFO — Last In, First Out (oxirgi kirgan birinchi chiqadi)", time_limit: 20, points: 1000 },
];

const LETTERS = ["A", "B", "C", "D", "E"];
const OPTION_COLORS = ["#E84855", "#1B4FD8", "#0D9373", "#F5A623", "#7B2FBE"];

// ─── Component ────────────────────────────────────────────────
export default function ProfessorQuizPage() {
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();

  // Setup state
  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>(DEFAULT_QUESTIONS);
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [editingQ, setEditingQ] = useState<number | null>(null);

  // Session state
  const [phase, setPhase] = useState<Phase>("setup");
  const [roomCode, setRoomCode] = useState("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [answerCount, setAnswerCount] = useState(0);
  const [qIdx, setQIdx] = useState(-1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [qResults, setQResults] = useState<QResults | null>(null);
  const [finalLeaderboard, setFinalLeaderboard] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Load professor's lessons ─────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("lectio_token");
    let pid = 1;
    try { pid = JSON.parse(localStorage.getItem("lectio_user") || "{}").id || 1; } catch {}
    if (token && !token.startsWith("mock_")) {
      lessonsAPI.getByProfessor(pid, token)
        .then((r) => setLessons(r?.lessons || r || []))
        .catch(() => {});
    }
  }, []);

  // ── Load questions from selected lesson ──────────────────────
  const loadLessonQuestions = async (lessonId: number) => {
    setSelectedLessonId(lessonId);
    try {
      const token = localStorage.getItem("lectio_token") || "";
      const res = await fetch(`${API_URL}/api/questions/lesson/${lessonId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.questions?.length > 0) {
        const mapped: Question[] = data.questions.map((q: any) => ({
          question: q.question,
          options: q.options || [],
          correct: q.correct || "A",
          explanation: q.explanation || "",
          time_limit: q.time_limit || 20,
          points: q.points || 1000,
          type: q.type || "multiple_choice",
        }));
        setQuestions(mapped);
        addToast({ title: "✅ Savollar yuklandi", description: `${mapped.length} ta savol topildi`, type: "success" });
      }
    } catch {}
  };

  // ── AI Question Generation ───────────────────────────────────
  const generateAIQuestions = async () => {
    if (!aiTopic.trim()) { addToast({ title: "Xato", description: "Mavzu kiriting", type: "error" }); return; }
    setGeneratingAI(true);
    try {
      const res = await fetch(`${API_URL}/api/chain/quiz-from-cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiTopic.trim(),
          flashcards: [{ front: aiTopic, back: `${aiTopic} haqida` }],
          count: 5,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      // Also generate via lesson AI service
      const lessonRes = await fetch(`${API_URL}/api/lessons/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("lectio_token") || ""}` },
        body: JSON.stringify({ title: aiTopic, topic: aiTopic, duration_minutes: 30 }),
      }).catch(() => null);

      const mapped: Question[] = (data.questions || []).slice(0, 8).map((q: any) => ({
        question: q.question || q.question_text || "Savol",
        options: q.options || ["A variant", "B variant", "C variant", "D variant"],
        correct: typeof q.correct === "number" ? LETTERS[q.correct] : (q.correct || "A"),
        explanation: q.explanation || "",
        time_limit: 20,
        points: 1000,
      }));

      if (mapped.length > 0) {
        setQuestions(mapped);
        setShowAIPanel(false);
        addToast({ title: "✨ AI savollar tayyor", description: `${mapped.length} ta savol yaratildi`, type: "success" });
      } else {
        throw new Error("Bo'sh natija");
      }
    } catch {
      addToast({ title: "AI xatosi", description: "Fallback savollar ishlatilmoqda", type: "warning" });
      setQuestions(DEFAULT_QUESTIONS);
      setShowAIPanel(false);
    } finally {
      setGeneratingAI(false);
    }
  };

  // ── Create session & connect socket ─────────────────────────
  const handleCreateSession = async () => {
    if (!quizTitle.trim()) { addToast({ title: "Xato", description: "Quiz nomini kiriting", type: "error" }); return; }
    if (questions.length === 0) { addToast({ title: "Xato", description: "Kamida 1 savol kerak", type: "error" }); return; }

    const token = localStorage.getItem("lectio_token") || "";
    let generatedCode = "";

    try {
      if (selectedLessonId && token && !token.startsWith("mock_")) {
        const res = await sessionsAPI.create(selectedLessonId, token);
        if (res.room_code) generatedCode = res.room_code;
        if (res.session_id) setSessionId(res.session_id);
      }
    } catch {}

    // Fallback to socket room
    if (!generatedCode) {
      generatedCode = "LECTIO-" + Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
    }

    setRoomCode(generatedCode);
    connectSocket(generatedCode);
  };

  // ── Socket.IO connection ─────────────────────────────────────
  const connectSocket = useCallback((code: string) => {
    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("create_room", {
        room_code: code,
        lesson_id: selectedLessonId,
        questions: questions.map((q) => ({
          question: q.question,
          type: q.type || "multiple_choice",
          options: q.options,
          correct_answer: q.correct,
          explanation: q.explanation,
          time_limit: q.time_limit,
          points: q.points,
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
      setParticipants(data.nickname_list.map((n) => ({ name: n, score: 0 })));
    });

    socket.on("answer_stats", (data: { answered_count: number; total_count: number }) => {
      setAnswerCount(data.answered_count);
    });

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
      addToast({ title: "⚠️ Server offline", description: "Demo rejimida davom etmoqda", type: "warning" });
    });

    socket.on("disconnect", () => setConnected(false));
  }, [questions, selectedLessonId, quizTitle]);

  // ── Start question ────────────────────────────────────────────
  const handleStartQuestion = () => {
    const nextIdx = qIdx + 1;
    if (nextIdx >= questions.length) return;
    setQIdx(nextIdx);
    setAnswerCount(0);
    setQResults(null);
    setPhase("question");

    const tl = questions[nextIdx].time_limit || 20;
    setTimeLeft(tl);

    if (timerRef.current) clearInterval(timerRef.current);
    let t = tl;
    timerRef.current = setInterval(() => {
      t -= 1;
      setTimeLeft(t);
      if (t <= 0) { clearInterval(timerRef.current!); handleEndQuestion(); }
    }, 1000);

    if (socketRef.current?.connected) {
      socketRef.current.emit("start_question", { room_code: roomCode, question_index: nextIdx });
    } else {
      // Demo: simulate answers
      let count = 0;
      const max = Math.max(participants.length, 3);
      const iv = setInterval(() => {
        count++;
        setAnswerCount(count);
        if (count >= max) clearInterval(iv);
      }, 600);
    }
  };

  // ── End question ───────────────────────────────────────────────
  const handleEndQuestion = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (socketRef.current?.connected) {
      socketRef.current.emit("end_question", { room_code: roomCode });
    } else {
      // Demo fallback
      const q = questions[qIdx];
      const stats: Record<string, number> = {};
      LETTERS.slice(0, q.options.length).forEach((l) => {
        stats[l] = Math.floor(Math.random() * Math.max(participants.length, 4));
      });
      stats[q.correct] = Math.max(stats[q.correct], 2);
      setQResults({
        correct_answer: q.correct,
        explanation: q.explanation,
        stats,
        correct_count: stats[q.correct],
        top5_leaderboard: participants.slice(0, 5).map((p, i) => ({
          rank: i + 1, name: p.name, score: p.score + Math.floor(Math.random() * 800 + 200),
        })).sort((a, b) => b.score - a.score).map((p, i) => ({ ...p, rank: i + 1 })),
      });
      setPhase("q_results");
    }
  };

  // ── End quiz ───────────────────────────────────────────────────
  const handleEndQuiz = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("end_quiz", { room_code: roomCode });
    } else {
      setFinalLeaderboard(participants.map((p, i) => ({ rank: i + 1, name: p.name, score: p.score || Math.floor(Math.random() * 2000 + 500) })).sort((a, b) => b.score - a.score).map((p, i) => ({ ...p, rank: i + 1 })));
      setPhase("final");
    }
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // ── Reset ──────────────────────────────────────────────────────
  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    socketRef.current?.disconnect();
    socketRef.current = null;
    setPhase("setup"); setQIdx(-1); setRoomCode(""); setParticipants([]);
    setAnswerCount(0); setQResults(null); setFinalLeaderboard([]); setConnected(false);
    setQuizTitle(""); setSessionId(null);
  };

  const timePercent = questions[qIdx] ? (timeLeft / questions[qIdx].time_limit) * 100 : 0;
  const timeColor = timeLeft > 10 ? "#0D9373" : timeLeft > 5 ? "#F5A623" : "#E84855";

  return (
    <div className="min-h-full text-white p-4 md:p-6 relative z-10">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* ── SETUP PHASE ─────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {phase === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#F5A623]/20 flex items-center justify-center">
                <Zap size={20} className="text-[#F5A623]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Jonli Quiz</h1>
                <p className="text-slate-400 text-sm">Real-time test o&apos;tkazing</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left: Config */}
              <div className="lg:col-span-2 space-y-4">
                {/* Title */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <label className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-2 block">Quiz nomi *</label>
                  <input
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    placeholder="Masalan: Algoritmlar yakuniy testi"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#F5A623] transition text-lg font-bold"
                  />
                </div>

                {/* Lesson selector */}
                {lessons.length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <label className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-3 block">Darsdan savollar yuklash</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {lessons.map((l: any) => (
                        <button
                          key={l.id}
                          onClick={() => loadLessonQuestions(l.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${selectedLessonId === l.id ? "border-[#F5A623] bg-[#F5A623]/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#1B4FD8]/20 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-[#1B4FD8]">{l.title?.[0]}</span>
                          </div>
                          <span className="font-medium text-sm truncate">{l.title}</span>
                          {selectedLessonId === l.id && <CheckCircle2 size={14} className="text-[#F5A623] shrink-0 ml-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Questions list */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs text-slate-400 uppercase tracking-wider font-bold">{questions.length} ta savol</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowAIPanel(!showAIPanel)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#7B2FBE]/20 text-[#7B2FBE] hover:bg-[#7B2FBE]/30 font-bold transition"
                      >
                        <Sparkles size={12} /> AI bilan yaratish
                      </button>
                      <button
                        onClick={() => setQuestions([...questions, { question: "", options: ["", "", "", ""], correct: "A", explanation: "", time_limit: 20, points: 1000 }])}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 font-bold transition"
                      >
                        <Plus size={12} /> Qo&apos;shish
                      </button>
                    </div>
                  </div>

                  {/* AI Panel */}
                  <AnimatePresence>
                    {showAIPanel && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-4">
                        <div className="p-4 rounded-xl bg-[#7B2FBE]/10 border border-[#7B2FBE]/20">
                          <p className="text-sm font-bold text-[#7B2FBE] mb-2">✨ AI Savol Generatsiyasi</p>
                          <div className="flex gap-2">
                            <input
                              value={aiTopic}
                              onChange={(e) => setAiTopic(e.target.value)}
                              placeholder="Mavzu: Algoritm murakkabligi, SQL, Fizika..."
                              className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#7B2FBE] text-sm transition"
                              onKeyDown={(e) => e.key === "Enter" && generateAIQuestions()}
                            />
                            <button
                              onClick={generateAIQuestions}
                              disabled={generatingAI}
                              className="px-4 py-2 rounded-xl bg-[#7B2FBE] text-white font-bold text-sm disabled:opacity-50 flex items-center gap-1.5"
                            >
                              {generatingAI ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                              Yaratish
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Questions */}
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {questions.map((q, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 group">
                        <div className="w-7 h-7 rounded-lg bg-[#F5A623]/20 flex items-center justify-center text-xs font-bold text-[#F5A623] shrink-0 mt-0.5">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          {editingQ === i ? (
                            <input
                              defaultValue={q.question}
                              onBlur={(e) => {
                                const updated = [...questions];
                                updated[i] = { ...updated[i], question: e.target.value };
                                setQuestions(updated);
                                setEditingQ(null);
                              }}
                              autoFocus
                              className="w-full bg-transparent border-b border-[#F5A623] text-sm focus:outline-none text-white"
                            />
                          ) : (
                            <p className="text-sm font-medium leading-relaxed cursor-pointer hover:text-[#F5A623] transition" onClick={() => setEditingQ(i)}>
                              {q.question || <span className="text-slate-500 italic">Savol matni (bosing tahrirlash uchun)</span>}
                            </p>
                          )}
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {q.options.slice(0, 4).map((opt, j) => (
                              <span key={j} className={`text-xs px-2 py-0.5 rounded-md font-bold ${q.correct === LETTERS[j] ? "bg-[#0D9373]/20 text-[#0D9373]" : "bg-white/5 text-slate-500"}`}>
                                {LETTERS[j]}) {opt.slice(0, 20)}{opt.length > 20 ? "..." : ""}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                          <span className="text-xs text-slate-500 px-1.5 py-0.5 rounded bg-white/5">{q.time_limit}s</span>
                          <button onClick={() => setQuestions(questions.filter((_, j) => j !== i))} className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Summary & Start */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <h3 className="font-bold mb-4 text-slate-200">Xulosa</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Savollar", value: `${questions.length} ta`, color: "#F5A623" },
                      { label: "Jami vaqt", value: `${questions.reduce((a, q) => a + q.time_limit, 0)}s`, color: "#1B4FD8" },
                      { label: "Maks ball", value: questions.reduce((a, q) => a + q.points, 0).toLocaleString(), color: "#0D9373" },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">{item.label}</span>
                        <span className="font-bold" style={{ color: item.color }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCreateSession}
                  disabled={!quizTitle.trim() || questions.length === 0}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#F5A623] to-[#f7b955] text-black font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:from-[#f7b955] hover:to-[#F5A623] transition shadow-lg shadow-[#F5A623]/20"
                >
                  <Play size={20} /> Quiz Boshlash
                </button>
                <p className="text-center text-xs text-slate-500">Quiz xonasi yaratiladi va o&apos;quvchilar kod orqali qo&apos;shiladi</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── LOBBY PHASE ─────────────────────────────────────────── */}
        {phase === "lobby" && (
          <motion.div key="lobby" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <button onClick={handleReset} className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm">
                <ArrowLeft size={16} /> Bekor qilish
              </button>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${connected ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
                {connected ? "Socket ulangan" : "Demo rejim"}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              {/* Room code + QR */}
              <div className="rounded-2xl border border-[#F5A623]/30 bg-[#F5A623]/5 p-6 text-center">
                <p className="text-xs text-[#F5A623] uppercase tracking-widest font-bold mb-2">Xona kodi</p>
                <p className="text-4xl font-mono font-bold text-[#F5A623] mb-4">{roomCode}</p>
                <div className="bg-white p-3 rounded-xl inline-block mb-3">
                  <QRCode value={`${typeof window !== "undefined" ? window.location.origin : ""}/join?code=${roomCode}`} size={100} />
                </div>
                <p className="text-xs text-slate-400">QR yoki kodni skanerla</p>
              </div>

              {/* Participants */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold flex items-center gap-2"><Users size={14} /> Ishtirokchilar</span>
                  <span className="text-2xl font-bold text-[#F5A623]">{participants.length}</span>
                </div>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {participants.length === 0 ? (
                    <div className="w-full text-center py-6 text-slate-500 text-sm">
                      <div className="animate-pulse mb-2">⏳</div>
                      O&apos;quvchilar qo&apos;shilishini kuting...
                    </div>
                  ) : (
                    participants.map((p, i) => (
                      <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}
                        className="px-3 py-1.5 rounded-xl bg-white/10 text-sm font-bold border border-white/10">
                        {p.name}
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Quiz info */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 mb-5">
              <p className="font-bold text-lg">{quizTitle}</p>
              <p className="text-slate-400 text-sm mt-0.5">{questions.length} ta savol • Jami {questions.reduce((a, q) => a + q.time_limit, 0)} soniya</p>
            </div>

            <button
              onClick={handleStartQuestion}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#E84855] to-[#f06470] text-white font-bold text-xl flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-[#E84855]/20 transition"
            >
              🚀 Quizni Boshlash! ({participants.length} o&apos;quvchi)
            </button>
          </motion.div>
        )}

        {/* ── QUESTION PHASE ──────────────────────────────────────── */}
        {phase === "question" && qIdx >= 0 && (
          <motion.div key={`q-${qIdx}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-3xl mx-auto">
            {/* Timer bar */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-400">Savol {qIdx + 1}/{questions.length}</span>
                <div className="flex items-center gap-2 font-mono font-bold text-xl" style={{ color: timeColor }}>
                  <Clock size={18} /> {timeLeft}s
                </div>
              </div>
              <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
                <motion.div className="h-full rounded-full transition-all" style={{ background: timeColor, width: `${timePercent}%` }} />
              </div>
            </div>

            {/* Question card */}
            <div className="rounded-2xl border border-white/15 bg-white/5 p-6 mb-5">
              <p className="text-xl font-bold leading-relaxed">{questions[qIdx].question}</p>
            </div>

            {/* Options (professor view — no clicking) */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {questions[qIdx].options.map((opt, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5">
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0"
                    style={{ background: OPTION_COLORS[i] }}>
                    {LETTERS[i]}
                  </span>
                  <span className="text-sm font-medium">{opt}</span>
                </div>
              ))}
            </div>

            {/* Answer progress */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 mb-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-400">Javob berganlar</span>
                <span className="font-mono font-bold text-lg text-[#F5A623]">{answerCount} / {Math.max(participants.length, 1)}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <motion.div className="h-full rounded-full bg-[#F5A623]"
                  animate={{ width: `${(answerCount / Math.max(participants.length, 1)) * 100}%` }} />
              </div>
            </div>

            <button onClick={handleEndQuestion}
              className="w-full py-4 rounded-2xl bg-[#1B4FD8] text-white font-bold text-lg hover:bg-[#2563eb] transition">
              Savolni Tugatish →
            </button>
          </motion.div>
        )}

        {/* ── QUESTION RESULTS ────────────────────────────────────── */}
        {phase === "q_results" && qResults && (
          <motion.div key="q_results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-5 text-center">Savol {qIdx + 1} natijalari</h2>

            {/* Answer distribution */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 mb-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Javoblar taqsimoti</h3>
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
                          <span className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white" style={{ background: OPTION_COLORS[i] }}>{l}</span>
                          <span className={isCorrect ? "text-[#0D9373] font-bold" : "text-slate-300"}>{questions[qIdx]?.options?.[i]}</span>
                          {isCorrect && <CheckCircle2 size={14} className="text-[#0D9373]" />}
                        </div>
                        <span className={`font-mono font-bold ${isCorrect ? "text-[#0D9373]" : "text-slate-400"}`}>{count}</span>
                      </div>
                      <div className="h-4 rounded-full bg-white/10 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full" style={{ background: isCorrect ? "#0D9373" : OPTION_COLORS[i] + "80" }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {qResults.explanation && (
                <div className="mt-4 p-3 rounded-xl bg-[#0D9373]/10 border border-[#0D9373]/20 text-sm text-slate-200">
                  💡 <strong className="text-[#0D9373]">Izoh:</strong> {qResults.explanation}
                </div>
              )}
            </div>

            {/* Mini leaderboard */}
            {qResults.top5_leaderboard?.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 mb-5">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Trophy size={14} /> Top 5</h3>
                <div className="space-y-2">
                  {qResults.top5_leaderboard.map((p) => (
                    <div key={p.name} className="flex items-center gap-3 text-sm">
                      <span className="w-6 text-center">{p.rank === 1 ? "🥇" : p.rank === 2 ? "🥈" : p.rank === 3 ? "🥉" : `#${p.rank}`}</span>
                      <span className="flex-1 font-medium">{p.name}</span>
                      <span className="font-mono font-bold text-[#F5A623]">{p.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next/End buttons */}
            <div className="flex gap-3">
              {qIdx < questions.length - 1 ? (
                <button onClick={handleStartQuestion}
                  className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-[#F5A623] to-[#f7b955] text-black font-bold text-lg flex items-center justify-center gap-2">
                  Keyingi Savol <ChevronRight size={20} />
                </button>
              ) : (
                <button onClick={handleEndQuiz}
                  className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-[#7B2FBE] to-[#9b3fd6] text-white font-bold text-lg flex items-center justify-center gap-2">
                  <Trophy size={20} /> Quizni Yakunlash
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ── FINAL LEADERBOARD ───────────────────────────────────── */}
        {phase === "final" && (
          <motion.div key="final" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto text-center">
            <motion.div animate={{ rotate: [0, 10, -10, 5, 0] }} transition={{ duration: 0.5 }} className="text-7xl mb-4">🏆</motion.div>
            <h2 className="text-3xl font-bold mb-1">{quizTitle}</h2>
            <p className="text-slate-400 mb-8">Quiz yakunlandi — {questions.length} ta savol</p>

            {finalLeaderboard.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 mb-6 text-left">
                <h3 className="font-bold text-center mb-5 flex items-center justify-center gap-2">
                  <Crown size={18} className="text-amber-400" /> Yakuniy Reyting
                </h3>
                <div className="space-y-2">
                  {finalLeaderboard.map((p, i) => (
                    <motion.div key={p.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                      className={`flex items-center gap-3 p-3 rounded-xl ${i === 0 ? "bg-amber-500/10 border border-amber-500/30" : i === 1 ? "bg-slate-400/10 border border-slate-400/20" : i === 2 ? "bg-orange-700/10 border border-orange-700/20" : "bg-white/5"}`}>
                      <span className="text-xl w-8 text-center">
                        {p.rank === 1 ? "🥇" : p.rank === 2 ? "🥈" : p.rank === 3 ? "🥉" : <span className="text-sm font-bold text-slate-400">#{p.rank}</span>}
                      </span>
                      <span className="flex-1 font-bold">{p.name}</span>
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-[#F5A623]" />
                        <span className="font-mono font-bold text-[#F5A623]">{p.score}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleReset}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 font-bold hover:bg-white/10 transition flex items-center justify-center gap-2">
                <RotateCcw size={16} /> Yangi Quiz
              </button>
              <button onClick={() => router.push("/professor/analytics")}
                className="flex-1 py-3 rounded-xl bg-[#1B4FD8]/20 border border-[#1B4FD8]/30 text-[#6B8FFF] font-bold hover:bg-[#1B4FD8]/30 transition flex items-center justify-center gap-2">
                <BarChart2 size={16} /> Analitika
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
