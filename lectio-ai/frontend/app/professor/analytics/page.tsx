"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download, Filter, X, TrendingUp, TrendingDown, Users, BookOpen,
  Eye, Target, MessageSquare, Brain, Loader2, RefreshCw, Calendar
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area
} from "recharts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ─── Mock data (fallback) ─────────────────────────────────────
const MOCK_TIMELINE = [
  { time: "00:00", attention: 85, event: "Dars boshlandi" },
  { time: "10:00", attention: 90 },
  { time: "20:00", attention: 82 },
  { time: "30:00", attention: 65, event: "Diqqat pasaydi" },
  { time: "35:00", attention: 88, event: "Jonli Quiz" },
  { time: "45:00", attention: 75 },
  { time: "60:00", attention: 70 },
  { time: "70:00", attention: 55, event: "Charchoq" },
  { time: "75:00", attention: 80, event: "WOW Fakt" },
  { time: "80:00", attention: 78 },
];

const MOCK_STUDENTS = [
  { id: 1, name: "Jasur Karimov", topics: [90, 85, 40, 95], avg: 77, streak: 12 },
  { id: 2, name: "Malika Aliyeva", topics: [88, 92, 85, 90], avg: 89, streak: 21 },
  { id: 3, name: "Aziz Tohirov", topics: [45, 60, 55, 70], avg: 57, streak: 3 },
  { id: 4, name: "Sarvar Davlatov", topics: [95, 95, 90, 100], avg: 95, streak: 30 },
  { id: 5, name: "Nigina Umarova", topics: [70, 75, 65, 80], avg: 72, streak: 7 },
];
const TOPICS = ["SQL", "Agile", "React", "Algoritmlar"];

const MOCK_QUIZ = [
  { question: "Q-12: Kvant Entropiya", correct: 25, total: 100, difficulty: "hard" },
  { question: "Q-08: Zichlik formulasi", correct: 40, total: 100, difficulty: "hard" },
  { question: "Q-03: Kinetik energiya", correct: 65, total: 100, difficulty: "medium" },
  { question: "Q-01: Ishqalanish kuchi", correct: 95, total: 100, difficulty: "easy" },
];

