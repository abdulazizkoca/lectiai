"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";
import QRCode from "react-qr-code";
import {
  Video, Users, Clock, QrCode, StopCircle, Eye,
  Radio, ChevronRight, Sparkles, MessageSquare, HandMetal,
  Brain, BarChart2, Send, Plus, X, Play, ChevronLeft,
  Wifi, WifiOff, Coffee, Megaphone, BookOpen, FolderOpen,
  Maximize2, Minimize2, FileText, AlignLeft, Layers,
  ChevronDown, Bell, Zap, Upload, Loader2
} from "lucide-react";
import { CameraBlock } from "@/components/professor/CameraBlock";
import Link from "next/link";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_URL = SOCKET_URL;

// ─── Fullscreen Presentation Overlay ──────────────────────────
function FullscreenOverlay({
  displayMode, slides, slideIdx, changeSlide, originalTopicText,
  lessonTitle, lessonTopic, onClose
}: {
  displayMode: "slides" | "referat";
  slides: any[];
  slideIdx: number;
  changeSlide: (i: number) => void;
  originalTopicText: string;
  lessonTitle: string;
  lessonTopic: string;
  onClose: () => void;
}) {
  const currentSlide = slides[slideIdx];
  const [showControls, setShowControls] = useState(true);
  const hideRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide controls after 3s idle
  const resetHide = () => {
    setShowControls(true);
    if (hideRef.current) clearTimeout(hideRef.current);
    hideRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  useEffect(() => {
    resetHide();
    return () => { if (hideRef.current) clearTimeout(hideRef.current); };
  }, [slideIdx]);

  // Keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === "ArrowDown") changeSlide(Math.min(slides.length - 1, slideIdx + 1));
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") changeSlide(Math.max(0, slideIdx - 1));
      resetHide();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [slideIdx, slides.length, onClose, changeSlide]);

  return (
    <div
      className="fixed inset-0 z-[200] bg-[#020408] flex flex-col select-none"
      onMouseMove={resetHide}
      onClick={resetHide}
    >
      {/* Top controls */}
      <motion.div
        animate={{ opacity: showControls ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">To'liq ekran</span>
          </div>
          <span className="text-white font-bold truncate max-w-xs">{lessonTitle}</span>
          {lessonTopic && <span className="text-xs text-[#F5A623] border border-[#F5A623]/30 rounded-full px-2 py-0.5">{lessonTopic}</span>}
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
        >
          <Minimize2 size={16} />
        </button>
      </motion.div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-10 overflow-hidden">
        <AnimatePresence mode="wait">
          {displayMode === "slides" && currentSlide ? (
            <motion.div
              key={slideIdx}
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-5xl"
            >
              <div className="mb-6 flex items-center gap-3">
                <span className="text-[#F5A623] font-mono text-sm font-bold opacity-60">
                  {slideIdx + 1} / {slides.length}
                </span>
                {lessonTopic && <span className="text-slate-500 text-sm">· {lessonTopic}</span>}
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-8 drop-shadow-lg">
                {currentSlide.title}
              </h1>
              <div className="text-xl md:text-2xl text-slate-200 leading-relaxed font-light">
                {currentSlide.content?.split("\n").map((line: string, i: number) => (
                  <p key={i} className={line.trim() ? "mb-4" : "mb-2"}>{line}</p>
                ))}
              </div>
            </motion.div>
          ) : displayMode === "referat" ? (
            <motion.div
              key="referat-fs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full max-w-4xl h-full overflow-y-auto"
            >
              <h2 className="text-2xl font-bold text-[#0D9373] mb-6 flex items-center gap-2">
                <AlignLeft size={22} /> {lessonTitle}
              </h2>
              {originalTopicText ? (
                <div className="space-y-2">
                  {originalTopicText.split("\n").map((line, i) => {
                    const trimmed = line.trim();
                    if (!trimmed) return <div key={i} className="h-3" />;
                    const isH = /^#{1,3}\s/.test(trimmed) || /^(\d+[.):\-]\s)/.test(trimmed);
                    return isH ? (
                      <h3 key={i} className="text-xl font-bold text-white mt-6 mb-2 border-l-4 border-[#0D9373] pl-4">
                        {trimmed.replace(/^#{1,3}\s/, "").replace(/^(\d+[.):\-]\s)/, "")}
                      </h3>
                    ) : (
                      <p key={i} className="text-lg text-slate-300 leading-relaxed">{trimmed}</p>
                    );
                  })}
                </div>
              ) : slides.map((s, i) => (
                <div key={i} className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-slate-300 leading-relaxed">{s.content}</p>
                </div>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      {displayMode === "slides" && slides.length > 0 && (
        <motion.div
          animate={{ opacity: showControls ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-6 py-5"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}
        >
          <button
            onClick={() => changeSlide(Math.max(0, slideIdx - 1))}
            disabled={slideIdx === 0}
            className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center text-white transition"
          >
            <ChevronLeft size={22} />
          </button>

          {/* Dot indicators */}
          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => changeSlide(i)}
                className={`rounded-full transition-all ${i === slideIdx ? "w-6 h-2.5 bg-[#F5A623]" : "w-2.5 h-2.5 bg-white/25 hover:bg-white/50"}`}
              />
            ))}
          </div>

          <button
            onClick={() => changeSlide(Math.min(slides.length - 1, slideIdx + 1))}
            disabled={slideIdx === slides.length - 1}
            className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center text-white transition"
          >
            <ChevronRight size={22} />
          </button>
        </motion.div>
      )}

      {/* Hint */}
      <motion.div
        animate={{ opacity: showControls ? 0.4 : 0 }}
        className="absolute bottom-4 right-6 text-xs text-slate-500"
      >
        Esc — chiqish · ← → — almashtirish
      </motion.div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────
type Participant = { name: string; status: "green" | "yellow" | "red"; attention: number; handRaised?: boolean };
type PollOption = { text: string; votes: number };
type Poll = { question: string; options: PollOption[]; active: boolean };
type StudentQuestion = { name: string; text: string; time: string };
type MainTab = "slides" | "camera" | "poll" | "chat";
type DisplayMode = "slides" | "referat";

const SLIDE_GRADIENTS = [
  "from-[#0d1b2e] to-[#1a2e4a]",
  "from-[#0d1f0d] to-[#1a2e1a]",
  "from-[#1a0d2e] to-[#2e1a4a]",
  "from-[#2e1a0d] to-[#4a2e1a]",
  "from-[#0d1f2e] to-[#1a2e4a]",
];

const AI_TIPS = [
  "Diqqat 70% dan pastga tushsa — jonli savol bering yoki WOW fakt ko'rsating",
  "10 daqiqada bir marta talabalardan so'rov o'tkazing",
  "Qo'l ko'targan talabaga albatta javob bering — aktivlik oshadi",
  "Test yuborish diqqatni 85% gacha oshirishi mumkin",
  "Yangi mavzuga o'tishdan oldin qisqa takrorlash o'tkazing",
];

function genRoomCode() {
  return "LECTIO-" + Math.random().toString(36).substring(2, 6).toUpperCase();
}

// ─── Pre-session Setup Modal ───────────────────────────────────
function SetupModal({ onStart }: { onStart: (lesson: any | null) => void }) {
  const [lessons, setLessons] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [tab, setTab] = useState<"lessons" | "pptx">("lessons");
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const pptxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const ls = JSON.parse(localStorage.getItem("lectio_professor_lessons") || "[]");
    setLessons(ls);
  }, []);

  const handlePptxFile = async (file: File) => {
    if (!file.name.endsWith(".pptx")) {
      setUploadErr("Faqat PPTX fayl qabul qilinadi"); return;
    }
    setUploading(true); setUploadErr("");
    const token = localStorage.getItem("lectio_token") || "";
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${API_URL}/api/materials/parse-presentation`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ detail: "Xatolik" }));
        throw new Error(e.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const synLesson = {
        id: `pptx_${Date.now()}`,
        title: file.name.replace(/\.[^.]+$/, ""),
        topic: "Prezentatsiya",
        presentation_data: { slides: data.slides, title: file.name.replace(/\.[^.]+$/, ""), original_topic_text: null },
        createdAt: new Date().toISOString(),
      };
      // Save to lessons list for future sessions
      const ls = JSON.parse(localStorage.getItem("lectio_professor_lessons") || "[]");
      localStorage.setItem("lectio_professor_lessons", JSON.stringify([synLesson, ...ls]));
      onStart(synLesson);
    } catch (e: any) {
      setUploadErr(e.message || "Yuklashda xatolik");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="w-full max-w-2xl rounded-2xl border border-white/10 overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0f1118, #141720)" }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#E84855]/10 border border-[#E84855]/20 flex items-center justify-center shrink-0">
            <Radio size={22} className="text-[#E84855]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-white">Jonli Dars Boshlash</h2>
            <p className="text-sm text-slate-400 mt-0.5">Qaysi darsni o&apos;tmoqchisiz?</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-2 border-b border-white/8 bg-white/[0.02]">
          <button onClick={() => setTab("lessons")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition ${tab === "lessons" ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"}`}>
            <BookOpen size={14} /> AI Darslar
          </button>
          <button onClick={() => setTab("pptx")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition ${tab === "pptx" ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"}`}>
            <Upload size={14} /> PPTX Yuklash
          </button>
        </div>

        {/* Tab content */}
        {tab === "pptx" ? (
          /* PPTX Upload panel */
          <div className="p-6 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#F5A623]/10 border border-[#F5A623]/20 flex items-center justify-center">
              <Upload size={28} className="text-[#F5A623]" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-white mb-1">PPTX Prezentatsiya Yuklash</h3>
              <p className="text-sm text-slate-400">Tayyor PowerPoint prezentatsiyangizni jonli darsda ishlating</p>
            </div>
            <input
              ref={pptxRef}
              type="file"
              accept=".pptx"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePptxFile(f); }}
            />
            <button
              onClick={() => pptxRef.current?.click()}
              disabled={uploading}
              className="px-6 py-3 rounded-xl bg-[#F5A623] text-black font-bold flex items-center gap-2 hover:bg-amber-400 transition disabled:opacity-50"
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {uploading ? "Slaydlar tayyorlanmoqda..." : "PPTX Faylni Tanlash"}
            </button>
            {uploadErr && (
              <p className="text-sm text-[#E84855] flex items-center gap-1.5">
                <X size={14} /> {uploadErr}
              </p>
            )}
            <p className="text-xs text-slate-600">Slaydlar avtomatik tarzda ajratib olinadi</p>
          </div>
        ) : (
          /* Lessons list */
          <div className="p-4 max-h-[380px] overflow-y-auto space-y-2">
            {lessons.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-5xl mb-3">📚</div>
                <p className="font-bold text-white mb-1">Darslar yo&apos;q</p>
                <p className="text-sm text-slate-400 mb-4">Metodichka yuklab, AI dars yarating</p>
                <div className="flex gap-2 justify-center">
                  <Link href="/professor/materials"
                    className="px-4 py-2 rounded-xl bg-[#0D9373]/15 border border-[#0D9373]/25 text-[#0D9373] text-sm font-bold hover:bg-[#0D9373]/25 transition">
                    Metodichka yuklash
                  </Link>
                  <Link href="/professor/create-lesson"
                    className="px-4 py-2 rounded-xl bg-[#F5A623]/15 border border-[#F5A623]/25 text-[#F5A623] text-sm font-bold hover:bg-[#F5A623]/25 transition">
                    Dars yaratish
                  </Link>
                </div>
              </div>
            ) : (
              lessons.map((lesson) => {
                const slideCount = lesson.presentation_data?.slides?.length || 0;
                const quizCount = lesson.presentation_data?.quiz?.length || 0;
                const hasOrigText = !!lesson.presentation_data?.original_topic_text;
                const isSelected = selected?.id === lesson.id;
                return (
                  <motion.button
                    key={lesson.id}
                    onClick={() => setSelected(isSelected ? null : lesson)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition text-left ${
                      isSelected
                        ? "border-[#F5A623]/60 bg-[#F5A623]/8"
                        : "border-white/8 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition ${isSelected ? "bg-[#F5A623]/20" : "bg-white/8"}`}>
                      <BookOpen size={18} className={isSelected ? "text-[#F5A623]" : "text-slate-400"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold truncate transition ${isSelected ? "text-[#F5A623]" : "text-white"}`}>
                        {lesson.title || lesson.presentation_data?.title || "Mavzusiz dars"}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {lesson.topic || lesson.presentation_data?.subject || "Umumiy fan"}
                      </p>
                      <div className="flex gap-3 mt-1.5">
                        {slideCount > 0 && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Layers size={10} /> {slideCount} slayd
                          </span>
                        )}
                        {quizCount > 0 && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Zap size={10} /> {quizCount} test
                          </span>
                        )}
                        {hasOrigText && (
                          <span className="text-[11px] text-[#0D9373] flex items-center gap-1">
                            <AlignLeft size={10} /> Referat
                          </span>
                        )}
                        {lesson.createdAt && (
                          <span className="text-[11px] text-slate-600">
                            {new Date(lesson.createdAt).toLocaleDateString("uz-UZ")}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[#F5A623] flex items-center justify-center shrink-0">
                        <ChevronRight size={12} className="text-black" />
                      </div>
                    )}
                  </motion.button>
                );
              })
            )}
          </div>
        )}

        {/* Footer */}
        {tab === "lessons" && (
        <div className="px-4 pb-4 flex gap-3">
          {lessons.length > 0 && (
            <button
              onClick={() => onStart(selected)}
              className={`flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${
                selected
                  ? "bg-[#E84855] text-white hover:bg-red-600"
                  : "bg-white/8 border border-white/10 text-slate-300 hover:bg-white/12"
              }`}
            >
              <Radio size={16} />
              {selected ? `"${(selected.title || "Dars").slice(0, 30)}" bilan boshlash` : "Slaydlarsiz boshlash"}
            </button>
          )}
          {lessons.length === 0 && (
            <button onClick={() => onStart(null)}
              className="flex-1 py-3.5 rounded-xl bg-white/8 border border-white/10 text-slate-300 font-bold text-sm hover:bg-white/12 transition flex items-center justify-center gap-2">
              <Radio size={16} /> Slaydlarsiz boshlash
            </button>
          )}
        </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────
export default function LiveLessonPage() {
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();

  // Session state
  const [activeSession, setActiveSession] = useState<any>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [connected, setConnected] = useState(false);

  // Content
  const [slides, setSlides] = useState<any[]>([]);
  const [slideIdx, setSlideIdx] = useState(0);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("slides");
  const [showNotes, setShowNotes] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [originalTopicText, setOriginalTopicText] = useState<string>("");

  // Participants
  const [participants, setParticipants] = useState<Participant[]>([]);

  // Poll
  const [poll, setPoll] = useState<Poll | null>(null);
  const [pollQ, setPollQ] = useState("");
  const [pollOpts, setPollOpts] = useState(["", "", ""]);
  const [showPollCreate, setShowPollCreate] = useState(false);

  // Questions
  const [studentQuestions, setStudentQuestions] = useState<StudentQuestion[]>([]);

  // UI
  const [activeTab, setActiveTab] = useState<MainTab>("slides");
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [tipIdx, setTipIdx] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [breakActive, setBreakActive] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [showAnnounce, setShowAnnounce] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const breakRef = useRef<NodeJS.Timeout | null>(null);
  const tipRef = useRef<NodeJS.Timeout | null>(null);
  const slideAreaRef = useRef<HTMLDivElement>(null);

  // ── Load lesson slides + original text ─────────────────────
  const loadSlides = useCallback((session: any) => {
    if (!session?.lessonId) return;
    const saved = JSON.parse(localStorage.getItem("lectio_professor_lessons") || "[]");
    const lesson = saved.find((l: any) => l.id === session.lessonId);
    if (lesson?.presentation_data?.slides?.length > 0) {
      setSlides(lesson.presentation_data.slides);
      if (lesson.presentation_data?.original_topic_text) {
        setOriginalTopicText(lesson.presentation_data.original_topic_text);
      }
      setActiveTab("slides");
    } else {
      setActiveTab("camera");
    }
  }, []);

  // ── Init: load session or show setup ───────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("lectio_active_session");
    if (stored) {
      const session = JSON.parse(stored);
      setActiveSession(session);
      loadSlides(session);
    } else {
      setShowSetup(true);
    }
  }, [loadSlides]);

  // ── Timer ──────────────────────────────────────────────────
  useEffect(() => {
    if (!activeSession) return;
    timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    tipRef.current = setInterval(() => setTipIdx((i) => (i + 1) % AI_TIPS.length), 12000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (tipRef.current) clearInterval(tipRef.current);
    };
  }, [activeSession]);

  // ── Socket ─────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("room_joined", (data: { participant_count: number; nickname_list: string[] }) => {
      setParticipants(data.nickname_list.map((name) => ({ name, status: "green", attention: 85, handRaised: false })));
    });
    socket.on("student_attention", (data: { nickname: string; attention: number }) => {
      const att = Math.round(data.attention);
      const status = att >= 70 ? "green" : att >= 40 ? "yellow" : "red" as any;
      setParticipants((prev) => {
        const idx = prev.findIndex((p) => p.name === data.nickname);
        if (idx === -1) return [...prev, { name: data.nickname, status, attention: att, handRaised: false }];
        const upd = [...prev]; upd[idx] = { ...upd[idx], status, attention: att };
        return upd;
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
    socket.on("poll_vote", (data: { option_index: number }) => {
      setPoll((prev) => {
        if (!prev) return prev;
        const opts = [...prev.options];
        if (opts[data.option_index]) opts[data.option_index] = { ...opts[data.option_index], votes: opts[data.option_index].votes + 1 };
        return { ...prev, options: opts };
      });
    });
    return () => { socket.disconnect(); };
  }, [addToast]);

  // ── Keyboard navigation ────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isFullscreen || showAnnounce || showEndConfirm || showSetup) return;
      if (activeTab !== "slides") return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") changeSlide(Math.min(slides.length - 1, slideIdx + 1));
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") changeSlide(Math.max(0, slideIdx - 1));
      if (e.key === "f" || e.key === "F") setIsFullscreen(true);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeTab, slideIdx, slides.length, showAnnounce, showEndConfirm, showSetup, isFullscreen]);

  // ── Helpers ────────────────────────────────────────────────
  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const avgAttention = participants.length > 0
    ? Math.round(participants.reduce((a, p) => a + p.attention, 0) / participants.length) : 0;
  const greenCount = participants.filter((p) => p.status === "green").length;
  const yellowCount = participants.filter((p) => p.status === "yellow").length;
  const redCount = participants.filter((p) => p.status === "red").length;
  const handCount = participants.filter((p) => p.handRaised).length;

  const changeSlide = (idx: number) => {
    setSlideIdx(idx);
    if (activeSession?.roomCode) {
      socketRef.current?.emit("slide_changed", { room_code: activeSession.roomCode, index: idx });
    }
  };

  // ── Start session from setup ───────────────────────────────
  const handleStartSession = (lesson: any | null) => {
    const roomCode = genRoomCode();
    const session = {
      sessionId: Date.now().toString(),
      lessonId: lesson?.id || null,
      lessonTitle: lesson?.title || lesson?.presentation_data?.title || "Jonli Dars",
      lessonTopic: lesson?.topic || lesson?.presentation_data?.subject || "",
      roomCode,
    };
    localStorage.setItem("lectio_active_session", JSON.stringify(session));
    setActiveSession(session);
    if (lesson?.presentation_data?.slides?.length > 0) {
      setSlides(lesson.presentation_data.slides);
      if (lesson.presentation_data?.original_topic_text) {
        setOriginalTopicText(lesson.presentation_data.original_topic_text);
      }
      setActiveTab("slides");
    } else {
      setActiveTab("camera");
    }
    setShowSetup(false);
    socketRef.current?.emit("create_room", {
      room_code: roomCode,
      lesson_id: lesson?.id,
      questions: lesson?.presentation_data?.quiz || [],
      settings: {},
    });
    addToast({ title: "✅ Dars boshlandi!", description: `Kod: ${roomCode}`, type: "success" });
  };

  // ── Actions ────────────────────────────────────────────────
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
    const saved = JSON.parse(localStorage.getItem("lectio_professor_lessons") || "[]");
    const lesson = saved.find((l: any) => l.id === activeSession?.lessonId);
    const wowFact = lesson?.presentation_data?.wow_facts?.[0] || lesson?.wow_fact || "Bu mavzu haqida juda qiziqarli fakt bor!";
    socketRef.current?.emit("wow_fact", { room_code: activeSession?.roomCode, fact: wowFact });
    addToast({ title: "✨ WOW Fakt!", description: wowFact.slice(0, 70), type: "success" });
  };

  const handleAnnounce = () => {
    if (!announcement.trim()) return;
    socketRef.current?.emit("announcement", { room_code: activeSession?.roomCode, text: announcement });
    addToast({ title: "📢 E'lon yuborildi", description: announcement, type: "success" });
    setAnnouncement(""); setShowAnnounce(false);
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
    addToast({ title: "📊 So'rovnoma boshlandi", type: "success" });
  };

  const handleEndLesson = () => {
    localStorage.removeItem("lectio_active_session");
    socketRef.current?.emit("end_lesson", { room_code: activeSession?.roomCode });
    addToast({ title: "Dars yakunlandi", description: "Analitika sahifasiga o'tilmoqda...", type: "info" });
    setTimeout(() => router.push("/professor/analytics"), 1500);
  };

  const roomCode = activeSession?.roomCode || "—";
  const lessonTitle = activeSession?.lessonTitle || "Jonli Dars";
  const lessonTopic = activeSession?.lessonTopic || "";
  const joinUrl = typeof window !== "undefined" ? `${window.location.origin}/join?code=${roomCode}` : `/join?code=${roomCode}`;
  const currentSlide = slides[slideIdx];
  const slideGradient = SLIDE_GRADIENTS[slideIdx % SLIDE_GRADIENTS.length];

  const TABS: { id: MainTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "slides", label: "Slaydlar", icon: <Layers size={13} />, badge: slides.length > 0 ? slides.length : undefined },
    { id: "camera", label: "Kamera", icon: <Video size={13} /> },
    { id: "poll", label: "So'rov", icon: <BarChart2 size={13} />, badge: poll?.active ? poll.options.reduce((a, o) => a + o.votes, 0) : undefined },
    { id: "chat", label: "Savollar", icon: <MessageSquare size={13} />, badge: studentQuestions.length > 0 ? studentQuestions.length : undefined },
  ];

  // ── Pre-session setup ──────────────────────────────────────
  if (showSetup) {
    return (
      <div className="min-h-full bg-transparent text-white">
        <ToastContainer toasts={toasts} onClose={removeToast} />
        <SetupModal onStart={handleStartSession} />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-transparent text-white p-4 md:p-5 relative z-10">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* ── Fullscreen overlay ──────────────────────────────── */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            key="fullscreen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <FullscreenOverlay
              displayMode={displayMode}
              slides={slides}
              slideIdx={slideIdx}
              changeSlide={changeSlide}
              originalTopicText={originalTopicText}
              lessonTitle={lessonTitle}
              lessonTopic={lessonTopic}
              onClose={() => setIsFullscreen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="flex items-center gap-3 mb-4 flex-wrap">
        {/* Live indicator + title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative h-3 w-3 rounded-full bg-red-500" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-black text-white tracking-tight truncate">{lessonTitle}</h1>
              {lessonTopic && (
                <span className="px-2 py-0.5 rounded-full bg-[#F5A623]/15 border border-[#F5A623]/25 text-[#F5A623] text-[11px] font-bold truncate max-w-[140px]">
                  {lessonTopic}
                </span>
              )}
              <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${connected ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                {connected ? <Wifi size={9} /> : <WifiOff size={9} />}
                {connected ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </div>

        {/* Center — Timer + code */}
        <div className="flex items-center gap-2">
          {breakActive && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D9373]/20 border border-[#0D9373]/30 text-[#0D9373] text-xs font-bold">
              <Coffee size={12} /> {formatTime(breakSeconds)}
            </motion.div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono">
            <Clock size={12} className="text-slate-400" />
            <span className="font-bold">{formatTime(elapsedSeconds)}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F5A623]/10 border border-[#F5A623]/30 text-xs">
            <span className="text-slate-400">Kod:</span>
            <span className="font-mono font-black text-[#F5A623]">{roomCode}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAnnounce(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1B4FD8]/15 border border-[#1B4FD8]/25 text-[#6B8FFF] hover:bg-[#1B4FD8]/25 text-xs font-bold transition">
            <Megaphone size={13} /> E&apos;lon
          </button>
          <button onClick={() => setShowEndConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 text-xs font-bold transition">
            <StopCircle size={13} /> Tugatish
          </button>
        </div>
      </header>

      {/* ── Main 3-column Grid ──────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">

        {/* ── Left: Participants ─── */}
        <div className="xl:col-span-3 space-y-3">

          {/* Attention card */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Eye size={11} /> Diqqat
              </span>
              <span className="text-2xl font-black" style={{
                color: participants.length === 0 ? "#475569"
                  : avgAttention >= 70 ? "#0D9373"
                  : avgAttention >= 50 ? "#F5A623"
                  : "#E84855"
              }}>
                {participants.length > 0 ? `${avgAttention}%` : "—"}
              </span>
            </div>
            {participants.length > 0 && (
              <>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-2.5">
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
                    <div key={s.label} className="rounded-lg p-1.5" style={{ background: `${s.color}18` }}>
                      <p className="font-black text-base" style={{ color: s.color }}>{s.count}</p>
                      <p className="text-[10px] text-slate-500 leading-tight">{s.label}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Participants list */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.025] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users size={11} /> Talabalar
              </span>
              <span className="text-sm font-black text-[#F5A623]">{participants.length}</span>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {participants.length === 0 ? (
                <div className="p-5 text-center">
                  <div className="text-3xl mb-1.5">⏳</div>
                  <p className="text-slate-500 text-xs">Talabalar kutilmoqda...</p>
                  <p className="text-[11px] text-slate-600 mt-0.5 font-mono">{roomCode}</p>
                </div>
              ) : (
                participants.map((p, i) => (
                  <motion.div key={p.name}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition border-b border-white/[0.04] last:border-0">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                      style={{ background: p.status === "green" ? "rgba(13,147,115,0.2)" : p.status === "yellow" ? "rgba(245,166,35,0.2)" : "rgba(232,72,85,0.2)", color: p.status === "green" ? "#0D9373" : p.status === "yellow" ? "#F5A623" : "#E84855" }}>
                      {p.name[0]?.toUpperCase()}
                    </div>
                    <span className="flex-1 text-xs font-medium truncate text-slate-200">{p.name}</span>
                    {p.handRaised && <HandMetal size={11} className="text-[#F5A623] shrink-0" />}
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">{p.attention}%</span>
                  </motion.div>
                ))
              )}
            </div>
            {handCount > 0 && (
              <div className="px-4 py-1.5 border-t border-[#F5A623]/20 bg-[#F5A623]/5">
                <p className="text-[11px] font-bold text-[#F5A623] flex items-center gap-1.5">
                  <HandMetal size={11} /> {handCount} kishi qo&apos;l ko&apos;targan
                </p>
              </div>
            )}
          </div>

          {/* QR Code */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-3 text-center">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-center gap-1">
              <QrCode size={11} /> Kirish QR
            </p>
            <div className="bg-white p-2 rounded-xl inline-block mb-1.5">
              <QRCode value={joinUrl} size={72} />
            </div>
            <p className="text-[10px] text-slate-500">Skan qiling yoki kodni kiriting</p>
          </div>
        </div>

        {/* ── Center: Main Content ─── */}
        <div className="xl:col-span-6 space-y-3">

          {/* Tab bar */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/8">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold transition relative ${activeTab === tab.id ? "bg-white/10 text-white shadow" : "text-slate-500 hover:text-slate-300"}`}>
                {tab.icon} {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[#E84855] text-white text-[9px] rounded-full flex items-center justify-center font-black px-1">
                    {tab.badge > 9 ? "9+" : tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">

            {/* ── SLIDES / PRESENTATION ───────────────────── */}
            {activeTab === "slides" && (
              <motion.div key="slides" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {slides.length === 0 ? (
                  <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-10 text-center">
                    <div className="text-5xl mb-3">📊</div>
                    <p className="font-bold text-white mb-1">Slaydlar yuklanmagan</p>
                    <p className="text-slate-400 text-sm mb-4">AI metodichkangizdan slaydlar yaratadi</p>
                    <div className="flex gap-2 justify-center">
                      <Link href="/professor/materials"
                        className="px-4 py-2 rounded-xl bg-[#0D9373]/15 border border-[#0D9373]/25 text-[#0D9373] text-sm font-bold hover:bg-[#0D9373]/25 transition">
                        Metodichka yuklash
                      </Link>
                      <Link href="/professor/create-lesson"
                        className="px-4 py-2 rounded-xl bg-[#F5A623]/15 border border-[#F5A623]/25 text-[#F5A623] text-sm font-bold hover:bg-[#F5A623]/25 transition">
                        Dars yaratish
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Display mode toggle + fullscreen */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1 p-1 rounded-lg bg-white/[0.04] border border-white/8">
                        <button onClick={() => setDisplayMode("slides")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition ${displayMode === "slides" ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"}`}>
                          <Layers size={12} /> Slaydlar
                        </button>
                        <button onClick={() => setDisplayMode("referat")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition ${displayMode === "referat" ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"}`}>
                          <AlignLeft size={12} /> Referat
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <span className="text-[#F5A623] font-mono">{slideIdx + 1}</span>
                          <span>/ {slides.length}</span>
                          <span className="ml-1 text-slate-600 hidden md:inline">← →</span>
                        </div>
                        <button
                          onClick={() => setIsFullscreen(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/8 text-[11px] font-bold text-slate-400 hover:text-white hover:bg-white/10 transition"
                          title="To'liq ekran (F)"
                        >
                          <Maximize2 size={12} /> To'liq ekran
                        </button>
                      </div>
                    </div>

                    {/* ── SLIDE VIEW ── */}
                    {displayMode === "slides" && (
                      <div ref={slideAreaRef}>
                        {/* Main slide card */}
                        <div className={`rounded-2xl overflow-hidden bg-gradient-to-br ${slideGradient} border border-white/8`}
                          style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
                          {/* Slide header */}
                          <div className="flex items-center justify-between px-6 pt-5 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-[#F5A623] uppercase tracking-[0.2em]">
                                SLAYD {slideIdx + 1} / {slides.length}
                              </span>
                              {lessonTopic && (
                                <span className="text-[10px] text-slate-500">· {lessonTopic}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setShowNotes(!showNotes)}
                                className={`p-1.5 rounded-lg transition text-[11px] font-bold flex items-center gap-1 ${showNotes ? "bg-[#F5A623]/15 text-[#F5A623]" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"}`}>
                                <FileText size={12} /> Eslatma
                              </button>
                            </div>
                          </div>

                          {/* Slide content */}
                          <AnimatePresence mode="wait">
                            <motion.div key={slideIdx}
                              initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                              transition={{ type: "spring", stiffness: 320, damping: 32 }}
                              className="px-8 py-6 min-h-[240px]"
                            >
                              <h1 className="text-2xl md:text-3xl font-black text-white mb-5 leading-tight">
                                {currentSlide?.title || `Slayd ${slideIdx + 1}`}
                              </h1>
                              <p className="text-slate-200 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                                {currentSlide?.content}
                              </p>
                              {currentSlide?.duration_min && (
                                <div className="mt-5 flex items-center gap-1.5 text-xs text-slate-600">
                                  <Clock size={11} /> ~{currentSlide.duration_min} daqiqa
                                </div>
                              )}
                            </motion.div>
                          </AnimatePresence>

                          {/* Navigation */}
                          <div className="px-6 pb-5 flex items-center justify-between gap-3">
                            <button onClick={() => changeSlide(Math.max(0, slideIdx - 1))} disabled={slideIdx === 0}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/8 hover:bg-white/14 disabled:opacity-30 transition text-xs font-bold text-slate-300">
                              <ChevronLeft size={14} /> Oldingi
                            </button>

                            {/* Dot indicators */}
                            <div className="flex gap-1.5 items-center flex-wrap justify-center">
                              {slides.map((_, i) => (
                                <button key={i} onClick={() => changeSlide(i)}
                                  className="rounded-full transition-all duration-200"
                                  style={{
                                    width: i === slideIdx ? "20px" : "6px",
                                    height: "6px",
                                    background: i === slideIdx ? "#F5A623" : "rgba(255,255,255,0.2)",
                                  }} />
                              ))}
                            </div>

                            <button onClick={() => changeSlide(Math.min(slides.length - 1, slideIdx + 1))} disabled={slideIdx === slides.length - 1}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/8 hover:bg-white/14 disabled:opacity-30 transition text-xs font-bold text-slate-300">
                              Keyingi <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Speaker notes */}
                        <AnimatePresence>
                          {showNotes && currentSlide?.notes && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                              className="rounded-xl border border-[#F5A623]/20 bg-[#F5A623]/5 p-4 overflow-hidden"
                            >
                              <p className="text-[11px] font-bold text-[#F5A623] mb-1.5 flex items-center gap-1.5">
                                <FileText size={11} /> Professor eslatmasi (talabalar ko&apos;rmaydi)
                              </p>
                              <p className="text-sm text-slate-300 leading-relaxed">{currentSlide.notes}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* ── REFERAT VIEW ── */}
                    {displayMode === "referat" && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="rounded-2xl border border-white/8 bg-white/[0.025] overflow-hidden">
                        <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlignLeft size={14} className="text-[#0D9373]" />
                            <span className="text-sm font-bold">{lessonTitle}</span>
                            {lessonTopic && <span className="text-xs text-slate-400">· {lessonTopic}</span>}
                          </div>
                          {originalTopicText && (
                            <span className="text-[11px] text-[#0D9373] border border-[#0D9373]/30 rounded-full px-2 py-0.5 font-bold">
                              Metodichkadan
                            </span>
                          )}
                        </div>

                        {originalTopicText ? (
                          /* Metodichkadan asl matn */
                          <div className="max-h-[500px] overflow-y-auto p-5">
                            <div className="prose prose-sm prose-invert max-w-none">
                              {originalTopicText.split("\n").map((line, i) => {
                                const trimmed = line.trim();
                                if (!trimmed) return <div key={i} className="h-3" />;
                                const isHeading = /^#{1,3}\s/.test(trimmed) || /^(\d+[.):\-]\s)/.test(trimmed);
                                return isHeading ? (
                                  <h4 key={i} className="font-bold text-white mt-4 mb-1 text-sm border-l-2 border-[#0D9373] pl-3">
                                    {trimmed.replace(/^#{1,3}\s/, "").replace(/^(\d+[.):\-]\s)/, "")}
                                  </h4>
                                ) : (
                                  <p key={i} className="text-slate-300 text-sm leading-relaxed mb-1">{trimmed}</p>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          /* Fallback: AI slaydlar hujjat ko'rinishida */
                          <div className="max-h-[480px] overflow-y-auto p-5 space-y-5">
                            {slides.map((slide, i) => (
                              <div key={i}
                                className={`border-l-2 pl-4 cursor-pointer transition hover:opacity-90 ${i === slideIdx ? "border-[#F5A623]" : "border-white/10"}`}
                                onClick={() => setSlideIdx(i)}>
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className={`text-[10px] font-black uppercase tracking-wider ${i === slideIdx ? "text-[#F5A623]" : "text-slate-600"}`}>
                                    {i + 1}
                                  </span>
                                  <h3 className={`font-bold text-sm ${i === slideIdx ? "text-white" : "text-slate-300"}`}>
                                    {slide.title}
                                  </h3>
                                </div>
                                <p className="text-slate-400 text-xs leading-relaxed">{slide.content}</p>
                                {slide.notes && (
                                  <p className="mt-1.5 text-[11px] text-[#F5A623]/70 italic">{slide.notes}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── CAMERA ─────────────────────────────────── */}
            {activeTab === "camera" && (
              <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <CameraBlock sessionId={activeSession?.sessionId || null} />
              </motion.div>
            )}

            {/* ── POLL ───────────────────────────────────── */}
            {activeTab === "poll" && (
              <motion.div key="poll" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                {poll?.active && (
                  <div className="rounded-2xl border border-[#1B4FD8]/25 bg-[#1B4FD8]/5 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-[#6B8FFF] flex items-center gap-1.5">
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
                              <span className="font-mono font-bold text-[#6B8FFF]">{opt.votes} ({pct}%)</span>
                            </div>
                            <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                              <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }}
                                className="h-full rounded-full bg-[#1B4FD8]" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {showPollCreate ? (
                  <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-bold text-sm">Yangi so&apos;rovnoma</span>
                      <button onClick={() => setShowPollCreate(false)} className="text-slate-400 hover:text-white"><X size={15} /></button>
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
                      <Play size={14} /> Boshlash
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setShowPollCreate(true)}
                    className="w-full py-5 rounded-2xl border-2 border-dashed border-white/15 text-slate-400 hover:border-[#1B4FD8]/50 hover:text-[#6B8FFF] transition flex items-center justify-center gap-2 font-bold">
                    <Plus size={16} /> Yangi so&apos;rovnoma yaratish
                  </button>
                )}
              </motion.div>
            )}

            {/* ── CHAT / QUESTIONS ────────────────────────── */}
            {activeTab === "chat" && (
              <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {studentQuestions.length === 0 ? (
                  <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-10 text-center">
                    <MessageSquare size={32} className="text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">Talabalardan savollar yo&apos;q</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[520px] overflow-y-auto">
                    {studentQuestions.map((q, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-white/8 bg-white/[0.025] p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-full bg-[#1B4FD8]/20 flex items-center justify-center text-xs font-black text-[#6B8FFF]">
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

        {/* ── Right: Actions ─── */}
        <div className="xl:col-span-3 space-y-3">

          {/* Quick Actions */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Tezkor amallar</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Quiz", icon: <Radio size={14} />, color: "#F5A623", bg: "rgba(245,166,35,0.1)", border: "rgba(245,166,35,0.2)", action: handleSendQuiz },
                { label: "WOW Fakt", icon: <Sparkles size={14} />, color: "#7B2FBE", bg: "rgba(123,47,190,0.1)", border: "rgba(123,47,190,0.2)", action: handleSendWow },
                { label: "5' Tanaffus", icon: <Coffee size={14} />, color: "#0D9373", bg: "rgba(13,147,115,0.1)", border: "rgba(13,147,115,0.2)", action: () => handleBreak(5) },
                { label: "E'lon", icon: <Megaphone size={14} />, color: "#1B4FD8", bg: "rgba(27,79,216,0.1)", border: "rgba(27,79,216,0.2)", action: () => setShowAnnounce(true) },
              ].map((a) => (
                <button key={a.label} onClick={a.action}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border hover:scale-[1.02] active:scale-95 transition-all"
                  style={{ background: a.bg, borderColor: a.border }}>
                  <div style={{ color: a.color }}>{a.icon}</div>
                  <span className="text-[11px] font-bold text-slate-300 text-center">{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Tip */}
          <AnimatePresence mode="wait">
            <motion.div key={tipIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="rounded-2xl border border-[#7B2FBE]/20 p-4"
              style={{ background: "linear-gradient(135deg, rgba(27,79,216,0.07), rgba(123,47,190,0.09))" }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Brain size={13} className="text-[#A78BFA]" />
                <span className="text-[11px] font-bold text-[#A78BFA] uppercase tracking-wider">AI Maslahat</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{AI_TIPS[tipIdx]}</p>
              {participants.length > 0 && avgAttention < 60 && (
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-[11px] text-[#E84855] font-bold">⚠️ Diqqat {avgAttention}% — harakat kerak</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Session stats */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Sessiya</p>
            <div className="space-y-2">
              {[
                { label: "Xona kodi", value: roomCode, mono: true, color: "#F5A623" },
                { label: "Talabalar", value: `${participants.length} nafar` },
                { label: "Vaqt", value: formatTime(elapsedSeconds), mono: true },
                { label: "Slayd", value: slides.length > 0 ? `${slideIdx + 1}/${slides.length}` : "—" },
                { label: "Savollar", value: String(studentQuestions.length) },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">{item.label}</span>
                  <span className={`font-bold ${item.mono ? "font-mono text-[11px] bg-white/5 px-1.5 py-0.5 rounded" : ""}`}
                    style={{ color: item.color }}>{item.value}</span>
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
                <span className="font-bold flex items-center gap-2"><Megaphone size={15} className="text-[#1B4FD8]" /> E&apos;lon yuborish</span>
                <button onClick={() => setShowAnnounce(false)} className="text-slate-400 hover:text-white"><X size={15} /></button>
              </div>
              <textarea value={announcement} onChange={(e) => setAnnouncement(e.target.value)} rows={3}
                placeholder="Barcha talabalar ekraniga chiqadigan xabar..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#1B4FD8] text-sm resize-none mb-3 transition" />
              <button onClick={handleAnnounce} disabled={!announcement.trim()}
                className="w-full py-3 rounded-xl bg-[#1B4FD8] text-white font-bold disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-[#2563eb] transition">
                <Send size={13} /> Yuborish
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
                <StopCircle size={26} />
              </div>
              <h3 className="text-xl font-black mb-2">Darsni yakunlash?</h3>
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
