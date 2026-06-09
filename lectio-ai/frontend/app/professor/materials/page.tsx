"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Loader2, AlertCircle, ChevronRight, FileText,
  Sparkles, BookOpen, Zap, Upload, X, ArrowLeft, Radio,
  Play, RefreshCw, FilePlus, Brain, Target, HelpCircle,
  ChevronLeft, Eye, Clock, Star, BarChart2, Lightbulb
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────
type Stage =
  | "idle"
  | "uploading"
  | "analyzing_topics"
  | "selecting_topic"
  | "analyzing_lesson"
  | "done"
  | "error";

type ResultTab = "overview" | "slides" | "quiz" | "flashcards" | "glossary" | "exam";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getProfId(): number {
  try { return JSON.parse(localStorage.getItem("lectio_user") || "{}").id || 1; } catch { return 1; }
}

// ─── Progress step configs ────────────────────────────────────
const TOPIC_STEPS = [
  { label: "Fayl qabul qilindi",           pct: 10 },
  { label: "Matn ajratib olindi",           pct: 30 },
  { label: "AI mavzularni tahlil qilmoqda", pct: 55 },
  { label: "Mavzular tayyor!",              pct: 100 },
];
const LESSON_STEPS = [
  { label: "Matn o'qilmoqda",               pct: 15 },
  { label: "AI dars yaratmoqda (Gemini)...", pct: 35 },
  { label: "Slaydlar tayyorlanmoqda",        pct: 60 },
  { label: "Quiz va flashcardlar",           pct: 80 },
  { label: "Dars tayyor!",                   pct: 100 },
];

const FILE_META: Record<string, { icon: string; color: string; bg: string }> = {
  pdf:  { icon: "📕", color: "#E84855", bg: "rgba(232,72,85,0.12)" },
  docx: { icon: "📘", color: "#1B4FD8", bg: "rgba(27,79,216,0.12)" },
  pptx: { icon: "📙", color: "#F5A623", bg: "rgba(245,166,35,0.12)" },
  txt:  { icon: "📄", color: "#0D9373", bg: "rgba(13,147,115,0.12)" },
};

const OPTION_COLORS = ["#E84855", "#1B4FD8", "#0D9373", "#F5A623", "#7B2FBE"];
const LETTERS = ["A", "B", "C", "D", "E"];

