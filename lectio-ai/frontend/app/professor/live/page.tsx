"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";
import QRCode from "react-qr-code";
import {
  Video, Users, Clock, Zap, QrCode, StopCircle, Eye,
  Radio, ChevronRight, Sparkles, MessageSquare, HandMetal,
  Brain, BarChart2, Send, Plus, X, Play, ChevronLeft,
  Wifi, WifiOff, Volume2, Bell, Coffee, Megaphone
} from "lucide-react";
import { CameraBlock } from "@/components/professor/CameraBlock";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_URL = SOCKET_URL;

type Participant = {
  name: string;
  status: "green" | "yellow" | "red";
  attention: number;
  handRaised?: boolean;
};

type PollOption = { text: string; votes: number };
type Poll = { question: string; options: PollOption[]; active: boolean };
type StudentQuestion = { name: string; text: string; time: string };
type Tab = "camera" | "slides" | "poll" | "chat";

const AI_TIPS_LIVE = [
  "Diqqat 70% dan pastga tushsa — jonli savol bering yoki WOW fakt ko'rsating",
  "10 daqiqada bir marta talabalardan so'rov o'tkazing",
  "Qo'l ko'targan talabaga albatta javob bering — aktivlik oshadi",
  "Test yuborish diqqatni 85% gacha oshirishi mumkin",
];

