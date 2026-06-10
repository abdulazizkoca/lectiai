"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  BookOpen, Plus, Play, BarChart2, ArrowRight, Loader2,
  Video, Users, Brain, Zap, TrendingUp, Clock, ChevronRight,
  Sparkles, Radio, FolderOpen, ShieldAlert, Flame, Star,
  CheckCircle2, Bell, Eye, Target, Award, Activity
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";
import { authAPI, lessonsAPI, sessionsAPI } from "@/lib/api";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const AI_TIPS = [
  { icon: "💡", tip: "Metodichkangizni yuklang — AI mavzularni ajratib, har biridan to'liq dars tayyorlab beradi.", action: "/professor/materials", actionLabel: "Yuklash" },
  { icon: "🎯", tip: "Jonli Quiz o'tkazing — talabalar real-vaqtda javob beradi, siz esa diqqat darajasini ko'rasiz.", action: "/professor/quiz", actionLabel: "Quiz boshlash" },
  { icon: "📊", tip: "Analitika sahifasida talabalar o'zlashtirish xaritasini ko'ring.", action: "/professor/analytics", actionLabel: "Ko'rish" },
  { icon: "✨", tip: "AI yordamida yangi dars yarating — slaydlar, savollar va flashcardlar avtomatik yaratiladi.", action: "/professor/create-lesson", actionLabel: "Yaratish" },
];

const WEEK_DATA = [
  { day: "Du", lessons: 2, attention: 78 },
  { day: "Se", lessons: 3, attention: 85 },
  { day: "Ch", lessons: 1, attention: 72 },
  { day: "Pa", lessons: 4, attention: 91 },
  { day: "Ju", lessons: 2, attention: 68 },
  { day: "Sh", lessons: 0, attention: 0 },
  { day: "Ya", lessons: 0, attention: 0 },
];