const DAYS = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
const HOURS = ["8:00", "9:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

// ─── Component ────────────────────────────────────────────────
export default function AnalyticsDashboard() {
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ lessons: 24, attention: 78, quiz: 82.4, students: 156 });
  const [heatmapData] = useState(() =>
    DAYS.map((day) => ({
      day,
      hours: HOURS.map((h) => ({
        hour: h,
        value: Math.floor(Math.random() * 100),
      })),
    }))
  );

  const getProfId = () => { try { return JSON.parse(localStorage.getItem("lectio_user") || "{}").id || null; } catch { return null; } };

  useEffect(() => {
    const pid = getProfId();
    if (!pid) return;
    // Try to load real stats
    fetch(`${API_URL}/api/analytics/overview`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("lectio_token") || ""}` },
    }).then((r) => r.json()).then((d) => {
      if (d.total_lessons !== undefined) setStats({ lessons: d.total_lessons, attention: d.avg_attention || 78, quiz: d.avg_quiz_score || 82.4, students: d.active_students || 156 });
    }).catch(() => {});
  }, []);

  const getHeatColor = (v: number) => {
    if (v >= 80) return "#0D9373";
    if (v >= 60) return "#F5A623";
    if (v >= 40) return "#E8485580";
    return "rgba(255,255,255,0.05)";
  };
  const getHeatmapBg = (v: number) => {
    if (v >= 80) return "rgba(13,147,115,0.2) text-[#0D9373]";
    if (v >= 60) return "rgba(245,166,35,0.2) text-[#F5A623]";
    return "rgba(232,72,85,0.15) text-[#E84855]";
  };

  const metricCards = [
    { title: "Jami darslar", value: String(stats.lessons), icon: <BookOpen size={20} />, trend: "+2", up: true, color: "#1B4FD8" },
    { title: "O'rtacha diqqat", value: `${stats.attention}%`, icon: <Eye size={20} />, trend: "-3%", up: false, color: "#0D9373" },
    { title: "Test o'rtacha bali", value: String(stats.quiz), icon: <Target size={20} />, trend: "+4.1", up: true, color: "#F5A623" },
    { title: "Aktiv talabalar", value: String(stats.students), icon: <Users size={20} />, trend: "95% retention", up: true, color: "#7B2FBE" },
  ];

  return (
    <div className="p-4 md:p-6 xl:p-8 max-w-7xl mx-auto space-y-8 text-white relative z-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analitika</h1>
          <p className="text-slate-400 text-sm mt-0.5">Dars samaradorligi va talabalar statistikasi</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition text-sm font-bold">
            <Calendar size={14} /> Bu hafta
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition text-sm font-bold">
            <Filter size={14} /> Filtr
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1B4FD8]/20 border border-[#1B4FD8]/30 text-[#6B8FFF] hover:bg-[#1B4FD8]/30 transition text-sm font-bold">
            <Download size={14} /> PDF
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((m, i) => (
          <motion.div key={m.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${m.color}22`, color: m.color }}>
                {m.icon}
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-0.5 ${m.up ? "bg-[#0D9373]/20 text-[#0D9373]" : "bg-[#E84855]/20 text-[#E84855]"}`}>
                {m.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {m.trend}
              </span>
            </div>
            <p className="text-2xl font-bold font-mono mb-1">{m.value}</p>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">{m.title}</p>
          </motion.div>
        ))}
      </div>

      {/* Attention Timeline */}
      <section>
        <h2 className="text-lg font-bold mb-4">Dars davomidagi diqqat (Timeline)</h2>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5" style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={MOCK_TIMELINE} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0D9373" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0D9373" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="time" stroke="#475569" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} stroke="#475569" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
              <RechartsTooltip
                contentStyle={{ backgroundColor: "#18181F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff" }}
                formatter={(v: any) => [`${v}%`, "Diqqat"]}
              />
              <ReferenceLine y={70} stroke="#E84855" strokeDasharray="4 4" label={{ value: "70% chegara", fill: "#E84855", fontSize: 11 }} />
              <Area type="monotone" dataKey="attention" stroke="#0D9373" strokeWidth={3} fill="url(#attGrad)"
                dot={(p: any) => p.payload.event ? <circle cx={p.cx} cy={p.cy} r={5} fill="#F5A623" stroke="#0A0A0F" strokeWidth={2} /> : <circle r={0} />}
                activeDot={{ r: 7, fill: "#0D9373", stroke: "#0A0A0F", strokeWidth: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Heatmap */}
        <section>
          <h2 className="text-lg font-bold mb-4">Mavzular bo'yicha o'zlashtirish</h2>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs text-slate-400 uppercase tracking-wider font-bold">Talaba</th>
                  {TOPICS.map((t) => <th key={t} className="px-3 py-3 text-center text-xs text-slate-400 uppercase tracking-wider font-bold">{t}</th>)}
                  <th className="px-3 py-3 text-center text-xs text-slate-400 uppercase tracking-wider font-bold">O'rt.</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_STUDENTS.map((s) => (
                  <tr key={s.id} onClick={() => setSelectedStudent(s)}
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition">
                    <td className="px-4 py-3 font-bold text-sm">{s.name}</td>
                    {s.topics.map((score, i) => (
                      <td key={i} className="px-3 py-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded-lg font-bold ${getHeatmapBg(score)}`}>{score}%</span>
                      </td>
                    ))}
                    <td className="px-3 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-lg font-bold ${getHeatmapBg(s.avg)}`}>{s.avg}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quiz Difficulty */}
        <section>
          <h2 className="text-lg font-bold mb-4">Test qiyinlik tahlili</h2>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={MOCK_QUIZ} layout="vertical" margin={{ top: 0, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="question" type="category" axisLine={false} tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 11 }} width={160} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: "#18181F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff" }}
                    formatter={(v: any) => [`${v}%`, "To'g'ri"]}
                  />
                  <Bar dataKey="correct" radius={[0, 6, 6, 0]} barSize={20}>
                    {MOCK_QUIZ.map((e, i) => (
                      <Cell key={i} fill={e.difficulty === "hard" ? "#E84855" : e.difficulty === "medium" ? "#F5A623" : "#0D9373"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 p-3 rounded-xl bg-[#E84855]/10 border border-[#E84855]/20 flex gap-3 items-start">
              <Brain size={16} className="text-[#E84855] shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300">
                <strong className="text-[#E84855]">AI Tavsiya:</strong> Q-12 va Q-08 savollarida talabalar qiynalmoqda. Bu mavzularni qayta tushuntirish tavsiya etiladi.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Activity Heatmap */}
      <section>
        <h2 className="text-lg font-bold mb-4">Haftalik faollik xaritasi</h2>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="flex gap-2 mb-2">
              <div className="w-8" />
              {HOURS.map((h) => <div key={h} className="flex-1 text-center text-xs text-slate-500">{h}</div>)}
            </div>
            {heatmapData.map((dayData) => (
              <div key={dayData.day} className="flex gap-2 mb-1.5 items-center">
                <div className="w-8 text-xs text-slate-400 font-bold text-right shrink-0">{dayData.day}</div>
                {dayData.hours.map((cell) => (
                  <div key={cell.hour}
                    className="flex-1 h-7 rounded-md transition-all hover:scale-110 cursor-pointer relative group"
                    style={{ background: getHeatColor(cell.value), opacity: cell.value > 0 ? 0.6 + cell.value * 0.004 : 0.2 }}
                    title={`${dayData.day} ${cell.hour}: ${cell.value}% faollik`}
                  />
                ))}
              </div>
            ))}
            <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
              <span>Kam</span>
              {["rgba(255,255,255,0.05)", "#E8485550", "#F5A62380", "#0D9373"].map((c) => (
                <div key={c} className="w-5 h-4 rounded" style={{ background: c }} />
              ))}
              <span>Ko'p</span>
              <span className="ml-auto text-[#F5A623] font-bold">💡 Chorshanba 10:00-12:00 — eng yuqori faollik</span>
            </div>
          </div>
        </div>
      </section>

      {/* Student Detail Panel */}
      <AnimatePresence>
        {selectedStudent && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedStudent(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0F0F18] border-l border-white/10 shadow-2xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <h2 className="font-bold text-lg">Talaba profili</h2>
                <button onClick={() => setSelectedStudent(null)} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Avatar + Name */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1B4FD8] to-[#7B2FBE] flex items-center justify-center text-xl font-bold text-white border-2 border-[#1B4FD8]/50">
                    {selectedStudent.name.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedStudent.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#0D9373]/20 text-[#0D9373]">Faol</span>
                      <span className="text-xs text-slate-400">🔥 {selectedStudent.streak} kunlik streak</span>
                    </div>
                  </div>
                </div>

                {/* Avg Score */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-2xl font-bold" style={{ color: selectedStudent.avg >= 80 ? "#0D9373" : selectedStudent.avg >= 60 ? "#F5A623" : "#E84855" }}>{selectedStudent.avg}%</p>
                    <p className="text-xs text-slate-400 mt-0.5">O'rtacha ball</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-2xl font-bold text-[#F5A623]">{selectedStudent.streak}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Streak kun</p>
                  </div>
                </div>

                {/* Radar chart */}
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={TOPICS.map((t, i) => ({ topic: t, score: selectedStudent.topics[i] || 0 }))}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="topic" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Score" dataKey="score" stroke="#1B4FD8" fill="#1B4FD8" fillOpacity={0.3} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Topics breakdown */}
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-3">Mavzular bo&apos;yicha</p>
                  <div className="space-y-2">
                    {TOPICS.map((t, i) => {
                      const score = selectedStudent.topics[i];
                      return (
                        <div key={t}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-300">{t}</span>
                            <span className="font-bold" style={{ color: score >= 80 ? "#0D9373" : score >= 60 ? "#F5A623" : "#E84855" }}>{score}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ delay: i * 0.1, duration: 0.6 }}
                              className="h-full rounded-full" style={{ background: score >= 80 ? "#0D9373" : score >= 60 ? "#F5A623" : "#E84855" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Recommendation */}
                {selectedStudent.avg < 70 && (
                  <div className="p-4 rounded-xl bg-[#1B4FD8]/10 border border-[#1B4FD8]/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain size={14} className="text-[#1B4FD8]" />
                      <span className="text-xs font-bold text-[#1B4FD8] uppercase">AI Tavsiya</span>
                    </div>
                    <p className="text-sm text-slate-300">
                      {selectedStudent.name} bir nechta mavzuda qiynalmoqda (o'rtacha {selectedStudent.avg}%). Alohida dars o'tkazish yoki qo'shimcha materiallar yuborish tavsiya etiladi.
                    </p>
                  </div>
                )}
              </div>
              <div className="p-5 border-t border-white/10">
                <button className="w-full py-3 rounded-xl bg-[#1B4FD8]/20 border border-[#1B4FD8]/30 text-[#6B8FFF] font-bold flex items-center justify-center gap-2 hover:bg-[#1B4FD8]/30 transition">
                  <MessageSquare size={16} /> Telegram orqali xabar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
