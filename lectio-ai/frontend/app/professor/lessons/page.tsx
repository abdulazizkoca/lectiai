"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Plus, Search, Play, Trash2, BarChart2, Radio,
  Clock, Users, ChevronRight, Loader2, X, Sparkles, Eye,
  Calendar, CheckCircle2, FileText, Zap
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";
import { lessonsAPI, sessionsAPI } from "@/lib/api";

const STATUSES = {
  active: { label: "Faol", color: "#0D9373", bg: "rgba(13,147,115,0.15)" },
  preparing: { label: "Tayyorlanmoqda", color: "#F5A623", bg: "rgba(245,166,35,0.15)" },
  completed: { label: "Tugatilgan", color: "#64748b", bg: "rgba(100,116,139,0.15)" },
};

export default function ProfessorLessonsPage() {
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState<number | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const getToken = () => localStorage.getItem("lectio_token") || "";
  const getProfId = () => { try { return JSON.parse(localStorage.getItem("lectio_user") || "{}").id || 1; } catch { return 1; } };

  // Load lessons
  useEffect(() => {
    const load = async () => {
      const token = getToken();
      const pid = getProfId();
      try {
        if (token && !token.startsWith("mock_")) {
          const res = await lessonsAPI.getByProfessor(pid, token);
          setLessons(res?.lessons || res || []);
        }
      } catch {
        // Fallback to localStorage saved lessons
        const saved = JSON.parse(localStorage.getItem("lectio_professor_lessons") || "[]");
        setLessons(saved);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Filter
  const filtered = lessons.filter((l) => {
    const matchSearch = l.title?.toLowerCase().includes(search.toLowerCase()) || l.topic?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (l.status || "preparing") === filter;
    return matchSearch && matchFilter;
  });

  // Start live session
  const handleStart = async (lesson: any) => {
    setStartingId(lesson.id);
    const token = getToken();
    try {
      if (token && !token.startsWith("mock_")) {
        const res = await sessionsAPI.create(lesson.id, token);
        if (res.success) {
          await sessionsAPI.start(res.session_id, token);
          localStorage.setItem("lectio_active_session", JSON.stringify({
            roomCode: res.room_code,
            sessionId: String(res.session_id),
            lessonId: lesson.id,
            lessonTitle: res.lesson_title || lesson.title,
          }));
          addToast({ title: "✅ Jonli dars boshlandi!", description: `Kod: ${res.room_code}`, type: "success" });
          setTimeout(() => router.push("/professor/live"), 800);
          return;
        }
      }
      // Fallback
      throw new Error("mock");
    } catch {
      const mockCode = `LECTIO-${Math.floor(1000 + Math.random() * 9000)}`;
      localStorage.setItem("lectio_active_session", JSON.stringify({
        roomCode: mockCode, sessionId: `mock_${Date.now()}`, lessonId: lesson.id, lessonTitle: lesson.title,
      }));
      addToast({ title: "Dars boshlandi (offline)", description: `Kod: ${mockCode}`, type: "warning" });
      setTimeout(() => router.push("/professor/live"), 800);
    } finally {
      setStartingId(null);
    }
  };

  // Delete lesson
  const handleDelete = (lessonId: number) => {
    setLessons((prev) => prev.filter((l) => l.id !== lessonId));
    const saved = JSON.parse(localStorage.getItem("lectio_professor_lessons") || "[]");
    localStorage.setItem("lectio_professor_lessons", JSON.stringify(saved.filter((l: any) => l.id !== lessonId)));
    setSelected(null);
    setDeletingId(null);
    addToast({ title: "O'chirildi", description: "Dars o'chirildi", type: "info" });
  };

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-[#F5A623]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-full p-4 md:p-6 relative z-10 text-slate-900 dark:text-white">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mening Darslarim</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{lessons.length} ta dars yaratilgan</p>
        </div>
        <button
          onClick={() => router.push("/professor/create-lesson")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F5A623] text-black font-bold hover:bg-[#f7b955] transition shadow-lg shadow-[#F5A623]/20"
        >
          <Plus size={16} /> Yangi Dars
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Darslarni qidirish..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/5 border border-black/8 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#F5A623] transition text-sm"
          />
        </div>
        <div className="flex gap-2">
          {["all", "active", "preparing", "completed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${filter === f ? "bg-[#F5A623] text-black" : "bg-black/[0.04] dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-black/8 dark:hover:bg-white/10"}`}
            >
              {f === "all" ? "Barchasi" : STATUSES[f as keyof typeof STATUSES]?.label || f}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-bold mb-2">{search ? "Dars topilmadi" : "Hali darslar yo'q"}</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{search ? `"${search}" bo'yicha natija yo'q` : "Birinchi darsni yarating"}</p>
          <button onClick={() => router.push("/professor/create-lesson")}
            className="px-6 py-3 rounded-xl bg-[#F5A623] text-black font-bold hover:bg-[#f7b955] transition">
            ✨ Dars Yaratish
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((lesson, i) => {
          const status = lesson.status || "preparing";
          const st = STATUSES[status as keyof typeof STATUSES] || STATUSES.preparing;
          const isStarting = startingId === lesson.id;

          return (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-black/8 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-5 flex flex-col hover:border-black/15 dark:hover:border-white/20 transition-all group"
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-[#F5A623]/15 flex items-center justify-center shrink-0">
                  <BookOpen size={20} className="text-[#F5A623]" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: st.bg, color: st.color }}>
                  {st.label}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-bold text-slate-900 dark:text-white mb-1 line-clamp-2 leading-snug">{lesson.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-1">{lesson.topic}</p>

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                {lesson.students > 0 && (
                  <span className="flex items-center gap-1"><Users size={12} />{lesson.students}</span>
                )}
                {lesson.duration_minutes && (
                  <span className="flex items-center gap-1"><Clock size={12} />{lesson.duration_minutes} daq</span>
                )}
                {lesson.created_at && (
                  <span className="flex items-center gap-1"><Calendar size={12} />{new Date(lesson.created_at).toLocaleDateString("uz-UZ")}</span>
                )}
              </div>

              {/* Progress bar */}
              {lesson.progress !== undefined && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Progress</span><span>{lesson.progress || 0}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-black/8 dark:bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-[#F5A623] transition-all" style={{ width: `${lesson.progress || 0}%` }} />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => handleStart(lesson)}
                  disabled={isStarting}
                  className="flex-1 py-2.5 rounded-xl bg-[#0D9373]/20 border border-[#0D9373]/30 text-[#0D9373] font-bold text-sm hover:bg-[#0D9373]/30 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isStarting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                  Boshlash
                </button>
                <button
                  onClick={() => router.push("/professor/quiz")}
                  className="flex-1 py-2.5 rounded-xl bg-[#F5A623]/15 border border-[#F5A623]/25 text-[#F5A623] font-bold text-sm hover:bg-[#F5A623]/25 transition flex items-center justify-center gap-1.5"
                >
                  <Radio size={14} /> Quiz
                </button>
                <button
                  onClick={() => setSelected(lesson)}
                  className="py-2.5 px-3 rounded-xl bg-black/[0.04] dark:bg-white/5 border border-black/8 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-black/8 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Lesson Detail Sidebar */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-[#0F0F18] border-l border-black/10 dark:border-white/10 shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-black/8 dark:border-white/10">
                <h2 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1">{selected.title}</h2>
                <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white transition">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Status */}
                <div>
                  {(() => {
                    const st = STATUSES[(selected.status || "preparing") as keyof typeof STATUSES] || STATUSES.preparing;
                    return (
                      <span className="text-sm font-bold px-3 py-1.5 rounded-xl" style={{ background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                    );
                  })()}
                </div>

                {/* Info */}
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-black/[0.03] dark:bg-white/5 border border-black/8 dark:border-white/10">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Mavzu</p>
                    <p className="font-medium text-slate-900 dark:text-white">{selected.topic || "—"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                      <p className="text-xl font-bold text-[#F5A623]">{selected.students || 0}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Talaba</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                      <p className="text-xl font-bold text-[#1B4FD8]">{selected.duration_minutes || selected.duration || 45}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Daqiqa</p>
                    </div>
                  </div>
                </div>

                {/* WOW Fact */}
                {(selected.wow_fact || selected.presentation_data?.wow_fact) && (
                  <div className="p-4 rounded-xl bg-[#F5A623]/10 border border-[#F5A623]/20">
                    <p className="text-xs text-[#F5A623] font-bold uppercase tracking-wider mb-1">🤯 WOW Fakt</p>
                    <p className="text-sm text-slate-200">{selected.wow_fact || selected.presentation_data?.wow_fact}</p>
                  </div>
                )}

                {/* Summary */}
                {(selected.summary || selected.presentation_data?.summary) && (
                  <div className="p-4 rounded-xl bg-black/[0.03] dark:bg-white/5 border border-black/8 dark:border-white/10">
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">📋 Xulosa</p>
                    <p className="text-sm text-slate-300">{selected.summary || selected.presentation_data?.summary}</p>
                  </div>
                )}

                {/* Slides count */}
                {(selected.presentation_data?.slides?.length > 0) && (
                  <div className="p-4 rounded-xl bg-black/[0.03] dark:bg-white/5 border border-black/8 dark:border-white/10">
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><FileText size={10} /> Slaydlar</p>
                    <p className="font-bold text-white">{selected.presentation_data.slides.length} ta slayd</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-black/8 dark:border-white/10 space-y-2">
                {deletingId === selected.id ? (
                  <div className="flex gap-2">
                    <button onClick={() => setDeletingId(null)}
                      className="flex-1 py-3 rounded-xl bg-black/[0.04] dark:bg-white/5 border border-black/8 dark:border-white/10 text-slate-500 dark:text-slate-400 font-bold text-sm hover:bg-black/8 dark:hover:bg-white/10 transition">
                      Bekor qilish
                    </button>
                    <button onClick={() => handleDelete(selected.id)}
                      className="flex-1 py-3 rounded-xl bg-[#E84855] text-white font-bold text-sm hover:bg-red-600 transition">
                      Ha, o&apos;chirish
                    </button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => handleStart(selected)} disabled={startingId === selected.id}
                      className="w-full py-3 rounded-xl bg-[#0D9373] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#0ba882] transition disabled:opacity-50">
                      {startingId === selected.id ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                      Jonli Darsni Boshlash
                    </button>
                    <div className="flex gap-2">
                      <button onClick={() => router.push("/professor/quiz")}
                        className="flex-1 py-2.5 rounded-xl bg-[#F5A623]/15 border border-[#F5A623]/25 text-[#F5A623] font-bold text-sm hover:bg-[#F5A623]/25 transition flex items-center justify-center gap-1.5">
                        <Radio size={14} /> Quiz
                      </button>
                      <button onClick={() => router.push("/professor/analytics")}
                        className="flex-1 py-2.5 rounded-xl bg-[#1B4FD8]/15 border border-[#1B4FD8]/25 text-[#6B8FFF] font-bold text-sm hover:bg-[#1B4FD8]/25 transition flex items-center justify-center gap-1.5">
                        <BarChart2 size={14} /> Tahlil
                      </button>
                      <button onClick={() => setDeletingId(selected.id)}
                        className="py-2.5 px-3 rounded-xl bg-[#E84855]/10 border border-[#E84855]/20 text-[#E84855] font-bold text-sm hover:bg-[#E84855]/20 transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