export default function ProfessorDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [tipIdx, setTipIdx] = useState(0);
  const [startingId, setStartingId] = useState<number | null>(null);
  const [stats, setStats] = useState({ lessons: 0, students: 0, attention: 76, week: 0 });

  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();

  // Rotate AI tips
  useEffect(() => {
    const iv = setInterval(() => setTipIdx((i) => (i + 1) % AI_TIPS.length), 8000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("lectio_token");
    const load = async () => {
      const stored = localStorage.getItem("lectio_active_session");
      if (stored) setActiveSession(JSON.parse(stored));

      if (!token || token.startsWith("mock_")) { setLoading(false); return; }
      try {
        const me = await authAPI.getMe(token);
        setUser(me);
        localStorage.setItem("lectio_user", JSON.stringify(me));
        try {
          const res = await lessonsAPI.getByProfessor(me.id, token);
          const ls = res?.lessons || res || [];
          setLessons(ls);
          setStats((s) => ({ ...s, lessons: ls.length, week: ls.filter((l: any) => {
            if (!l.created_at) return false;
            const d = new Date(l.created_at);
            const now = new Date();
            return (now.getTime() - d.getTime()) < 7 * 24 * 3600 * 1000;
          }).length }));
        } catch {}
        // Try analytics
        try {
          const a = await fetch(`${API_URL}/api/analytics/overview`, { headers: { Authorization: `Bearer ${token}` } });
          if (a.ok) { const d = await a.json(); setStats((s) => ({ ...s, students: d.active_students || s.students, attention: d.avg_attention || s.attention })); }
        } catch {}
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const handleStart = async (lessonId: number, title: string) => {
    const token = localStorage.getItem("lectio_token");
    if (!token || token.startsWith("mock_")) { setShowModal(true); return; }
    setStartingId(lessonId);
    try {
      const res = await sessionsAPI.create(lessonId, token);
      if (res.success) {
        await sessionsAPI.start(res.session_id, token);
        const data = { roomCode: res.room_code, sessionId: String(res.session_id), lessonId, lessonTitle: res.lesson_title || title };
        localStorage.setItem("lectio_active_session", JSON.stringify(data));
        setActiveSession(data);
        addToast({ title: "✅ Dars boshlandi!", description: `Kod: ${res.room_code}`, type: "success" });
        router.push("/professor/live");
        return;
      }
    } catch {}
    const mockCode = `LECTIO-${Math.floor(1000 + Math.random() * 9000)}`;
    const data = { roomCode: mockCode, sessionId: `mock_${Date.now()}`, lessonId, lessonTitle: title };
    localStorage.setItem("lectio_active_session", JSON.stringify(data));
    setActiveSession(data);
    addToast({ title: "Offline sessiya", description: `Kod: ${mockCode}`, type: "warning" });
    router.push("/professor/live");
    setStartingId(null);
  };

  if (loading) return (
    <div className="min-h-full flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-[#F5A623] animate-spin mx-auto mb-3" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">Yuklanmoqda...</p>
      </div>
    </div>
  );

  const displayLessons = lessons.length > 0 ? lessons.slice(0, 4).map((l: any) => ({
    id: l.id, title: l.title,
    date: l.created_at ? new Date(l.created_at).toLocaleDateString("uz-UZ") : "Bugun",
    topic: l.topic || "Umumiy",
    status: l.status || "preparing",
  })) : [
    { id: 1, title: "Kvant fizikasi asoslari", date: "Bugun", topic: "Fizika", status: "active" },
    { id: 2, title: "Ma'lumotlar tuzilmasi", date: "Kecha", topic: "Informatika", status: "preparing" },
    { id: 3, title: "Integral hisob", date: "2 kun oldin", topic: "Matematika", status: "completed" },
  ];

  const firstName = user?.full_name?.split(" ")[0] || "Professor";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Xayrli tong" : hour < 17 ? "Xayrli kun" : "Xayrli kech";
  const tip = AI_TIPS[tipIdx];

  const MAIN_ACTIONS = [
    { title: "Jonli Dars", desc: "Kamera + real-time kuzatuv", icon: <Video size={22} />, color: "#E84855", bg: "rgba(232,72,85,0.12)", href: "/professor/live", badge: activeSession ? "FAOL" : null, glow: !!activeSession },
    { title: "Dars Yaratish", desc: "AI bilan slayd va testlar", icon: <Sparkles size={22} />, color: "#1B4FD8", bg: "rgba(27,79,216,0.12)", href: "/professor/create-lesson" },
    { title: "Metodichka", desc: "PDF/Word → AI dars", icon: <FolderOpen size={22} />, color: "#0D9373", bg: "rgba(13,147,115,0.12)", href: "/professor/materials" },
    { title: "Jonli Quiz", desc: "Real-time test va reyting", icon: <Radio size={22} />, color: "#F5A623", bg: "rgba(245,166,35,0.12)", href: "/professor/quiz", badge: "AI" },
    { title: "Analitika", desc: "Statistika va tahlillar", icon: <BarChart2 size={22} />, color: "#06B6D4", bg: "rgba(6,182,212,0.12)", href: "/professor/analytics" },
    { title: "Talabalar", desc: "Guruh va monitoring", icon: <Users size={22} />, color: "#7B2FBE", bg: "rgba(123,47,190,0.12)", href: "/professor/students" },
  ];

  const QUICK_STATS = [
    { label: "Jami darslar", value: String(stats.lessons || displayLessons.length), icon: <BookOpen size={16} />, color: "#1B4FD8", chart: WEEK_DATA.map(d => ({ v: d.lessons })) },
    { label: "Talabalar", value: stats.students > 0 ? String(stats.students) : "—", icon: <Users size={16} />, color: "#0D9373", chart: WEEK_DATA.map(d => ({ v: d.attention })) },
    { label: "O'rt. diqqat", value: `${stats.attention}%`, icon: <Eye size={16} />, color: "#F5A623", chart: WEEK_DATA.map(d => ({ v: d.attention })) },
    { label: "Bu hafta", value: `${stats.week} dars`, icon: <Activity size={16} />, color: "#7B2FBE", chart: WEEK_DATA.map(d => ({ v: d.lessons })) },
  ];

  return (
    <div className="min-h-full text-slate-900 dark:text-white p-4 md:p-6 xl:p-8 flex flex-col gap-6 relative z-10">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-2xl sm:text-3xl font-bold tracking-tight">
            {greeting}, <span className="text-[#F5A623]">{firstName}</span> 👋
          </motion.h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex items-center gap-2">
            {new Date().toLocaleDateString("uz-UZ", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {activeSession && (
            <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              onClick={() => router.push("/professor/live")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 transition">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative h-2 w-2 rounded-full bg-red-500" />
              </span>
              <span className="text-sm font-bold text-red-400">Jonli dars</span>
              <span className="font-mono text-xs bg-red-500/20 px-2 py-0.5 rounded text-red-300">{activeSession.roomCode}</span>
              <ChevronRight size={14} className="text-red-400" />
            </motion.button>
          )}
          <button onClick={() => router.push("/professor/create-lesson")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F5A623] text-black font-bold text-sm hover:bg-[#f7b955] transition shadow-lg shadow-[#F5A623]/20">
            <Plus size={16} /> Dars yaratish
          </button>
        </div>
      </header>

      {/* ── Quick Stats ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {QUICK_STATS.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="rounded-2xl border border-black/8 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-4 overflow-hidden relative">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.color}22`, color: s.color }}>
                {s.icon}
              </div>
            </div>
            <p className="text-2xl font-bold mb-0.5">{s.value}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
            {/* Mini sparkline */}
            <div className="absolute bottom-0 left-0 right-0 h-10 opacity-30">
              <ResponsiveContainer width="100%" height={40}>
                <AreaChart data={s.chart}>
                  <defs>
                    <linearGradient id={`g${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={s.color} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke={s.color} strokeWidth={1.5} fill={`url(#g${i})`} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Main 2-column layout ─────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left — Main Actions + Lessons */}
        <div className="xl:col-span-2 space-y-6">

          {/* Main Actions */}
          <section>
            <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Tezkor amallar</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {MAIN_ACTIONS.map((a, i) => (
                <motion.div key={a.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                  onClick={() => router.push(a.href)}
                  className={`relative rounded-2xl border cursor-pointer group transition-all duration-200 hover:-translate-y-1 overflow-hidden ${a.glow ? "border-red-500/40 shadow-lg shadow-red-500/10 bg-red-500/5 dark:bg-red-500/[0.08]" : "border-black/8 dark:border-white/10 hover:border-black/15 dark:hover:border-white/25 bg-black/[0.02] dark:bg-white/[0.03]"}`}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: a.bg, color: a.color }}>
                        {a.icon}
                      </div>
                      {a.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                          background: a.badge === "FAOL" ? "rgba(232,72,85,0.2)" : "rgba(245,166,35,0.2)",
                          color: a.badge === "FAOL" ? "#E84855" : "#F5A623"
                        }}>{a.badge}</span>
                      )}
                    </div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{a.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{a.desc}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs font-bold group-hover:gap-2 transition-all" style={{ color: a.color }}>
                      O&apos;tish <ArrowRight size={11} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Recent Lessons */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">So&apos;nggi darslar</h2>
              <Link href="/professor/lessons" className="text-xs text-slate-500 dark:text-slate-400 hover:text-[#F5A623] transition flex items-center gap-1 font-bold">
                Barchasi <ChevronRight size={12} />
              </Link>
            </div>
            <div className="rounded-2xl border border-black/8 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] overflow-hidden">
              {displayLessons.map((l, i) => {
                const statusColors: any = { active: "#0D9373", preparing: "#F5A623", completed: "#64748b" };
                const statusLabels: any = { active: "Faol", preparing: "Tayyorlanmoqda", completed: "Tugatilgan" };
                return (
                  <motion.div key={l.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
                    className={`flex items-center gap-4 p-4 hover:bg-black/[0.03] dark:hover:bg-white/5 transition group ${i < displayLessons.length - 1 ? "border-b border-black/5 dark:border-white/5" : ""}`}>
                    <div className="w-9 h-9 rounded-xl bg-[#1B4FD8]/15 flex items-center justify-center shrink-0 group-hover:bg-[#1B4FD8]/25 transition">
                      <BookOpen size={15} className="text-[#1B4FD8]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{l.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{l.topic} · {l.date}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full hidden sm:inline" style={{ background: `${statusColors[l.status] || "#64748b"}22`, color: statusColors[l.status] || "#64748b" }}>
                        {statusLabels[l.status] || "—"}
                      </span>
                      {l.status !== "completed" && (
                        <button onClick={() => handleStart(l.id, l.title)} disabled={startingId === l.id}
                          className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#0D9373]/15 text-[#0D9373] hover:bg-[#0D9373]/25 transition disabled:opacity-50">
                          {startingId === l.id ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />}
                          Boshlash
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              {displayLessons.length === 0 && (
                <div className="p-8 text-center">
                  <BookOpen size={32} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Hali darslar yaratilmagan</p>
                  <button onClick={() => router.push("/professor/create-lesson")} className="mt-3 text-xs text-[#F5A623] font-bold hover:underline">+ Dars yaratish</button>
                </div>
              )}
            </div>
          </section>

          {/* Week Chart */}
          <section>
            <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Haftalik faollik</h2>
            <div className="rounded-2xl border border-black/8 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-5">
              <div className="flex items-end gap-2 h-20">
                {WEEK_DATA.map((d, i) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div initial={{ height: 0 }} animate={{ height: d.lessons * 16 }} transition={{ delay: i * 0.05, duration: 0.4 }}
                      className="w-full rounded-t-md" style={{ background: d.lessons > 0 ? "#F5A623" : "rgba(0,0,0,0.06)", minHeight: 4 }} />
                    <span className="text-xs text-slate-500">{d.day}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-3 text-center">Bu hafta {WEEK_DATA.reduce((a, d) => a + d.lessons, 0)} ta dars o&apos;tkazildi</p>
            </div>
          </section>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">

          {/* AI Daily Tip */}
          <AnimatePresence mode="wait">
            <motion.div key={tipIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl border border-[#7B2FBE]/30 p-5"
              style={{ background: "linear-gradient(135deg, rgba(27,79,216,0.08), rgba(123,47,190,0.12))" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-[#7B2FBE]/20 flex items-center justify-center text-base">
                  {tip.icon}
                </div>
                <span className="text-xs font-bold text-[#A78BFA] uppercase tracking-wider">AI Tavsiya</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed mb-3">{tip.tip}</p>
              <button onClick={() => router.push(tip.action)}
                className="text-xs font-bold text-[#A78BFA] hover:text-white flex items-center gap-1 transition">
                {tip.actionLabel} <ArrowRight size={11} />
              </button>
              <div className="flex gap-1 mt-3">
                {AI_TIPS.map((_, i) => (
                  <button key={i} onClick={() => setTipIdx(i)}
                    className="h-1 rounded-full transition-all"
                    style={{ width: i === tipIdx ? 20 : 8, background: i === tipIdx ? "#A78BFA" : "rgba(255,255,255,0.15)" }} />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Today's Goals */}
          <div className="rounded-2xl border border-black/8 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Target size={16} className="text-[#F5A623]" />
              <h3 className="font-bold text-sm">Bugungi maqsadlar</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: "1 ta jonli dars o'tkazish", done: !!activeSession },
                { label: "Metodichka yuklash", done: false },
                { label: "Quiz o'tkazish", done: false },
                { label: "Talabalar tahlilini ko'rish", done: false },
              ].map((goal, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${goal.done ? "bg-[#0D9373] border-[#0D9373]" : "border-black/15 dark:border-white/20"}`}>
                    {goal.done && <CheckCircle2 size={10} className="text-white" />}
                  </div>
                  <span className={`text-sm transition ${goal.done ? "line-through text-slate-400" : "text-slate-600 dark:text-slate-300"}`}>{goal.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span>Progress</span>
                <span className="font-bold text-[#F5A623]">{Math.round(([!!activeSession, false, false, false].filter(Boolean).length / 4) * 100)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-black/8 dark:bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-[#F5A623]" style={{ width: `${([!!activeSession, false, false, false].filter(Boolean).length / 4) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Professor Stats */}
          <div className="rounded-2xl border border-black/8 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Award size={16} className="text-amber-400" />
              <h3 className="font-bold text-sm">Profil statistikasi</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "XP Ball", value: "2,450", icon: <Star size={14} />, color: "#F5A623" },
                { label: "Streak", value: "7 kun", icon: <Flame size={14} />, color: "#E84855" },
                { label: "Darslar", value: String(stats.lessons || displayLessons.length), icon: <BookOpen size={14} />, color: "#1B4FD8" },
                { label: "Reyting", value: "#12", icon: <TrendingUp size={14} />, color: "#0D9373" },
              ].map((s) => (
                <div key={s.label} className="p-3 rounded-xl bg-black/[0.03] dark:bg-white/5 border border-black/6 dark:border-white/5">
                  <div className="flex items-center gap-1.5 mb-1" style={{ color: s.color }}>
                    {s.icon}
                    <span className="text-xs font-bold">{s.label}</span>
                  </div>
                  <p className="font-bold text-base">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick create */}
          <div className="rounded-2xl border border-black/8 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-5">
            <h3 className="font-bold text-sm mb-3">Tezkor yaratish</h3>
            <div className="space-y-2">
              {[
                { label: "✨ AI bilan dars yaratish", href: "/professor/create-lesson", color: "#F5A623" },
                { label: "📄 Metodichka yuklash", href: "/professor/materials", color: "#0D9373" },
                { label: "🎮 Quiz boshlash", href: "/professor/quiz", color: "#1B4FD8" },
              ].map((item) => (
                <button key={item.href} onClick={() => router.push(item.href)}
                  className="w-full text-left px-4 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/5 border border-black/8 dark:border-white/10 hover:border-black/15 dark:hover:border-white/25 hover:bg-black/[0.06] dark:hover:bg-white/10 transition text-sm font-bold flex items-center justify-between"
                  style={{ color: item.color }}>
                  {item.label}
                  <ChevronRight size={14} className="text-slate-500" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0F0F16] p-6 text-center shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-[#F5A623]/10 border border-[#F5A623]/25 flex items-center justify-center text-[#F5A623] mx-auto mb-4">
                <ShieldAlert size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Kirish talab qilinadi</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Bu amalni bajarish uchun tizimga kiring.</p>
              <div className="flex flex-col gap-2">
                <Button variant="primary" onClick={() => { setShowModal(false); router.push("/login"); }} className="w-full font-bold">Kirish</Button>
                <button onClick={() => setShowModal(false)} className="text-xs text-slate-500 hover:text-slate-300 transition py-2">Bekor qilish</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
