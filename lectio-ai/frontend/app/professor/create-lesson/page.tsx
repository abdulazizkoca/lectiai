"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { lessonsAPI } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";
import {
  Sparkles, Play, BookOpen, Clock, ChevronRight, ChevronLeft,
  Zap, Brain, FileText, HelpCircle, Loader2, CheckCircle2,
  ArrowRight, RotateCcw, Eye, Download, Radio
} from "lucide-react";

const DURATIONS = [15, 30, 45, 60, 90];
const LEVELS = [
  { value: "Bakalavr 1-kurs", label: "1-kurs" },
  { value: "Bakalavr 2-kurs", label: "2-kurs" },
  { value: "Bakalavr 3-kurs", label: "3-kurs" },
  { value: "Magistr", label: "Magistr" },
];

const SUBJECTS = ["Matematika", "Fizika", "Kimyo", "Biologiya", "Informatika", "Tarix", "Ingliz tili", "Boshqa"];

export default function CreateLesson() {
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();

  // Form
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState(45);
  const [level, setLevel] = useState("Bakalavr 2-kurs");
  const [subject, setSubject] = useState("");

  // Generation
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0=form, 1=generating, 2=result
  const [genStep, setGenStep] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [savedId, setSavedId] = useState<number | null>(null);

  // Result view
  const [activeTab, setActiveTab] = useState<"overview" | "slides" | "quiz" | "flashcards">("overview");
  const [slideIdx, setSlideIdx] = useState(0);

  const getProf = () => { try { return JSON.parse(localStorage.getItem("lectio_user") || "{}"); } catch { return {}; } };

  const GEN_STEPS = [
    { label: "AI mavzuni tahlil qilmoqda...", icon: "🔍" },
    { label: "Slaydlar yaratilmoqda...", icon: "📊" },
    { label: "Quiz savollar tayyorlanmoqda...", icon: "❓" },
    { label: "Flashcardlar generatsiya...", icon: "🃏" },
    { label: "WOW fakt qo'shilmoqda...", icon: "🤯" },
    { label: "Dars DB ga saqlanmoqda...", icon: "💾" },
  ];

  const handleCreate = async () => {
    if (!title.trim() || title.trim().length < 3) { addToast({ title: "Xato", description: "Dars nomini kiriting (min 3 harf)", type: "error" }); return; }
    if (!topic.trim() || topic.trim().length < 3) { addToast({ title: "Xato", description: "Mavzuni kiriting (min 3 harf)", type: "error" }); return; }

    setLoading(true);
    setStep(1);
    setGenStep(0);

    // Animate generation steps
    const stepInterval = setInterval(() => {
      setGenStep((s) => {
        if (s >= GEN_STEPS.length - 1) { clearInterval(stepInterval); return s; }
        return s + 1;
      });
    }, 900);

    try {
      const token = localStorage.getItem("lectio_token") || "";
      let lessonId: number | null = null;
      let generated: any = null;

      if (token && !token.startsWith("mock_")) {
        try {
          const data = await lessonsAPI.create(
            { title: title.trim(), topic: topic.trim(), duration_minutes: duration },
            token
          );
          generated = data.presentation_data || data;
          lessonId = data.id;
          setSavedId(lessonId);
        } catch {
          addToast({ title: "⚠️ AI ulana olmadi", description: "Demo rejimda yaratilmoqda", type: "warning" });
        }
      }

      // Fallback: generate demo data when API is unavailable
      if (!generated || (!generated.slides?.length && !generated.quiz?.length)) {
        generated = generateMockLesson(title.trim(), topic.trim(), duration, level);
      }

      // Save to localStorage — failure here should not block lesson display
      try {
        const saved = JSON.parse(localStorage.getItem("lectio_professor_lessons") || "[]");
        const entry = { id: lessonId || Date.now(), title: title.trim(), topic: topic.trim(), duration, status: "preparing", createdAt: new Date().toISOString(), presentation_data: generated, wow_fact: generated.wow_fact };
        localStorage.setItem("lectio_professor_lessons", JSON.stringify([entry, ...saved]));
      } catch {
        // localStorage unavailable — lesson still shows in current session
      }

      clearInterval(stepInterval);
      setGenStep(GEN_STEPS.length - 1);
      await new Promise((r) => setTimeout(r, 600));

      setResult(generated);
      setStep(2);
      setSlideIdx(0);
      setActiveTab("overview");
      addToast({ title: "✅ Dars tayyor!", description: "AI muvaffaqiyatli dars yaratdi", type: "success" });
    } catch (e) {
      clearInterval(stepInterval);
      addToast({ title: "Xatolik", description: "Dars yaratishda muammo yuz berdi", type: "error" });
      setStep(0);
    } finally {
      setLoading(false);
    }
  };

  const slides = result?.slides || [];
  const quiz = result?.quiz || [];
  const flashcards = result?.flashcards || [];
  const currentSlide = slides[slideIdx];

  return (
    <div className="min-h-full p-4 md:p-6 xl:p-8 text-white relative z-10">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <AnimatePresence mode="wait">

        {/* ── STEP 0: FORM ─────────────────────────────────────── */}
        {step === 0 && (
          <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-saffron/20 flex items-center justify-center">
                <Sparkles size={20} className="text-saffron" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">AI bilan Dars Yaratish</h1>
                <p className="text-slate-400 text-sm">Mavzuni kiriting — AI hamma narsani tayyorlaydi</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Form */}
              <div className="lg:col-span-2 space-y-4">
                {/* Title */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                    <BookOpen size={12} /> Dars nomi *
                  </label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="Masalan: Algoritmlar va ma'lumotlar tuzilmasi"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-saffron transition font-bold text-lg"
                  />
                </div>

                {/* Topic */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                    <Brain size={12} /> Mavzu (qanchalik aniq bo&apos;lsa shunchalik yaxshi) *
                  </label>
                  <textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={3}
                    placeholder="Masalan: Binary search algoritmining O(log n) murakkabligi va amaliy qo'llanilishi"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-saffron transition resize-none text-sm leading-relaxed"
                  />
                  <p className="text-xs text-slate-500 mt-2">💡 Aniq yozsangiz AI aniqroq kontent yaratadi</p>
                </div>

                {/* Subject */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Fan (ixtiyoriy)</label>
                  <div className="flex flex-wrap gap-2">
                    {SUBJECTS.map((s) => (
                      <button key={s} onClick={() => setSubject(subject === s ? "" : s)}
                        className={`px-3 py-1.5 rounded-xl text-sm font-bold transition ${subject === s ? "bg-saffron text-black" : "bg-white/5 text-slate-400 border border-white/10 hover:border-white/25"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Config sidebar */}
              <div className="space-y-4">
                {/* Duration */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block flex items-center gap-1.5">
                    <Clock size={12} /> Davomiylik
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DURATIONS.map((d) => (
                      <button key={d} onClick={() => setDuration(d)}
                        className={`flex-1 min-w-0 py-2.5 rounded-xl text-sm font-bold transition ${duration === d ? "bg-saffron text-black" : "bg-white/5 text-slate-400 border border-white/10 hover:border-white/25"}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2 text-center">{duration} daqiqa</p>
                </div>

                {/* Level */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Daraja</label>
                  <div className="grid grid-cols-2 gap-2">
                    {LEVELS.map((l) => (
                      <button key={l.value} onClick={() => setLevel(l.value)}
                        className={`py-2 rounded-xl text-xs font-bold transition ${level === l.value ? "bg-lapis text-white" : "bg-white/5 text-slate-400 border border-white/10 hover:border-white/25"}`}>
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* What AI creates */}
                <div className="rounded-2xl border border-jade/25 bg-jade/5 p-4">
                  <p className="text-xs font-bold text-jade uppercase tracking-wider mb-3">AI nima yaratadi:</p>
                  <div className="space-y-2">
                    {[
                      { icon: "📊", label: "Prezentatsiya slaydlar" },
                      { icon: "❓", label: "Quiz savollar" },
                      { icon: "🃏", label: "Flashcardlar" },
                      { icon: "🤯", label: "WOW fakt" },
                      { icon: "📋", label: "Xulosa" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2 text-xs text-slate-300">
                        <span>{item.icon}</span> {item.label}
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={handleCreate} disabled={!title.trim() || !topic.trim() || loading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-saffron to-[#f7b955] text-black font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-saffron/20 transition">
                  <Sparkles size={20} /> AI bilan Yaratish
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── STEP 1: GENERATING ──────────────────────────────── */}
        {step === 1 && (
          <motion.div key="generating" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-96">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 rounded-full border-4 border-saffron/20 border-t-saffron mb-8" />
            <h2 className="text-2xl font-bold mb-2 text-center">AI dars yaratmoqda</h2>
            <p className="text-slate-400 mb-8 text-center">&quot;{topic}&quot;</p>
            <div className="w-full space-y-3">
              {GEN_STEPS.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: i <= genStep ? 1 : 0.3, x: 0 }} transition={{ delay: i * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${i === genStep ? "bg-saffron/10 border border-saffron/20" : i < genStep ? "bg-jade/5" : "bg-white/[0.02]"}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 ${i === genStep ? "animate-bounce" : ""}`}>
                    {i < genStep ? "✅" : s.icon}
                  </div>
                  <span className={`text-sm font-medium ${i === genStep ? "text-saffron" : i < genStep ? "text-jade line-through opacity-70" : "text-slate-500"}`}>
                    {s.label}
                  </span>
                  {i === genStep && <Loader2 size={14} className="text-[#F5A623] animate-spin ml-auto" />}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: RESULT ──────────────────────────────────── */}
        {step === 2 && result && (
          <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
            {/* Result Header */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 size={20} className="text-[#0D9373]" />
                  <h1 className="text-2xl font-bold">{title}</h1>
                </div>
                <p className="text-slate-400 text-sm">{topic} · {duration} daqiqa · {level}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => { setStep(0); setResult(null); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 text-sm font-bold transition">
                  <RotateCcw size={14} /> Yangi
                </button>
                <button onClick={() => router.push("/professor/live")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E84855]/20 border border-[#E84855]/30 text-[#E84855] hover:bg-[#E84855]/30 text-sm font-bold transition">
                  <Play size={14} /> Boshlash
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 mb-6 w-fit">
              {([
                { id: "overview", label: "Umumiy", icon: <Eye size={13} /> },
                { id: "slides", label: `Slaydlar (${slides.length})`, icon: <FileText size={13} /> },
                { id: "quiz", label: `Quiz (${quiz.length})`, icon: <HelpCircle size={13} /> },
                { id: "flashcards", label: `Kartalar (${flashcards.length})`, icon: <Brain size={13} /> },
              ] as const).map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === tab.id ? "bg-[#F5A623] text-black" : "text-slate-400 hover:text-white"}`}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {/* Overview */}
              {activeTab === "overview" && (
                <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Left */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* WOW Fact */}
                    {result.wow_fact && (
                      <div className="rounded-2xl border border-saffron/30 bg-saffron/5 p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">🤯</span>
                          <span className="text-xs font-bold text-saffron uppercase tracking-wider">WOW Fakt</span>
                        </div>
                        <p className="leading-relaxed" style={{ color: "var(--foreground)" }}>{result.wow_fact}</p>
                      </div>
                    )}
                    {/* Summary */}
                    {result.summary && (
                      <div className="rounded-2xl border border-[#0D9373]/25 bg-[#0D9373]/5 p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">📋</span>
                          <span className="text-xs font-bold text-[#0D9373] uppercase tracking-wider">Xulosa</span>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed">{result.summary}</p>
                      </div>
                    )}
                    {/* First 3 slides preview */}
                    {slides.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Slaydlar ko&apos;rinishi</p>
                        <div className="space-y-2">
                          {slides.slice(0, 3).map((s: any, i: number) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                              <span className="w-7 h-7 rounded-lg bg-[#F5A623]/20 flex items-center justify-center text-xs font-bold text-[#F5A623] shrink-0">{i + 1}</span>
                              <div>
                                <p className="font-bold text-sm">{s.title}</p>
                                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{s.content}</p>
                              </div>
                            </div>
                          ))}
                          {slides.length > 3 && (
                            <button onClick={() => setActiveTab("slides")} className="text-xs text-[#F5A623] font-bold hover:underline ml-10">
                              + {slides.length - 3} ta ko&apos;proq →
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right - Stats + Actions */}
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Yaratilgan kontent</p>
                      <div className="space-y-3">
                        {[
                          { label: "Slaydlar", value: slides.length, color: "#1B4FD8", icon: "📊" },
                          { label: "Quiz savollar", value: quiz.length, color: "#F5A623", icon: "❓" },
                          { label: "Flashcardlar", value: flashcards.length, color: "#0D9373", icon: "🃏" },
                        ].map((s) => (
                          <div key={s.label} className="flex justify-between items-center">
                            <span className="text-sm text-slate-400">{s.icon} {s.label}</span>
                            <span className="font-bold text-lg" style={{ color: s.color }}>{s.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button onClick={() => router.push("/professor/live")}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-[#E84855] to-[#f06470] text-white font-bold flex items-center justify-center gap-2 hover:shadow-lg transition">
                        <Play size={16} /> Jonli Dars Boshlash
                      </button>
                      <button onClick={() => router.push("/professor/quiz")}
                        className="w-full py-3 rounded-xl bg-[#F5A623]/20 border border-[#F5A623]/30 text-[#F5A623] font-bold flex items-center justify-center gap-2 hover:bg-[#F5A623]/30 transition">
                        <Radio size={16} /> Quiz Boshlash
                      </button>
                      <button onClick={() => router.push("/professor/lessons")}
                        className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition">
                        <BookOpen size={16} /> Darslarimga
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Slides */}
              {activeTab === "slides" && slides.length > 0 && (
                <motion.div key="sl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Slide viewer */}
                  <div className="lg:col-span-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden min-h-80">
                      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                        <span className="text-sm font-bold">Slayd {slideIdx + 1} / {slides.length}</span>
                        <div className="flex gap-2">
                          <button onClick={() => setSlideIdx((i) => Math.max(0, i - 1))} disabled={slideIdx === 0}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition">
                            <ChevronLeft size={14} />
                          </button>
                          <button onClick={() => setSlideIdx((i) => Math.min(slides.length - 1, i + 1))} disabled={slideIdx === slides.length - 1}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition">
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                      <AnimatePresence mode="wait">
                        <motion.div key={slideIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                          className="p-8">
                          <p className="text-xs text-[#F5A623] uppercase tracking-widest font-bold mb-3">Slayd {slideIdx + 1}</p>
                          <h2 className="text-2xl font-bold mb-4">{currentSlide?.title}</h2>
                          <p className="text-slate-300 leading-relaxed">{currentSlide?.content}</p>
                          {currentSlide?.notes && (
                            <div className="mt-5 p-3 rounded-xl bg-white/5 border border-white/10">
                              <p className="text-xs text-slate-400 font-bold mb-1">📝 Eslatmalar</p>
                              <p className="text-sm text-slate-400">{currentSlide.notes}</p>
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                    {/* Slide strip */}
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                      {slides.map((_: any, i: number) => (
                        <button key={i} onClick={() => setSlideIdx(i)}
                          className={`shrink-0 w-12 h-8 rounded text-xs font-bold transition ${i === slideIdx ? "bg-[#F5A623] text-black" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Slide list */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {slides.map((s: any, i: number) => (
                      <button key={i} onClick={() => setSlideIdx(i)}
                        className={`w-full text-left p-3 rounded-xl border transition ${i === slideIdx ? "border-[#F5A623] bg-[#F5A623]/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#F5A623] shrink-0">{i + 1}</span>
                          <p className="text-sm font-bold truncate">{s.title}</p>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{s.content}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Quiz */}
              {activeTab === "quiz" && (
                <motion.div key="qz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {quiz.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">Quiz savollar yaratilmadi</div>
                  ) : quiz.map((q: any, i: number) => (
                    <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                      <div className="flex items-start gap-3 mb-4">
                        <span className="w-8 h-8 rounded-xl bg-[#F5A623]/20 flex items-center justify-center text-sm font-bold text-[#F5A623] shrink-0">{i + 1}</span>
                        <p className="font-bold leading-relaxed">{q.question}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {(q.options || []).map((opt: string, j: number) => {
                          const letters = ["A", "B", "C", "D"];
                          const isCorrect = q.correct === letters[j] || q.correct === opt;
                          return (
                            <div key={j} className={`flex items-center gap-2 p-3 rounded-xl text-sm ${isCorrect ? "bg-[#0D9373]/15 border border-[#0D9373]/30" : "bg-white/5 border border-white/5"}`}>
                              <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${isCorrect ? "bg-[#0D9373] text-white" : "bg-white/10 text-slate-400"}`}>
                                {letters[j]}
                              </span>
                              <span className={isCorrect ? "text-[#0D9373] font-bold" : "text-slate-300"}>{opt}</span>
                              {isCorrect && <CheckCircle2 size={12} className="text-[#0D9373] ml-auto shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                      {q.explanation && (
                        <div className="mt-3 p-3 rounded-xl bg-[#1B4FD8]/10 border border-[#1B4FD8]/20 text-sm text-slate-300">
                          💡 {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Flashcards */}
              {activeTab === "flashcards" && (
                <motion.div key="fc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {flashcards.length === 0 ? (
                    <div className="col-span-3 text-center py-12 text-slate-400">Flashcardlar yaratilmadi</div>
                  ) : flashcards.map((f: any, i: number) => (
                    <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                      <div className="p-4 border-b border-white/5">
                        <p className="text-xs text-[#F5A623] font-bold uppercase tracking-wider mb-1">Savol</p>
                        <p className="font-bold text-sm leading-relaxed">{f.front}</p>
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-[#0D9373] font-bold uppercase tracking-wider mb-1">Javob</p>
                        <p className="text-sm text-slate-300 leading-relaxed">{f.back}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Mock lesson generator ────────────────────────────────────
function generateMockLesson(title: string, topic: string, duration: number, level: string) {
  const slideCount = Math.max(3, Math.floor(duration / 15));
  return {
    title,
    wow_fact: `${topic} bo'yicha qiziqarli fakt: bu soha XX asrda rivojlana boshlagan bo'lib, bugungi kunda texnologiyaning asosiy poydevori hisoblanadi.`,
    summary: `Bugungi darsda "${topic}" mavzusini chuqur o'rgandik. Asosiy tushunchalar, nazariy asoslar va amaliy misollar bilan tanishdik. ${level} darajasiga mos ${duration} daqiqalik dars sifatida tuzildi.`,
    slides: Array.from({ length: slideCount }, (_, i) => ({
      id: i + 1, slide_number: i + 1,
      title: i === 0 ? "Kirish va maqsad" : i === slideCount - 1 ? "Xulosa va savol-javob" : `${topic}: ${i}-qism`,
      content: i === 0
        ? `Bugungi dars maqsadi: "${topic}" mavzusini to'liq tushunish va amalda qo'llay olish. Dars davomida nazariy asoslar, misollar va interaktiv savollar bilan ishlashimiz.`
        : i === slideCount - 1
        ? `Xulosa: ${topic} bo'yicha barcha asosiy tushunchalarni o'zlashtirdik. Savol-javob qismi: qo'lingizni ko'taring yoki quiz orqali bilimingizni sinang.`
        : `${topic} mavzusining ${i}-qismi: bu yerda asosiy tushunchalar, formulalar va misollar keltirilgan. Har bir qadam ketma-ket tushuntiriladi.`,
      notes: `Professor uchun eslatma: bu qismda talabalar bilan interaktiv bo'ling, 1-2 ta savol bering.`,
      duration_min: Math.floor(duration / slideCount),
    })),
    quiz: [
      { question: `${topic} nima?`, options: [`${topic} — bu muhim tushuncha`, "Bu boshqa narsa", "Noto'g'ri ta'rif", "Umuman boshqa mavzu"], correct: "A", explanation: `${topic} — bu o'rganilayotgan mavzuning asosiy tushunchasidir.`, time_limit: 20, points: 1000 },
      { question: `${topic} qayerda qo'llaniladi?`, options: ["Faqat nazariyada", "Amaliyotda keng", "Hech qayerda", "Faqat laboratoriyada"], correct: "B", explanation: `${topic} amaliyotda keng qo'llaniladi va zamonaviy texnologiyada muhim o'rin tutadi.`, time_limit: 25, points: 1000 },
      { question: `${topic} o'rganish nima uchun muhim?`, options: ["Imtihon uchun", "Amaliy ko'nikmalar uchun", "Uncha muhim emas", "Faqat nazariy"], correct: "B", explanation: "Amaliy ko'nikmalar kasb faoliyatida zarur.", time_limit: 20, points: 1000 },
    ],
    flashcards: [
      { front: `${topic} ta'rifi nima?`, back: `${topic} — bu ${title} fanining asosiy tushunchasi bo'lib, nazariy va amaliy jihatlarga ega.` },
      { front: `${topic} qanday xususiyatlarga ega?`, back: "Tizimlilik, amaliylik, nazariy asoslanganlik va keng qo'llanilish imkoniyati." },
      { front: `${topic} qayerda ishlatiladi?`, back: "Ilm-fan, texnologiya, sanoat va kundalik hayotda keng foydalaniladi." },
      { front: `${topic} kimlar o'rganishi kerak?`, back: "Bu soha bilan qiziquvchi va uni kasbiy faoliyatda qo'llamoqchi bo'lgan barcha mutaxassislar." },
    ],
  };
}