export default function LiveLessonPage() {
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();

  // Session
  const [activeSession, setActiveSession] = useState<any>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [connected, setConnected] = useState(false);

  // Participants
  const [participants, setParticipants] = useState<Participant[]>([]);

  // Slides
  const [slides, setSlides] = useState<any[]>([]);
  const [slideIdx, setSlideIdx] = useState(0);

  // Poll
  const [poll, setPoll] = useState<Poll | null>(null);
  const [pollQ, setPollQ] = useState("");
  const [pollOpts, setPollOpts] = useState(["", "", ""]);
  const [showPollCreate, setShowPollCreate] = useState(false);

  // Student Questions
  const [studentQuestions, setStudentQuestions] = useState<StudentQuestion[]>([]);

  // UI
  const [activeTab, setActiveTab] = useState<Tab>("camera");
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [tipIdx, setTipIdx] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [breakActive, setBreakActive] = useState(false);

  // Announcement
  const [announcement, setAnnouncement] = useState("");
  const [showAnnounce, setShowAnnounce] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const breakRef = useRef<NodeJS.Timeout | null>(null);
  const tipRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("lectio_active_session");
    const session = stored ? JSON.parse(stored) : null;
    setActiveSession(session);

    // Load lesson slides
    if (session?.lessonId) {
      const saved = JSON.parse(localStorage.getItem("lectio_professor_lessons") || "[]");
      const lesson = saved.find((l: any) => l.id === session.lessonId);
      if (lesson?.presentation_data?.slides) {
        setSlides(lesson.presentation_data.slides);
      }
    }

    // Timer
    timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);

    // AI tip rotation
    tipRef.current = setInterval(() => setTipIdx((i) => (i + 1) % AI_TIPS_LIVE.length), 12000);

    // Socket
    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    if (session?.roomCode) {
      socket.emit("create_room", { lesson_id: session.lessonId, questions: [], settings: {} });
    }

    socket.on("room_joined", (data: { participant_count: number; nickname_list: string[] }) => {
      setParticipants(data.nickname_list.map((name) => ({ name, status: "green", attention: 85, handRaised: false })));
    });

    socket.on("student_attention", (data: { nickname: string; attention: number }) => {
      const att = Math.round(data.attention);
      const status: "green" | "yellow" | "red" = att >= 70 ? "green" : att >= 40 ? "yellow" : "red";
      setParticipants((prev) => {
        const idx = prev.findIndex((p) => p.name === data.nickname);
        if (idx === -1) return [...prev, { name: data.nickname, status, attention: att, handRaised: false }];
        const updated = [...prev];
        updated[idx] = { ...updated[idx], status, attention: att };
        return updated;
      });
    });

    socket.on("student_asked", (data: { question_text: string; nickname?: string }) => {
      setStudentQuestions((prev) => [
        { name: data.nickname || "Talaba", text: data.question_text, time: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }) },
        ...prev,
      ].slice(0, 20));
      addToast({ title: "❓ Yangi savol", description: data.question_text, type: "info" });
    });

    socket.on("hand_raised", (data: { nickname: string }) => {
      setParticipants((prev) => prev.map((p) => p.name === data.nickname ? { ...p, handRaised: true } : p));
      addToast({ title: "✋ Qo'l ko'tarildi", description: data.nickname, type: "info" });
    });

    return () => {
      [timerRef, breakRef, tipRef].forEach((r) => r.current && clearInterval(r.current));
      socket.disconnect();
    };
  }, []);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const avgAttention = participants.length > 0
    ? Math.round(participants.reduce((a, p) => a + p.attention, 0) / participants.length)
    : 0;

  const greenCount = participants.filter((p) => p.status === "green").length;
  const yellowCount = participants.filter((p) => p.status === "yellow").length;
  const redCount = participants.filter((p) => p.status === "red").length;
  const handCount = participants.filter((p) => p.handRaised).length;

  // Actions
  const handleSendQuiz = () => {
    socketRef.current?.emit("quiz_start", { room_code: activeSession?.roomCode });
    addToast({ title: "🎯 Quiz yuborildi!", description: "Talabalar testni ko'rmoqda", type: "success" });
  };

  const handleBreak = (minutes: number) => {
    setBreakActive(true);
    setBreakSeconds(minutes * 60);
    if (breakRef.current) clearInterval(breakRef.current);
    breakRef.current = setInterval(() => {
      setBreakSeconds((s) => {
        if (s <= 1) { clearInterval(breakRef.current!); setBreakActive(false); return 0; }
        return s - 1;
      });
    }, 1000);
    socketRef.current?.emit("break_started", { room_code: activeSession?.roomCode, duration_minutes: minutes });
    addToast({ title: `☕ ${minutes} daqiqa tanaffus`, description: "Talabalar ekraniga bildirildi", type: "info" });
  };

  const handleSendWow = () => {
    const lesson = JSON.parse(localStorage.getItem("lectio_professor_lessons") || "[]").find((l: any) => l.id === activeSession?.lessonId);
    const wowFact = lesson?.wow_fact || lesson?.presentation_data?.wow_fact || "Bu mavzu haqida qiziqarli fakt!";
    socketRef.current?.emit("wow_fact", { room_code: activeSession?.roomCode, fact: wowFact });
    addToast({ title: "✨ WOW Fakt yuborildi!", description: wowFact.slice(0, 60), type: "success" });
  };

  const handleAnnounce = () => {
    if (!announcement.trim()) return;
    socketRef.current?.emit("announcement", { room_code: activeSession?.roomCode, text: announcement });
    addToast({ title: "📢 E'lon yuborildi", description: announcement, type: "success" });
    setAnnouncement("");
    setShowAnnounce(false);
  };

  const handleStartPoll = () => {
    if (!pollQ.trim() || pollOpts.filter((o) => o.trim()).length < 2) {
      addToast({ title: "Xato", description: "Savol va kamida 2 ta variant kiriting", type: "error" }); return;
    }
    const newPoll: Poll = {
      question: pollQ.trim(),
      options: pollOpts.filter((o) => o.trim()).map((text) => ({ text, votes: 0 })),
      active: true,
    };
    setPoll(newPoll);
    setShowPollCreate(false);
    socketRef.current?.emit("poll_started", { room_code: activeSession?.roomCode, poll: newPoll });
    addToast({ title: "📊 So'rovnoma boshlandi", description: "Talabalar ovoz bermoqda", type: "success" });
  };

  const handleEndLesson = () => {
    localStorage.removeItem("lectio_active_session");
    socketRef.current?.emit("end_lesson", { room_code: activeSession?.roomCode });
    addToast({ title: "Dars yakunlandi", description: "Analitika sahifasiga o'tmoqda...", type: "info" });
    setTimeout(() => router.push("/professor/analytics"), 1500);
  };

  const roomCode = activeSession?.roomCode || "LECTIO-0000";
  const lessonTitle = activeSession?.lessonTitle || "Jonli Dars";
  const joinUrl = typeof window !== "undefined" ? `${window.location.origin}/join?code=${roomCode}` : `/join?code=${roomCode}`;

  const TABS: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "camera", label: "Kamera", icon: <Video size={14} /> },
    { id: "slides", label: "Slaydlar", icon: <Eye size={14} />, badge: slides.length },
    { id: "poll", label: "So'rov", icon: <BarChart2 size={14} /> },
    { id: "chat", label: "Savollar", icon: <MessageSquare size={14} />, badge: studentQuestions.length },
  ];

  return (
    <div className="min-h-full bg-transparent text-white p-4 md:p-5 relative z-10">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* ── Top Bar ─────────────────────────────────────────── */}
      <header className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative h-3 w-3 rounded-full bg-red-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">JONLI DARS</h1>
              <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${connected ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                {connected ? <Wifi size={10} /> : <WifiOff size={10} />}
                {connected ? "Online" : "Offline"}
              </span>
            </div>
            <p className="text-slate-400 text-xs truncate max-w-48">{lessonTitle}</p>
          </div>
        </div>

        {/* Center — Timer + Code */}
        <div className="flex items-center gap-2 flex-wrap">
          {breakActive && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D9373]/20 border border-[#0D9373]/30 text-[#0D9373] text-sm font-bold">
              <Coffee size={14} /> Tanaffus: {formatTime(breakSeconds)}
            </motion.div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-sm font-mono">
            <Clock size={13} className="text-slate-400" />
            <span className="font-bold">{formatTime(elapsedSeconds)}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F5A623]/10 border border-[#F5A623]/30 text-sm">
            <span className="text-slate-400 text-xs">Kod:</span>
            <span className="font-mono font-bold text-[#F5A623]">{roomCode}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAnnounce(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1B4FD8]/15 border border-[#1B4FD8]/25 text-[#6B8FFF] hover:bg-[#1B4FD8]/25 text-sm font-bold transition">
            <Megaphone size={14} /> E&apos;lon
          </button>
          <button onClick={() => setShowEndConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 text-sm font-bold transition">
            <StopCircle size={14} /> Tugatish
          </button>
        </div>
      </header>

      {/* ── Main 3-column Grid ──────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">

        {/* Left — Participants ─── */}
        <div className="xl:col-span-3 space-y-4">

          {/* Attention summary */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Eye size={12} /> Diqqat
              </span>
              <span className="text-2xl font-bold" style={{ color: avgAttention >= 70 ? "#0D9373" : avgAttention >= 50 ? "#F5A623" : "#E84855" }}>
                {participants.length > 0 ? `${avgAttention}%` : "—"}
              </span>
            </div>
            {participants.length > 0 && (
              <>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-3">
                  <motion.div animate={{ width: `${avgAttention}%` }} transition={{ duration: 0.5 }}
                    className="h-full rounded-full"
                    style={{ background: avgAttention >= 70 ? "#0D9373" : avgAttention >= 50 ? "#F5A623" : "#E84855" }} />
                </div>
                <div className="grid grid-cols-3 gap-1 text-center">
                  {[
                    { count: greenCount, label: "Diqqatli", color: "#0D9373" },
                    { count: yellowCount, label: "O'rta", color: "#F5A623" },
                    { count: redCount, label: "Chalg'igan", color: "#E84855" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg p-2" style={{ background: `${s.color}15` }}>
                      <p className="font-bold text-lg" style={{ color: s.color }}>{s.count}</p>
                      <p className="text-xs text-slate-500">{s.label}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Participants list */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users size={12} /> Talabalar
              </span>
              <span className="text-sm font-bold text-[#F5A623]">{participants.length}</span>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {participants.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="text-3xl mb-2">⏳</div>
                  <p className="text-slate-500 text-sm">Talabalar kutilmoqda...</p>
                  <p className="text-xs text-slate-600 mt-1">Kod: {roomCode}</p>
                </div>
              ) : (
                participants.map((p, i) => (
                  <motion.div key={p.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/5 transition border-b border-white/[0.04] last:border-0 cursor-pointer"
                    onClick={() => addToast({ title: p.name, description: `Diqqat: ${p.attention}%`, type: p.attention >= 70 ? "success" : p.attention >= 40 ? "warning" : "error" })}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: p.status === "green" ? "rgba(13,147,115,0.2)" : p.status === "yellow" ? "rgba(245,166,35,0.2)" : "rgba(232,72,85,0.2)" }}>
                      {p.name[0]?.toUpperCase()}
                    </div>
                    <span className="flex-1 text-sm font-medium truncate">{p.name}</span>
                    {p.handRaised && <HandMetal size={12} className="text-[#F5A623] shrink-0" />}
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`w-1.5 h-1.5 rounded-full ${p.status === "green" ? "bg-[#0D9373]" : p.status === "yellow" ? "bg-[#F5A623]" : "bg-[#E84855]"}`} />
                      <span className="text-xs font-mono text-slate-400">{p.attention}%</span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            {handCount > 0 && (
              <div className="px-4 py-2 border-t border-[#F5A623]/20 bg-[#F5A623]/5">
                <p className="text-xs font-bold text-[#F5A623] flex items-center gap-1.5">
                  <HandMetal size={12} /> {handCount} kishi qo&apos;l ko&apos;targan
                </p>
              </div>
            )}
          </div>

          {/* QR Code */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-center gap-1.5">
              <QrCode size={12} /> QR Kod
            </p>
            <div className="bg-white p-2 rounded-xl inline-block mb-2">
              <QRCode value={joinUrl} size={80} />
            </div>
            <p className="text-xs text-slate-500">Skan qiling yoki kodni kiriting</p>
          </div>
        </div>

        {/* Center — Main Content ─── */}
        <div className="xl:col-span-6 space-y-4">

          {/* Tab Bar */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition relative ${activeTab === tab.id ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"}`}>
                {tab.icon} {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#E84855] text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {tab.badge > 9 ? "9+" : tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">

            {/* Camera */}
            {activeTab === "camera" && (
              <motion.div key="cam" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                  <span className="text-sm font-bold flex items-center gap-2"><Eye size={14} className="text-[#F5A623]" /> Real-vaqt kamera tahlili</span>
                  <span className="text-xs text-slate-500">MediaPipe Face Detection</span>
                </div>
                <div className="p-4">
                  <CameraBlock sessionId={activeSession?.sessionId || null} />
                </div>
              </motion.div>
            )}

            {/* Slides */}
            {activeTab === "slides" && (
              <motion.div key="slides" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {slides.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
                    <div className="text-4xl mb-3">📊</div>
                    <p className="font-bold mb-1">Slaydlar yuklanmagan</p>
                    <p className="text-slate-400 text-sm">Dars yaratishda AI slaydlar avtomatik tayyorlanadi</p>
                    <button onClick={() => router.push("/professor/create-lesson")}
                      className="mt-4 text-sm text-[#F5A623] font-bold hover:underline">
                      Dars yaratish →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Current slide */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                        <span className="text-sm font-bold">Slayd {slideIdx + 1} / {slides.length}</span>
                        <div className="flex gap-2">
                          <button onClick={() => { setSlideIdx((i) => Math.max(0, i - 1)); socketRef.current?.emit("slide_changed", { room_code: roomCode, index: Math.max(0, slideIdx - 1) }); }}
                            disabled={slideIdx === 0} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition">
                            <ChevronLeft size={14} />
                          </button>
                          <button onClick={() => { setSlideIdx((i) => Math.min(slides.length - 1, i + 1)); socketRef.current?.emit("slide_changed", { room_code: roomCode, index: Math.min(slides.length - 1, slideIdx + 1) }); }}
                            disabled={slideIdx === slides.length - 1} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition">
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                      <AnimatePresence mode="wait">
                        <motion.div key={slideIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6">
                          <p className="text-xs text-[#F5A623] uppercase tracking-widest font-bold mb-2">Slayd {slideIdx + 1}</p>
                          <h2 className="text-xl font-bold mb-3">{slides[slideIdx]?.title}</h2>
                          <p className="text-slate-300 text-sm leading-relaxed">{slides[slideIdx]?.content}</p>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                    {/* Slide strip */}
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {slides.map((_: any, i: number) => (
                        <button key={i} onClick={() => setSlideIdx(i)}
                          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition ${i === slideIdx ? "bg-[#F5A623] text-black" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Poll */}
            {activeTab === "poll" && (
              <motion.div key="poll" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Active poll */}
                {poll?.active && (
                  <div className="rounded-2xl border border-[#1B4FD8]/30 bg-[#1B4FD8]/5 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-[#6B8FFF] uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#6B8FFF] animate-pulse" /> Jonli so&apos;rovnoma
                      </span>
                      <button onClick={() => { setPoll(null); socketRef.current?.emit("poll_ended", { room_code: roomCode }); }}
                        className="text-xs text-slate-400 hover:text-white transition">Yakunlash</button>
                    </div>
                    <p className="font-bold mb-4">{poll.question}</p>
                    <div className="space-y-2">
                      {poll.options.map((opt, i) => {
                        const total = poll.options.reduce((a, o) => a + o.votes, 0) || 1;
                        const pct = Math.round((opt.votes / total) * 100);
                        return (
                          <div key={i}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-300">{opt.text}</span>
                              <span className="font-mono font-bold text-[#6B8FFF]">{opt.votes} ov ({pct}%)</span>
                            </div>
                            <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                              <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }}
                                className="h-full rounded-full bg-[#1B4FD8]" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Create poll */}
                {showPollCreate ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-bold text-sm">Yangi so&apos;rovnoma</span>
                      <button onClick={() => setShowPollCreate(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
                    </div>
                    <input value={pollQ} onChange={(e) => setPollQ(e.target.value)} placeholder="Savol matni..."
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#F5A623] text-sm mb-3 transition" />
                    <div className="space-y-2 mb-4">
                      {pollOpts.map((opt, i) => (
                        <div key={i} className="flex gap-2">
                          <div className="w-6 h-10 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">{String.fromCharCode(65 + i)}</div>
                          <input value={opt} onChange={(e) => { const n = [...pollOpts]; n[i] = e.target.value; setPollOpts(n); }}
                            placeholder={`${i + 1}-variant`}
                            className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#F5A623] text-sm transition" />
                        </div>
                      ))}
                      {pollOpts.length < 5 && (
                        <button onClick={() => setPollOpts([...pollOpts, ""])} className="text-xs text-[#F5A623] font-bold hover:underline ml-8">+ Variant qo&apos;shish</button>
                      )}
                    </div>
                    <button onClick={handleStartPoll}
                      className="w-full py-3 rounded-xl bg-[#1B4FD8] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#2563eb] transition">
                      <Play size={14} /> So&apos;rovnomani Boshlash
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setShowPollCreate(true)}
                    className="w-full py-4 rounded-2xl border-2 border-dashed border-white/20 text-slate-400 hover:border-[#1B4FD8]/50 hover:text-[#6B8FFF] transition flex items-center justify-center gap-2 font-bold">
                    <Plus size={16} /> Yangi so&apos;rovnoma yaratish
                  </button>
                )}
              </motion.div>
            )}

            {/* Chat / Questions */}
            {activeTab === "chat" && (
              <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {studentQuestions.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
                    <MessageSquare size={32} className="text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">Talabalardan savollar yo&apos;q</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {studentQuestions.map((q, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-full bg-[#1B4FD8]/20 flex items-center justify-center text-xs font-bold text-[#6B8FFF]">
                            {q.name[0]?.toUpperCase()}
                          </div>
                          <span className="font-bold text-sm">{q.name}</span>
                          <span className="text-xs text-slate-500 ml-auto">{q.time}</span>
                        </div>
                        <p className="text-sm text-slate-200 leading-relaxed">{q.text}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Sidebar ─── */}
        <div className="xl:col-span-3 space-y-4">

          {/* Quick Actions */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Tezkor amallar</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Quiz", icon: <Radio size={15} />, color: "#F5A623", bg: "rgba(245,166,35,0.12)", action: handleSendQuiz },
                { label: "WOW Fakt", icon: <Sparkles size={15} />, color: "#7B2FBE", bg: "rgba(123,47,190,0.12)", action: handleSendWow },
                { label: "5 daq tanaffus", icon: <Coffee size={15} />, color: "#0D9373", bg: "rgba(13,147,115,0.12)", action: () => handleBreak(5) },
                { label: "E'lon", icon: <Megaphone size={15} />, color: "#1B4FD8", bg: "rgba(27,79,216,0.12)", action: () => setShowAnnounce(true) },
              ].map((a) => (
                <button key={a.label} onClick={a.action}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-white/10 hover:border-white/20 transition hover:-translate-y-0.5"
                  style={{ background: a.bg }}>
                  <div style={{ color: a.color }}>{a.icon}</div>
                  <span className="text-xs font-bold text-slate-300 text-center leading-tight">{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Recommendation */}
          <AnimatePresence mode="wait">
            <motion.div key={tipIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="rounded-2xl border border-[#7B2FBE]/25 p-4"
              style={{ background: "linear-gradient(135deg, rgba(27,79,216,0.08), rgba(123,47,190,0.1))" }}>
              <div className="flex items-center gap-2 mb-2">
                <Brain size={14} className="text-[#A78BFA]" />
                <span className="text-xs font-bold text-[#A78BFA] uppercase tracking-wider">AI Maslahat</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">{AI_TIPS_LIVE[tipIdx]}</p>
              {avgAttention > 0 && avgAttention < 65 && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-[#E84855] font-bold">⚠️ Diqqat {avgAttention}% — harakat tavsiya</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Session stats */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Sessiya</p>
            <div className="space-y-2.5">
              {[
                { label: "Xona kodi", value: roomCode, mono: true },
                { label: "Talabalar", value: `${participants.length} nafar` },
                { label: "Vaqt", value: formatTime(elapsedSeconds), mono: true },
                { label: "Slayd", value: slides.length > 0 ? `${slideIdx + 1}/${slides.length}` : "—" },
                { label: "Savol", value: String(studentQuestions.length) },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">{item.label}</span>
                  <span className={`font-bold ${item.mono ? "font-mono bg-white/5 px-2 py-0.5 rounded text-[11px]" : ""}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Announcement Modal ──────────────────────────────── */}
      <AnimatePresence>
        {showAnnounce && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0F0F18] p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold flex items-center gap-2"><Megaphone size={16} className="text-[#1B4FD8]" /> E&apos;lon yuborish</span>
                <button onClick={() => setShowAnnounce(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
              </div>
              <textarea value={announcement} onChange={(e) => setAnnouncement(e.target.value)} rows={3}
                placeholder="Barcha talabalar ekraniga chiqadigan xabar..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#1B4FD8] text-sm resize-none mb-3 transition" />
              <button onClick={handleAnnounce} disabled={!announcement.trim()}
                className="w-full py-3 rounded-xl bg-[#1B4FD8] text-white font-bold disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-[#2563eb] transition">
                <Send size={14} /> Yuborish
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── End Lesson Confirm ──────────────────────────────── */}
      <AnimatePresence>
        {showEndConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl border border-red-500/20 bg-[#0F0F18] p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400 mx-auto mb-4">
                <StopCircle size={28} />
              </div>
              <h3 className="text-xl font-bold mb-2">Darsni yakunlash?</h3>
              <p className="text-slate-400 text-sm mb-6">Barcha talabalar sessiyadan chiqariladi va natijalar saqlanadi.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowEndConfirm(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 font-bold text-slate-300 hover:bg-white/10 transition">
                  Bekor
                </button>
                <button onClick={handleEndLesson}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition">
                  Ha, tugatish
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
