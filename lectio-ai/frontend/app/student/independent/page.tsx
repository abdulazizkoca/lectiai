"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Search, Upload, BookOpen, Brain, FileText, Trophy,
  MessageCircle, Star, Clock, TrendingUp, ChevronRight,
  Sparkles, ArrowLeft, BarChart3, Flame, Target, Sun, Moon
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/contexts/ToastContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function IndependentStudyPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error, info } = useToast();
  const { isDark } = useTheme();
  const { t, language } = useLanguage();
  
  const bg = isDark ? "#0A0A0F" : "#F8FAFC";
  const fg = isDark ? "#fff" : "#0A0A0F";
  const surface = isDark ? "rgba(255,255,255,0.04)" : "#fff";
  const surfaceBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
  const fgMuted = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)";

  const weekdaysMap = {
    uz: ["D", "S", "Ch", "P", "J", "Sh", "Ya"],
    ru: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
    en: ["M", "T", "W", "T", "F", "S", "S"],
  };
  const weekdays = weekdaysMap[language] || weekdaysMap.uz;

  const SUBJECTS = [
    { id: "math", name: t("subject.math"), icon: "📐", color: "#1B4FD8", bg: "rgba(27,79,216,0.12)", description: t("subject.math.desc"), topics: 42 },
    { id: "physics", name: t("subject.physics"), icon: "⚛️", color: "#8B5CF6", bg: "rgba(139,92,246,0.12)", description: t("subject.physics.desc"), topics: 38 },
    { id: "chemistry", name: t("subject.chemistry"), icon: "🧪", color: "#0D9373", bg: "rgba(13,147,115,0.12)", description: t("subject.chemistry.desc"), topics: 31 },
    { id: "history", name: t("subject.history"), icon: "📚", color: "#F5A623", bg: "rgba(245,166,35,0.12)", description: t("subject.history.desc"), topics: 55 },
    { id: "biology", name: t("subject.biology"), icon: "🧬", color: "#10B981", bg: "rgba(16,185,129,0.12)", description: t("subject.biology.desc"), topics: 29 },
    { id: "languages", name: t("subject.languages"), icon: "🌍", color: "#E84855", bg: "rgba(232,72,85,0.12)", description: t("subject.languages.desc"), topics: 67 },
    { id: "programming", name: t("subject.programming"), icon: "💻", color: "#6366F1", bg: "rgba(99,102,241,0.12)", description: t("subject.programming.desc"), topics: 44 },
    { id: "literature", name: t("subject.literature"), icon: "📖", color: "#EC4899", bg: "rgba(236,72,153,0.12)", description: t("subject.literature.desc"), topics: 23 },
    { id: "geography", name: t("subject.geography"), icon: "🌏", color: "#06B6D4", bg: "rgba(6,182,212,0.12)", description: t("subject.geography.desc"), topics: 19 },
    { id: "economics", name: t("subject.economics"), icon: "💰", color: "#F59E0B", bg: "rgba(245,158,11,0.12)", description: t("subject.economics.desc"), topics: 27 },
  ];

  const RECENT_TOPICS = [
    { id: 1, title: "React Hooks", subject: t("subject.programming"), subjectId: "programming", progress: 75, lastStudied: t("students.mock.3d_ago"), difficulty: t("students.perf_average"), quizScore: 82 },
    { id: 2, title: "Diferensial tenglamalar", subject: t("subject.math"), subjectId: "math", progress: 45, lastStudied: t("students.mock.1d_ago"), difficulty: t("students.perf_excellent"), quizScore: 61 },
    { id: 3, title: "Organik kimyo asoslari", subject: t("subject.chemistry"), subjectId: "chemistry", progress: 90, lastStudied: t("students.mock.2h_ago"), difficulty: t("students.perf_good"), quizScore: 94 },
    { id: 4, title: "Jahon urushi tarixi", subject: t("subject.history"), subjectId: "history", progress: 60, lastStudied: t("students.mock.30m_ago"), difficulty: t("students.perf_average"), quizScore: 73 },
  ];

  const AI_RECOMMENDATIONS = [
    { title: "React Hooksni takrorlang", reason: "Uzoq vaqt o'rganilmagan", subjectId: "programming", topic: "React Hooks", icon: "🔄", urgency: "high" },
    { title: "Limit va hosilalar", reason: "Diferensial tenglamalar uchun asos", subjectId: "math", topic: "Limit va hosilalar", icon: "📈", urgency: "medium" },
    { title: "Kvant mexanikasi", reason: "Fizikadagi yangi mavzu siz uchun", subjectId: "physics", topic: "Kvant mexanikasi", icon: "✨", urgency: "low" },
  ];

  const STATS = [
    { label: t("student.indep.stat_total_time"), value: t("student.indep.stat_total_time_val"), icon: Clock, color: "#F5A623" },
    { label: t("student.indep.stat_topics"), value: t("student.indep.stat_topics_val"), icon: BookOpen, color: "#1B4FD8" },
    { label: t("student.indep.stat_avg_score"), value: "87%", icon: Target, color: "#0D9373" },
    { label: t("student.indep.stat_streak"), value: t("student.indep.stat_streak_val"), icon: Flame, color: "#E84855" },
  ];

  const filteredSubjects = SUBJECTS.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubjectSelect = (subject: typeof SUBJECTS[0]) => {
    info(t("student.indep.toast_subject_sel"), t("student.indep.toast_subject_desc").replace("{name}", subject.name));
    router.push(`/student/independent/learn?subject=${subject.id}&subjectName=${encodeURIComponent(subject.name)}&mode=tutor`);
  };

  const handleCustomTopicSubmit = () => {
    if (customTopic.trim()) {
      success(t("student.indep.toast_subject_sel"), t("student.indep.toast_custom_desc").replace("{name}", customTopic.trim()));
      router.push(`/student/independent/learn?topic=${encodeURIComponent(customTopic.trim())}&mode=tutor`);
    } else {
      error(t("student.indep.toast_err"), t("student.indep.toast_err_desc"));
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"].includes(file.type)) {
      error(t("student.indep.toast_err_file"), t("student.indep.toast_err_file_desc"));
      return;
    }
    setUploadedFile(file);
    setIsUploading(true);
    setTimeout(() => {
      success(t("student.indep.toast_file_ok"), t("student.indep.toast_file_desc").replace("{name}", file.name));
      setIsUploading(false);
      router.push(`/student/independent/learn?file=${encodeURIComponent(file.name)}&mode=tutor`);
    }, 2200);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleRecentTopicClick = (topic: typeof RECENT_TOPICS[0]) => {
    router.push(`/student/independent/learn?topic=${encodeURIComponent(topic.title)}&subjectId=${topic.subjectId}&mode=tutor`);
  };

  const handleRecommendationClick = (rec: typeof AI_RECOMMENDATIONS[0]) => {
    router.push(`/student/independent/learn?topic=${encodeURIComponent(rec.topic)}&subjectId=${rec.subjectId}&mode=tutor`);
  };

  const getDifficultyColor = (d: string): "jade" | "saffron" | "coral" | "gray" => {
    if (d === t("students.perf_excellent")) return "jade";
    if (d === t("students.perf_average")) return "saffron";
    if (d === t("students.perf_good")) return "coral";
    return "gray";
  };

  return (
    <div className="min-h-screen" style={{ background: bg, color: fg }}>
      {/* Header */}
      <div className="sticky top-0 z-40 border-b" style={{ background: isDark ? "rgba(10,10,15,0.85)" : "rgba(248,250,252,0.85)", backdropFilter: "blur(20px)", borderColor: surfaceBorder }}>
        <div className="w-full px-4 md:px-8 py-4 flex items-center justify-between gap-2 md:gap-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,166,35,0.2)" }}>
              <BookOpen size={18} style={{ color: "#F5A623" }} />
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: fg }}>{t("student.indep.title")}</h1>
              <p className="text-xs" style={{ color: fgMuted }}>{t("student.indep.subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold mr-2" style={{ background: "rgba(232,72,85,0.15)", color: "#E84855" }}>
              <Flame size={14} />
              <span className="hidden sm:inline">{t("student.indep.streak").replace("{days}", "7")}</span>
              <span className="sm:hidden">7</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-lg p-1" style={{ background: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.04)", border: `1px solid ${surfaceBorder}` }}>
                <button onClick={() => setLanguage("uz")} className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${language === 'uz' ? 'bg-[#F5A623] text-black shadow-sm' : 'text-slate-500 hover:text-black dark:hover:text-white'}`}>UZ</button>
                <button onClick={() => setLanguage("ru")} className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${language === 'ru' ? 'bg-[#F5A623] text-black shadow-sm' : 'text-slate-500 hover:text-black dark:hover:text-white'}`}>RU</button>
                <button onClick={() => setLanguage("en")} className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${language === 'en' ? 'bg-[#F5A623] text-black shadow-sm' : 'text-slate-500 hover:text-black dark:hover:text-white'}`}>EN</button>
              </div>
              <button onClick={toggleTheme} className="w-9 h-9 rounded-lg flex items-center justify-center transition-all" aria-label="Mavzuni o'zgartirish" style={{ background: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.04)", color: "#F5A623", border: `1px solid ${surfaceBorder}` }}>
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 md:px-8 py-6 md:py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {STATS.map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-4 border"
              style={{ background: surface, borderColor: surfaceBorder }}
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon size={16} style={{ color: stat.color }} />
                <span className="text-xs" style={{ color: fgMuted }}>{stat.label}</span>
              </div>
              <div className="text-xl md:text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">

            {/* Search */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder={t("student.indep.search_placeholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border focus:outline-none focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/20 transition-all text-lg"
                  style={{ backdropFilter: "blur(12px)", background: surface, borderColor: surfaceBorder, color: fg }}
                />
              </div>
            </motion.div>

            {/* Subjects Grid */}
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: fg }}>
                <BookOpen size={20} style={{ color: "#F5A623" }} />
                {t("student.indep.subjects_title")}
                <span className="text-sm font-normal ml-1" style={{ color: fgMuted }}>{t("student.indep.subjects_count").replace("{count}", filteredSubjects.length.toString())}</span>
              </h2>
              <AnimatePresence>
                {filteredSubjects.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12 text-slate-400"
                  >
                    <Search size={40} className="mx-auto mb-3 opacity-30" />
                    <p>{t("student.indep.subjects_not_found").replace("{term}", searchTerm)}</p>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSubjects.map((subject, i) => (
                      <motion.button
                        key={subject.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        whileHover={{ scale: 1.03, y: -4 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleSubjectSelect(subject)}
                        className="text-left rounded-2xl p-5 border transition-all group"
                        style={{ background: isDark ? subject.bg : "rgba(255,255,255,0.8)", borderColor: surfaceBorder }}
                      >
                        <div className="text-3xl mb-3">{subject.icon}</div>
                        <h3 className="font-bold text-base mb-1" style={{ color: subject.color }}>{subject.name}</h3>
                        <p className="text-xs mb-3" style={{ color: fgMuted }}>{subject.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs" style={{ color: fgMuted }}>{t("student.indep.topics_count").replace("{count}", subject.topics.toString())}</span>
                          <ChevronRight size={14} className="group-hover:translate-x-1 transition-all" style={{ color: fgMuted }} />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Custom Topic */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl p-6 border"
              style={{ background: isDark ? "rgba(27,79,216,0.08)" : "rgba(27,79,216,0.04)", borderColor: surfaceBorder }}
            >
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: fg }}>
                <Brain size={20} style={{ color: "#1B4FD8" }} />
                {t("student.indep.custom_topic_title")}
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder={t("student.indep.custom_topic_placeholder")}
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCustomTopicSubmit()}
                  className="flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all"
                  style={{ background: surface, borderColor: surfaceBorder, color: fg }}
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCustomTopicSubmit}
                  disabled={!customTopic.trim()}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg,#1B4FD8,#3B82F6)", color: "white" }}
                >
                  <MessageCircle size={18} />
                  {t("student.indep.learn_btn")}
                </motion.button>
              </div>
            </motion.div>

            {/* File Upload */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl p-6 border"
              style={{ background: isDark ? "rgba(13,147,115,0.08)" : "rgba(13,147,115,0.04)", borderColor: surfaceBorder }}
            >
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Upload size={20} style={{ color: "#0D9373" }} />
                {t("student.indep.upload_title")}
              </h3>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-6 md:p-8 text-center cursor-pointer transition-all ${isDragOver ? "border-green-400 bg-green-400/10" : "border-white/20 hover:border-green-400/50 hover:bg-green-400/5"}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-upload"
                />
                {isUploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Spinner size="lg" />
                    <p className="font-medium" style={{ color: fg }}>{t("student.indep.upload_analyzing")}</p>
                    <p className="text-sm" style={{ color: fgMuted }}>{uploadedFile?.name}</p>
                  </div>
                ) : uploadedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText size={24} style={{ color: "#0D9373" }} />
                    <span className="font-medium" style={{ color: fg }}>{uploadedFile.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload size={40} className="mx-auto mb-3" style={{ color: fgMuted }} />
                    <p className="font-medium mb-1" style={{ color: fg }}>{t("student.indep.upload_drag")}</p>
                    <p className="text-sm" style={{ color: fgMuted }}>{t("student.indep.upload_formats")}</p>
                  </>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Recommendations */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl p-5 border"
              style={{ background: isDark ? "rgba(245,166,35,0.06)" : "rgba(245,166,35,0.03)", borderColor: surfaceBorder }}
            >
              <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: fg }}>
                <Sparkles size={16} style={{ color: "#F5A623" }} />
                {t("student.indep.ai_recs_title")}
              </h3>
              <div className="space-y-3">
                {AI_RECOMMENDATIONS.map((rec, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRecommendationClick(rec)}
                    className="w-full text-left rounded-xl p-3 border hover:border-yellow-400/30 transition-all group"
                    style={{ background: surface, borderColor: surfaceBorder }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{rec.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" style={{ color: fg }}>{rec.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: fgMuted }}>{rec.reason}</p>
                      </div>
                      <ChevronRight size={14} className="group-hover:text-yellow-400 group-hover:translate-x-1 transition-all mt-1 flex-shrink-0" style={{ color: fgMuted }} />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Recent Topics */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl p-5 border"
              style={{ background: surface, borderColor: surfaceBorder }}
            >
              <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: fg }}>
                <Clock size={16} style={{ color: "#1B4FD8" }} />
                {t("student.indep.recent_topics_title")}
              </h3>
              <div className="space-y-3">
                {RECENT_TOPICS.map((topic) => (
                  <motion.button
                    key={topic.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRecentTopicClick(topic)}
                    className="w-full text-left rounded-xl p-3 border transition-all"
                    style={{ background: surface, borderColor: surfaceBorder }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-sm" style={{ color: fg }}>{topic.title}</p>
                      <Badge color={getDifficultyColor(topic.difficulty)} size="sm">{topic.difficulty}</Badge>
                    </div>
                    <p className="text-xs mb-2" style={{ color: fgMuted }}>{topic.subject} · {topic.lastStudied}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: surfaceBorder }}>
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{ width: `${topic.progress}%`, background: "linear-gradient(90deg,#F5A623,#0D9373)" }}
                        />
                      </div>
                      <span className="text-xs font-bold" style={{ color: "#F5A623" }}>{topic.progress}%</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Progress Overview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl p-5 border"
              style={{ background: surface, borderColor: surfaceBorder }}
            >
              <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: fg }}>
                <BarChart3 size={16} style={{ color: "#0D9373" }} />
                {t("student.indep.weekly_activity_title")}
              </h3>
              <div className="flex items-end gap-1.5 h-20">
                {[40, 70, 55, 90, 65, 80, 45].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-sm transition-all"
                      style={{
                        height: `${h}%`,
                        background: i === 6 ? "rgba(245,166,35,0.3)" : "linear-gradient(to top,#0D9373,#1B4FD8)",
                        opacity: i === 6 ? 0.5 : 1
                      }}
                    />
                    <span className="text-xs text-slate-600">
                      {weekdays[i]}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