// ─── Main Component ───────────────────────────────────────────
export default function MaterialsPage() {
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();

  // State
  const [stage, setStage]             = useState<Stage>("idle");
  const [fileName, setFileName]       = useState("");
  const [fileSize, setFileSize]       = useState("");
  const [fileExt, setFileExt]         = useState("docx");
  const [progress, setProgress]       = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [materialId, setMaterialId]   = useState("");
  const [topics, setTopics]           = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [result, setResult]           = useState<any>(null);
  const [dragActive, setDragActive]   = useState(false);
  const [errorMsg, setErrorMsg]       = useState("");
  const [activeTab, setActiveTab]     = useState<ResultTab>("overview");
  const [slideIdx, setSlideIdx]       = useState(0);
  const [history, setHistory]         = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef<NodeJS.Timeout | null>(null);

  // Load history
  useEffect(() => {
    const h = JSON.parse(localStorage.getItem("lectio_mat_history") || "[]");
    setHistory(h);
    return () => {
      esRef.current?.close();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, []);

  // ── SSE Helper ──────────────────────────────────────────────
  function openSSE(url: string, onDone: () => void, onError: (msg: string) => void) {
    esRef.current?.close();

    const connect = () => {
      const es = new EventSource(url);
      esRef.current = es;
      let lastPct = -1;

      es.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          if (d.percent !== undefined && d.percent !== lastPct) {
            setProgress(d.percent);
            lastPct = d.percent;
          }
          if (d.message) setProgressMsg(d.message);
          if (d.stage === "done")  { es.close(); onDone(); }
          if (d.stage === "error") { es.close(); onError(d.message || "Noma'lum xatolik"); }
        } catch {}
      };

      es.onerror = () => {
        // SSE bağlantısı kesildi — 3 soniyadan keyin qayta urinish
        es.close();
        retryRef.current = setTimeout(() => {
          const prog = JSON.parse(localStorage.getItem(`_sse_stage_${url}`) || "{}");
          if (!prog.done) connect();
        }, 3000);
      };
    };
    connect();
  }

  // ── Poll fallback (SSE ishlamasa) ─────────────────────────
  function pollProgress(materialId: string, endpoint: "progress" | "lesson-progress", onDone: () => void, onError: (m: string) => void) {
    let attempts = 0;
    const poll = async () => {
      attempts++;
      if (attempts > 120) { onError("Vaqt tugadi. Qayta urinib ko'ring."); return; }
      try {
        const r = await fetch(`${API_URL}/api/materials/${materialId}/${endpoint}`);
        if (!r.ok) { setTimeout(poll, 2000); return; }
        // If server doesn't support SSE, just wait for topics
        setTimeout(poll, 2000);
      } catch { setTimeout(poll, 3000); }
    };
    poll();
  }

  // ── File Upload ────────────────────────────────────────────
  const processFile = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!["pdf", "docx", "pptx", "txt"].includes(ext)) {
      setErrorMsg("Faqat PDF, Word (.docx), PowerPoint (.pptx) va TXT fayllar qabul qilinadi.");
      setStage("error"); return;
    }

    const token = localStorage.getItem("lectio_token") || "";
    if (!token || token.startsWith("mock_")) {
      setErrorMsg("auth_required");
      setStage("error");
      return;
    }

    setFileName(file.name); setFileExt(ext);
    setFileSize((file.size / 1024 / 1024).toFixed(2) + " MB");
    setStage("uploading"); setProgress(5);
    setProgressMsg("Fayl yuklanmoqda..."); setErrorMsg("");

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(
        `${API_URL}/api/materials/upload`,
        { method: "POST", body: fd, headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Server xatoligi yuz berdi" }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setMaterialId(data.material_id);
      setStage("analyzing_topics");
      addToast({ title: "📂 Fayl qabul qilindi", description: `${file.name} tahlil boshlanmoqda...`, type: "info" });

      // SSE orqali progress kuzat
      openSSE(
        `${API_URL}/api/materials/${data.material_id}/progress`,
        async () => {
          // Done — fetch topics
          try {
            const tr = await fetch(`${API_URL}/api/materials/${data.material_id}/topics`);
            if (!tr.ok) {
              const te = await tr.json().catch(() => ({ detail: "Mavzular olinmadi" }));
              throw new Error(te.detail);
            }
            const td = await tr.json();
            const tList: string[] = td.topics || [];
            if (tList.length === 0) throw new Error("Faylda mavzular topilmadi");
            setTopics(tList);
            setStage("selecting_topic");
            addToast({ title: `✅ ${tList.length} ta mavzu topildi!`, description: "Quyidan birini tanlang", type: "success" });
          } catch (e: any) {
            setErrorMsg(e.message || "Mavzularni olishda xatolik");
            setStage("error");
          }
        },
        (msg) => { setErrorMsg(msg); setStage("error"); }
      );
    } catch (e: any) {
      setErrorMsg(e.message || "Yuklab bo'lmadi. Backend ishlayaptimi?");
      setStage("error");
    }
  }, []);

  // ── Generate Lesson ────────────────────────────────────────
  const handleGenerateLesson = async () => {
    if (!selectedTopic || !materialId) return;
    setStage("analyzing_lesson");
    setProgress(5);
    setProgressMsg(`"${selectedTopic}" uchun Gemini AI dars yaratmoqda...`);
    esRef.current?.close();

    try {
      const genToken = localStorage.getItem("lectio_token") || "";
      const res = await fetch(`${API_URL}/api/materials/generate-topic-lesson`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(genToken ? { Authorization: `Bearer ${genToken}` } : {}) },
        body: JSON.stringify({
          material_id: materialId,
          professor_id: getProfId(),
          topic_name: selectedTopic,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Server xatoligi" }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }

      openSSE(
        `${API_URL}/api/materials/${materialId}/lesson-progress`,
        async () => {
          try {
            const lr = await fetch(`${API_URL}/api/materials/${materialId}/lesson-result`);
            if (!lr.ok) {
              const le = await lr.json().catch(() => ({ detail: "Natija olinmadi" }));
              throw new Error(le.detail);
            }
            const lessonData = await lr.json();
            setResult(lessonData);
            setStage("done");
            setActiveTab("overview");
            setSlideIdx(0);

            // Tarixga qo'shish
            const entry = {
              id: materialId,
              topic: selectedTopic,
              file: fileName,
              date: new Date().toISOString(),
              stats: {
                slides: lessonData.slides?.length || 0,
                quiz: lessonData.quiz?.length || 0,
                flashcards: lessonData.flashcards?.length || 0,
              },
              result: lessonData,
            };
            const h = JSON.parse(localStorage.getItem("lectio_mat_history") || "[]");
            const updated = [entry, ...h.filter((x: any) => x.id !== materialId)].slice(0, 15);
            localStorage.setItem("lectio_mat_history", JSON.stringify(updated));
            setHistory(updated);

            // localStorage darslar ro'yxatiga qo'shish
            const lessons = JSON.parse(localStorage.getItem("lectio_professor_lessons") || "[]");
            const lEntry = {
              id: lessonData.lesson_id || Date.now(),
              title: lessonData.title || selectedTopic,
              topic: lessonData.subject || "Umumiy",
              status: "preparing",
              createdAt: new Date().toISOString(),
              wow_fact: lessonData.wow_facts?.[0] || "",
              presentation_data: lessonData,
            };
            localStorage.setItem("lectio_professor_lessons", JSON.stringify([lEntry, ...lessons]));

            addToast({
              title: "🎉 Dars tayyor!",
              description: `${lessonData.slides?.length || 0} slayd · ${lessonData.quiz?.length || 0} test · ${lessonData.flashcards?.length || 0} karta`,
              type: "success",
            });
          } catch (e: any) {
            setErrorMsg(e.message || "Dars natijasini olib bo'lmadi");
            setStage("error");
          }
        },
        (msg) => { setErrorMsg(msg); setStage("error"); }
      );
    } catch (e: any) {
      setErrorMsg(e.message || "Dars yaratib bo'lmadi");
      setStage("error");
    }
  };

  // ── Drag & Drop ────────────────────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragActive(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }, [processFile]);

  const reset = () => {
    esRef.current?.close();
    if (retryRef.current) clearTimeout(retryRef.current);
    setStage("idle"); setResult(null); setSelectedTopic(""); setTopics([]);
    setProgress(0); setProgressMsg(""); setErrorMsg("");
    setMaterialId(""); setFileName(""); setFileSize("");
  };

  // ── Computed values ────────────────────────────────────────
  const fileMeta = FILE_META[fileExt] || FILE_META.txt;
  const slides = result?.slides || [];
  const quiz = result?.quiz || [];
  const flashcards = result?.flashcards || [];
  const glossary = result?.key_terms_glossary || [];
  const examTopics = result?.exam_likely_topics || [];
  const currentSlide = slides[slideIdx];
  const progressSteps = stage === "analyzing_lesson" ? LESSON_STEPS : TOPIC_STEPS;

  const RESULT_TABS: { id: ResultTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "overview",    label: "Umumiy",   icon: <Eye size={13} /> },
    { id: "slides",      label: "Slaydlar", icon: <FileText size={13} />, count: slides.length },
    { id: "quiz",        label: "Quiz",     icon: <HelpCircle size={13} />, count: quiz.length },
    { id: "flashcards",  label: "Kartalar", icon: <Brain size={13} />, count: flashcards.length },
    { id: "glossary",    label: "Glossariy",icon: <BookOpen size={13} />, count: glossary.length },
    { id: "exam",        label: "Imtihon",  icon: <Target size={13} />, count: examTopics.length },
  ];

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full p-4 md:p-6 xl:p-8 text-white relative z-10">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <AnimatePresence mode="wait">

        {/* ══════════════════════════════════════════════════════
            IDLE — Fayl yuklash ekrani
        ══════════════════════════════════════════════════════ */}
        {stage === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0D9373]/20 flex items-center justify-center">
                  <FileText size={20} className="text-[#0D9373]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Metodichka Yuklash</h1>
                  <p className="text-slate-400 text-sm">AI faylingizdan to'liq dars paketi yaratadi</p>
                </div>
              </div>
              {history.length > 0 && (
                <button onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition text-sm font-bold">
                  <Clock size={14} /> Tarix ({history.length})
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Upload Zone */}
              <div className="lg:col-span-2 space-y-4">
                <motion.div
                  animate={{ scale: dragActive ? 1.02 : 1 }}
                  className={`rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${dragActive ? "border-[#0D9373] bg-[#0D9373]/10 shadow-lg shadow-[#0D9373]/10" : "border-white/15 hover:border-white/30 hover:bg-white/[0.02]"}`}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                >
                  <motion.div animate={{ y: dragActive ? -8 : 0, rotate: dragActive ? -5 : 0 }} className="text-7xl mb-4">
                    {dragActive ? "📂" : "📤"}
                  </motion.div>
                  <h3 className="text-xl font-bold mb-2">
                    {dragActive ? "Qo'yib yuboring!" : "Metodichkani bu yerga tashlang"}
                  </h3>
                  <p className="text-slate-400 text-sm mb-6">Word (.docx), PDF, PowerPoint (.pptx), TXT — maksimum 50 MB</p>

                  <label className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#0D9373] to-[#0ba882] text-white font-bold cursor-pointer hover:shadow-lg hover:shadow-[#0D9373]/20 transition">
                    <Upload size={16} /> Fayl tanlash
                    <input type="file" accept=".pdf,.docx,.pptx,.txt"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ""; }}
                      className="hidden" />
                  </label>

                  {/* File type badges */}
                  <div className="flex justify-center gap-2 mt-6 flex-wrap">
                    {Object.entries(FILE_META).map(([ext, meta]) => (
                      <div key={ext} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-white/10"
                        style={{ background: meta.bg, color: meta.color }}>
                        {meta.icon} .{ext.toUpperCase()}
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* How it works */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Qanday ishlaydi?</p>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { n: "1", icon: "📤", l: "Fayl yuklash",      d: "DOCX yoki PDF" },
                      { n: "2", icon: "🔍", l: "AI tahlil",         d: "Gemini mavzular ajratadi" },
                      { n: "3", icon: "✅", l: "Mavzu tanlash",     d: "Qaysi bo'limni ishlash" },
                      { n: "4", icon: "✨", l: "Dars paketi tayyor", d: "Slayd + Quiz + Karta" },
                    ].map((s) => (
                      <div key={s.n} className="text-center p-3 rounded-xl bg-white/5">
                        <div className="text-xl mb-1">{s.icon}</div>
                        <p className="text-xs font-bold text-white mb-0.5">{s.l}</p>
                        <p className="text-[11px] text-slate-500">{s.d}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* What AI creates */}
                <div className="rounded-2xl border border-[#0D9373]/20 bg-[#0D9373]/5 p-5">
                  <p className="text-xs font-bold text-[#0D9373] uppercase tracking-wider mb-3">AI nima yaratadi?</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { icon: "📊", l: "Prezentatsiya slaydlar" },
                      { icon: "❓", l: "Quiz test savollar" },
                      { icon: "🃏", l: "Flashcard kartochkalar" },
                      { icon: "📖", l: "Atamalar glossariysi" },
                      { icon: "🎯", l: "Imtihon mavzulari" },
                      { icon: "🤯", l: "WOW qiziqarli faktlar" },
                    ].map((item) => (
                      <div key={item.l} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 text-xs text-slate-300">
                        <span>{item.icon}</span> {item.l}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right — Tarix & Maslahatlar */}
              <div className="space-y-4">
                {/* Tarix */}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    {showHistory ? "Tarix" : "So'nggi natijalar"}
                  </p>
                  {history.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
                      <div className="text-4xl mb-2">📚</div>
                      <p className="text-slate-500 text-sm">Hali fayl yuklanmagan</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {history.map((h: any, i: number) => {
                        const ext = h.file?.split(".").pop()?.toLowerCase() || "txt";
                        const m = FILE_META[ext] || FILE_META.txt;
                        return (
                          <button key={i}
                            onClick={() => { setResult(h.result); setSelectedTopic(h.topic); setStage("done"); setActiveTab("overview"); setSlideIdx(0); }}
                            className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] transition text-left group">
                            <span className="text-xl shrink-0">{m.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate group-hover:text-[#F5A623] transition">{h.topic}</p>
                              <p className="text-xs text-slate-500 truncate">{h.file}</p>
                              {h.stats && (
                                <div className="flex gap-2 mt-1">
                                  <span className="text-[10px] text-slate-600">{h.stats.slides}🖼️</span>
                                  <span className="text-[10px] text-slate-600">{h.stats.quiz}❓</span>
                                  <span className="text-[10px] text-slate-600">{h.stats.flashcards}🃏</span>
                                </div>
                              )}
                            </div>
                            <ChevronRight size={14} className="text-slate-600 shrink-0 group-hover:text-[#F5A623] transition" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Maslahat */}
                <div className="rounded-2xl border border-[#F5A623]/20 bg-[#F5A623]/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb size={14} className="text-[#F5A623]" />
                    <p className="text-xs font-bold text-[#F5A623]">Maslahat</p>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Eng yaxshi natija uchun raqamlangan (1. 2. 3.) yoki sarlavhali hujjat yuklang. Gemini matndan mavzularni avtomatik ajratadi.
                  </p>
                </div>

                {/* Qo'llab-quvvatlanadigan formatlar */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Format talablari</p>
                  <div className="space-y-2 text-xs text-slate-400">
                    <p>• <strong className="text-white">.docx</strong> — Word hujjati (tavsiya etiladi)</p>
                    <p>• <strong className="text-white">.pdf</strong> — Matn asosida PDF</p>
                    <p>• <strong className="text-white">.pptx</strong> — PowerPoint slaydlar</p>
                    <p>• <strong className="text-white">.txt</strong> — Oddiy matn fayli</p>
                    <p>• Maksimum hajm: <strong className="text-white">50 MB</strong></p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════
            PROGRESS — Yuklash / Tahlil / Dars yaratish
        ══════════════════════════════════════════════════════ */}
        {(stage === "uploading" || stage === "analyzing_topics" || stage === "analyzing_lesson") && (
          <motion.div key="progress" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">

              {/* File info */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0" style={{ background: fileMeta.bg }}>
                  {fileMeta.icon}
                </div>
                <div>
                  <p className="font-bold text-lg">
                    {stage === "uploading"
                      ? "Fayl yuklanmoqda"
                      : stage === "analyzing_topics"
                        ? "Mavzular aniqlanmoqda"
                        : `"${selectedTopic.slice(0, 35)}..." uchun dars`}
                  </p>
                  <p className="text-slate-400 text-sm">{fileName} {fileSize && `· ${fileSize}`}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-2">
                <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "easeOut", duration: 0.5 }}
                    className="h-full rounded-full bg-gradient-to-r from-[#0D9373] via-[#1B4FD8] to-[#F5A623]"
                  />
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-slate-400 text-xs">{progressMsg || "Iltimos kuting..."}</span>
                  <span className="font-bold text-[#F5A623] font-mono">{progress}%</span>
                </div>
              </div>

              {/* Steps */}
              <div className="mt-6 space-y-2">
                {progressSteps.map((s, i) => {
                  const done   = progress >= s.pct;
                  const active = !done && (i === 0 || progress >= progressSteps[i - 1].pct);
                  return (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${active ? "bg-[#F5A623]/10 border border-[#F5A623]/20" : done ? "opacity-50" : "opacity-25"}`}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0">
                        {done
                          ? <CheckCircle2 size={16} className="text-[#0D9373]" />
                          : active
                            ? <Loader2 size={16} className="text-[#F5A623] animate-spin" />
                            : <div className="w-4 h-4 rounded-full border-2 border-slate-600" />}
                      </div>
                      <span className={`text-sm font-medium ${active ? "text-[#F5A623]" : done ? "text-[#0D9373] line-through opacity-60" : "text-slate-500"}`}>
                        {s.label}
                      </span>
                      {active && <Sparkles size={12} className="text-[#F5A623] ml-auto animate-pulse" />}
                    </motion.div>
                  );
                })}
              </div>

              {/* Gemini badge */}
              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-500">
                <div className="w-5 h-5 rounded flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500 text-white text-[10px] font-bold">G</div>
                Powered by Google Gemini 1.5 Pro
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════
            SELECTING TOPIC — Mavzu tanlash
        ══════════════════════════════════════════════════════ */}
        {stage === "selecting_topic" && (
          <motion.div key="topics" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <button onClick={reset} className="p-2 rounded-xl hover:bg-white/5 transition text-slate-400 hover:text-white">
                <ArrowLeft size={16} />
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <CheckCircle2 size={18} className="text-[#0D9373]" />
                  <h2 className="text-xl font-bold">{topics.length} ta mavzu topildi!</h2>
                </div>
                <p className="text-slate-400 text-sm ml-6">{fileName} · {fileSize}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2">
                <p className="text-sm text-slate-300 mb-3">Qaysi mavzu bo&apos;yicha to&apos;liq dars tayyorlansin?</p>

                {/* Topics list */}
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 mb-4">
                  {topics.map((topic, i) => (
                    <motion.label key={i}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.025 }}
                      className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedTopic === topic ? "border-[#0D9373] bg-[#0D9373]/10" : "border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.05]"}`}>
                      <input type="radio" name="topic" value={topic} checked={selectedTopic === topic}
                        onChange={() => setSelectedTopic(topic)} className="hidden" />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${selectedTopic === topic ? "border-[#0D9373] bg-[#0D9373]" : "border-white/30"}`}>
                        {selectedTopic === topic && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-500 shrink-0 w-5">{i + 1}</span>
                        <span className={`text-sm font-medium truncate ${selectedTopic === topic ? "text-white font-bold" : "text-slate-300"}`}>{topic}</span>
                      </div>
                      {selectedTopic === topic && <ChevronRight size={14} className="text-[#0D9373] shrink-0" />}
                    </motion.label>
                  ))}
                </div>

                <button onClick={handleGenerateLesson} disabled={!selectedTopic}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#0D9373] to-[#1B4FD8] text-white font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#0D9373]/20 transition">
                  <Sparkles size={20} />
                  {selectedTopic
                    ? `"${selectedTopic.length > 38 ? selectedTopic.slice(0, 38) + "..." : selectedTopic}" → Dars yaratish`
                    : "Avval mavzuni tanlang"}
                </button>

                <button onClick={reset}
                  className="w-full mt-2 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5 transition font-bold flex items-center justify-center gap-2">
                  <ArrowLeft size={14} /> Boshqa fayl yuklash
                </button>
              </div>

              {/* Sidebar */}
              <div className="space-y-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">AI yaratadi</p>
                  <div className="space-y-2">
                    {[
                      { icon: "📊", l: "Slaydlar (4-6 ta)" },
                      { icon: "❓", l: "Quiz (5 ta savol)" },
                      { icon: "🃏", l: "Flashcardlar (5 ta)" },
                      { icon: "📖", l: "Glossariy" },
                      { icon: "🎯", l: "Imtihon mavzulari" },
                      { icon: "🤯", l: "WOW faktlar" },
                    ].map((x) => (
                      <div key={x.l} className="flex items-center gap-2 text-xs text-slate-300 p-2 rounded-lg bg-white/5">
                        <span>{x.icon}</span> {x.l}
                      </div>
                    ))}
                  </div>
                </div>

                {selectedTopic && (
                  <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                    className="rounded-2xl border border-[#0D9373]/30 bg-[#0D9373]/8 p-4">
                    <p className="text-xs font-bold text-[#0D9373] uppercase tracking-wider mb-1">Tanlangan mavzu</p>
                    <p className="text-sm text-white font-bold leading-snug">{selectedTopic}</p>
                  </motion.div>
                )}

                <div className="rounded-2xl border border-[#7B2FBE]/20 bg-[#7B2FBE]/5 p-3 flex items-start gap-2">
                  <div className="w-5 h-5 rounded flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500 text-white text-[10px] font-bold shrink-0 mt-0.5">G</div>
                  <p className="text-xs text-slate-400 leading-relaxed">Gemini 1.5 Pro matndan chuqur tahlil qilib, O&apos;zbek tilida to&apos;liq dars paketi yaratadi.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════
            DONE — Natija
        ══════════════════════════════════════════════════════ */}
        {stage === "done" && result && (
          <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 size={20} className="text-[#0D9373]" />
                  <h2 className="text-2xl font-bold">
                    {result.title || selectedTopic}
                  </h2>
                </div>
                <p className="text-slate-400 text-sm ml-7">
                  {result.subject || "Umumiy fan"} · {result.level || "Bakalavr"}
                  {result.lesson_id && <span className="ml-2 text-xs text-[#0D9373] font-bold">✓ DB ga saqlandi (ID: {result.lesson_id})</span>}
                </p>
              </div>
              <div className="flex gap-2 shrink-0 flex-wrap">
                <button onClick={reset}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 text-sm font-bold transition">
                  <RefreshCw size={13} /> Yangi fayl
                </button>
                <button onClick={() => router.push("/professor/lessons")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D9373]/20 border border-[#0D9373]/30 text-[#0D9373] hover:bg-[#0D9373]/30 text-sm font-bold transition">
                  <BookOpen size={13} /> Darslarim
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-5">
              {[
                { icon: "📊", l: "Slaydlar",  v: slides.length,    c: "#1B4FD8" },
                { icon: "❓", l: "Quiz",       v: quiz.length,      c: "#F5A623" },
                { icon: "🃏", l: "Flashcard",  v: flashcards.length, c: "#0D9373" },
                { icon: "📖", l: "Glossariy",  v: glossary.length,  c: "#7B2FBE" },
                { icon: "🎯", l: "Imtihon",    v: examTopics.length, c: "#E84855" },
                { icon: "🤯", l: "WOW Fakt",   v: result.wow_facts?.length || 0, c: "#F59E0B" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                  <div className="text-lg mb-0.5">{s.icon}</div>
                  <p className="font-bold text-xl" style={{ color: s.c }}>{s.v}</p>
                  <p className="text-xs text-slate-500">{s.l}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 mb-5 overflow-x-auto">
              {RESULT_TABS.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition flex-shrink-0 ${activeTab === tab.id ? "bg-[#0D9373] text-white" : "text-slate-400 hover:text-white"}`}>
                  {tab.icon} {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab.id ? "bg-white/20" : "bg-white/10"}`}>{tab.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Actions + Tab content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

              {/* Tab Content */}
              <div className="lg:col-span-3">
                <AnimatePresence mode="wait">

                  {/* Overview */}
                  {activeTab === "overview" && (
                    <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      {/* Summary */}
                      {result.summary && (
                        <div className="rounded-2xl border border-[#0D9373]/25 bg-[#0D9373]/5 p-5">
                          <p className="text-xs font-bold text-[#0D9373] uppercase tracking-wider mb-2">📋 Qisqacha sharh</p>
                          <p className="text-sm text-slate-200 leading-relaxed">{result.summary}</p>
                        </div>
                      )}
                      {/* WOW Facts */}
                      {result.wow_facts?.length > 0 && (
                        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5">
                          <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">⚡ Qiziqarli faktlar</p>
                          <div className="space-y-2">
                            {result.wow_facts.map((f: string, i: number) => (
                              <div key={i} className="flex items-start gap-2 text-sm text-slate-200 p-2.5 rounded-xl bg-white/5">
                                <span className="text-amber-400 shrink-0 mt-0.5">🤯</span> {f}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Main topics */}
                      {result.main_topics?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Dars bo&apos;limlari</p>
                          <div className="space-y-2">
                            {result.main_topics.map((t: any, i: number) => (
                              <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 border-l-4 border-l-[#F5A623]">
                                <p className="font-bold text-[#F5A623] mb-1">{t.title}</p>
                                {t.subtopics?.length > 0 && <p className="text-xs text-slate-400 mb-1">{t.subtopics.slice(0, 3).join(" · ")}</p>}
                                {t.key_concepts?.length > 0 && <p className="text-xs text-slate-500">🔑 {t.key_concepts.slice(0, 3).join(", ")}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Slides */}
                  {activeTab === "slides" && (
                    <motion.div key="sl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      {slides.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">Slaydlar yaratilmadi</div>
                      ) : (
                        <div className="space-y-3">
                          {/* Current slide viewer */}
                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                            <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                              <span className="text-sm font-bold">{slideIdx + 1} / {slides.length}</span>
                              <div className="flex gap-2">
                                <button onClick={() => setSlideIdx((i) => Math.max(0, i - 1))} disabled={slideIdx === 0}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition"><ChevronLeft size={14} /></button>
                                <button onClick={() => setSlideIdx((i) => Math.min(slides.length - 1, i + 1))} disabled={slideIdx === slides.length - 1}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition"><ChevronRight size={14} /></button>
                              </div>
                            </div>
                            <AnimatePresence mode="wait">
                              <motion.div key={slideIdx} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} className="p-6">
                                <p className="text-xs text-[#F5A623] uppercase tracking-widest font-bold mb-2">SLAYD {currentSlide?.slide_number || slideIdx + 1}</p>
                                <h2 className="text-xl font-bold mb-3">{currentSlide?.title}</h2>
                                <p className="text-slate-300 text-sm leading-relaxed">{currentSlide?.content}</p>
                                {currentSlide?.notes && (
                                  <div className="mt-4 p-3 rounded-xl bg-[#F5A623]/10 border border-[#F5A623]/20">
                                    <p className="text-xs text-[#F5A623] font-bold mb-0.5">📝 Professor eslatmasi</p>
                                    <p className="text-xs text-slate-300">{currentSlide.notes}</p>
                                  </div>
                                )}
                                {currentSlide?.duration_min && (
                                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                                    <Clock size={11} /> Taxminiy vaqt: {currentSlide.duration_min} daqiqa
                                  </div>
                                )}
                              </motion.div>
                            </AnimatePresence>
                          </div>
                          {/* Strip */}
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

                  {/* Quiz */}
                  {activeTab === "quiz" && (
                    <motion.div key="qz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      {quiz.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">Quiz savollar yaratilmadi</div>
                      ) : quiz.map((q: any, i: number) => {
                        const opts: string[] = q.options || [];
                        const correctLetter = q.correct || "A";
                        return (
                          <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                            <div className="flex items-start gap-3 mb-4">
                              <span className="w-8 h-8 rounded-xl bg-[#F5A623]/20 flex items-center justify-center text-sm font-bold text-[#F5A623] shrink-0 mt-0.5">{i + 1}</span>
                              <p className="font-bold leading-relaxed">{q.question}</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                              {opts.map((opt: string, j: number) => {
                                const letter = LETTERS[j] || String(j);
                                const isCorrect = correctLetter === letter || correctLetter === opt.replace(/^[A-E][).\s]\s*/, "").trim();
                                const cleanOpt = opt.replace(/^[A-E][).\s]\s*/, "").trim() || opt;
                                return (
                                  <div key={j} className={`flex items-center gap-2.5 p-3 rounded-xl text-sm transition ${isCorrect ? "bg-[#0D9373]/15 border border-[#0D9373]/30" : "bg-white/5 border border-white/5"}`}>
                                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                                      style={{ background: isCorrect ? "#0D9373" : OPTION_COLORS[j] || "#475569" }}>
                                      {letter}
                                    </span>
                                    <span className={isCorrect ? "text-[#0D9373] font-bold" : "text-slate-300"}>{cleanOpt}</span>
                                    {isCorrect && <CheckCircle2 size={12} className="text-[#0D9373] ml-auto shrink-0" />}
                                  </div>
                                );
                              })}
                            </div>
                            {q.explanation && (
                              <div className="p-3 rounded-xl bg-[#1B4FD8]/10 border border-[#1B4FD8]/20 text-sm text-slate-300">
                                💡 <strong className="text-[#6B8FFF]">Izoh:</strong> {q.explanation}
                              </div>
                            )}
                            <div className="flex gap-3 mt-2 text-xs text-slate-500">
                              {q.time_limit && <span className="flex items-center gap-1"><Clock size={10} /> {q.time_limit}s</span>}
                              {q.points && <span className="flex items-center gap-1"><Star size={10} /> {q.points} ball</span>}
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}

                  {/* Flashcards */}
                  {activeTab === "flashcards" && (
                    <motion.div key="fc" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      {flashcards.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">Flashcardlar yaratilmadi</div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {flashcards.map((f: any, i: number) => (
                            <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                              className="rounded-2xl border border-white/10 overflow-hidden group cursor-default">
                              <div className="p-4 border-b border-white/5 bg-white/[0.03]">
                                <p className="text-xs text-[#F5A623] font-bold uppercase tracking-wider mb-1.5">❓ Savol</p>
                                <p className="font-bold text-sm leading-relaxed">{f.front || f.question}</p>
                              </div>
                              <div className="p-4 bg-[#0D9373]/5">
                                <p className="text-xs text-[#0D9373] font-bold uppercase tracking-wider mb-1.5">✅ Javob</p>
                                <p className="text-sm text-slate-200 leading-relaxed">{f.back || f.answer}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Glossary */}
                  {activeTab === "glossary" && (
                    <motion.div key="gl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      {glossary.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">Glossariy mavjud emas</div>
                      ) : (
                        <div className="space-y-2">
                          {glossary.map((g: any, i: number) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                              className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition">
                              <span className="w-8 h-8 rounded-xl bg-[#7B2FBE]/20 flex items-center justify-center text-xs font-bold text-[#A78BFA] shrink-0 mt-0.5">{i + 1}</span>
                              <div>
                                <p className="font-bold text-[#F5A623] mb-0.5">{g.term}</p>
                                <p className="text-sm text-slate-300 leading-relaxed">{g.definition}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Exam */}
                  {activeTab === "exam" && (
                    <motion.div key="ex" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      {examTopics.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">Imtihon mavzulari topilmadi</div>
                      ) : (
                        <div>
                          <p className="text-sm text-slate-400 mb-4">Imtihonda chiqishi ehtimoli yuqori mavzular:</p>
                          <div className="flex flex-wrap gap-2">
                            {examTopics.map((t: string, i: number) => (
                              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E84855]/10 border border-[#E84855]/25 text-[#E84855] text-sm font-bold">
                                <Target size={12} /> {t}
                              </motion.div>
                            ))}
                          </div>
                          {result.practice_questions?.length > 0 && (
                            <div className="mt-6">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Amaliy savollar</p>
                              <div className="space-y-3">
                                {result.practice_questions.map((pq: any, i: number) => (
                                  <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <p className="font-bold text-sm mb-2">❓ {pq.question}</p>
                                    <p className="text-sm text-slate-300 border-l-2 border-[#0D9373] pl-3">✅ {pq.answer}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Actions sidebar */}
              <div className="space-y-3">
                <button onClick={() => router.push("/professor/live")}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#E84855] to-[#f06470] text-white font-bold flex items-center justify-center gap-2 hover:shadow-lg transition text-sm">
                  <Play size={14} /> Jonli Dars Boshlash
                </button>
                <button onClick={() => router.push("/professor/quiz")}
                  className="w-full py-3.5 rounded-xl bg-[#F5A623]/15 border border-[#F5A623]/25 text-[#F5A623] font-bold flex items-center justify-center gap-2 hover:bg-[#F5A623]/25 transition text-sm">
                  <Radio size={14} /> Quiz Boshlash
                </button>
                <button onClick={() => router.push("/professor/create-lesson")}
                  className="w-full py-3.5 rounded-xl bg-[#7B2FBE]/15 border border-[#7B2FBE]/25 text-[#A78BFA] font-bold flex items-center justify-center gap-2 hover:bg-[#7B2FBE]/25 transition text-sm">
                  <Sparkles size={14} /> AI Dars Yaratish
                </button>
                <button onClick={reset}
                  className="w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition text-sm">
                  <FilePlus size={14} /> Boshqa Metodichka
                </button>

                {/* Stats */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Dars statistikasi</p>
                  <div className="space-y-2">
                    {[
                      { l: "Slaydlar", v: slides.length, c: "#1B4FD8" },
                      { l: "Quiz savollar", v: quiz.length, c: "#F5A623" },
                      { l: "Flashcardlar", v: flashcards.length, c: "#0D9373" },
                      { l: "Glossariy", v: glossary.length, c: "#7B2FBE" },
                      { l: "Imtihon mavzu", v: examTopics.length, c: "#E84855" },
                    ].map((s) => (
                      <div key={s.l} className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">{s.l}</span>
                        <span className="font-bold font-mono" style={{ color: s.c }}>{s.v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {result.difficulty_distribution && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Qiyinlik darajasi</p>
                    {[
                      { l: "Oson",    v: result.difficulty_distribution.easy || 0,   c: "#0D9373" },
                      { l: "O'rta",  v: result.difficulty_distribution.medium || 0, c: "#F5A623" },
                      { l: "Qiyin",  v: result.difficulty_distribution.hard || 0,   c: "#E84855" },
                    ].map((s) => (
                      <div key={s.l} className="mb-2">
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-slate-400">{s.l}</span>
                          <span className="font-bold" style={{ color: s.c }}>{s.v}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${s.v}%`, background: s.c }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════
            ERROR
        ══════════════════════════════════════════════════════ */}
        {stage === "error" && (
          <motion.div key="error" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto">
            <div className="rounded-2xl border border-[#E84855]/25 bg-[#E84855]/5 p-8 text-center">
              <AlertCircle size={48} className="text-[#E84855] mx-auto mb-4" />
              {errorMsg === "auth_required" || errorMsg?.includes("Token") || errorMsg?.includes("token") ? (
                <>
                  <h2 className="text-xl font-bold mb-2 text-[#F5A623]">Kirish talab qilinadi</h2>
                  <p className="text-slate-300 text-sm mb-2 leading-relaxed bg-white/5 rounded-xl p-3">
                    Materiallar sahifasidan foydalanish uchun tizimga kirishingiz kerak. Demo rejimida bu funksiya ishlamaydi.
                  </p>
                  <p className="text-slate-500 text-xs mb-6">Professor akkauntingiz bilan kirganingizdan so&apos;ng fayl yuklashingiz mumkin.</p>
                  <div className="flex gap-3">
                    <Link href="/login"
                      className="flex-1 py-3 rounded-xl bg-[#F5A623] text-black font-bold hover:bg-amber-400 transition flex items-center justify-center gap-2">
                      Tizimga kirish
                    </Link>
                    <Link href="/professor/dashboard"
                      className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold hover:bg-white/10 transition flex items-center justify-center">
                      Dashboard
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold mb-2 text-[#E84855]">Xatolik yuz berdi</h2>
                  <p className="text-slate-300 text-sm mb-2 leading-relaxed bg-white/5 rounded-xl p-3 font-mono text-left">
                    {errorMsg || "Noma'lum xatolik yuz berdi"}
                  </p>
                  <p className="text-slate-500 text-xs mb-6">Backend ishlayaptimi? GEMINI_API_KEY sozlanganmi?</p>
                  <div className="flex gap-3">
                    <button onClick={reset}
                      className="flex-1 py-3 rounded-xl bg-[#E84855] text-white font-bold hover:bg-red-600 transition flex items-center justify-center gap-2">
                      <RefreshCw size={14} /> Qayta urinish
                    </button>
                    <Link href="/professor/dashboard"
                      className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold hover:bg-white/10 transition flex items-center justify-center">
                      Dashboard
                    </Link>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
