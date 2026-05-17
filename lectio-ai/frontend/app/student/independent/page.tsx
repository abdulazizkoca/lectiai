"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Search, Upload, BookOpen, Brain, FileText, Trophy,
  MessageCircle, Star, Clock, TrendingUp, ChevronRight,
  Sparkles, ArrowLeft, BarChart3, Flame, Target
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/contexts/ToastContext";
import { useTheme } from "@/contexts/ThemeContext";

const SUBJECTS = [
  { id: "math", name: "Matematika", icon: "📐", color: "#1B4FD8", bg: "rgba(27,79,216,0.12)", description: "Algebra, geometriya, hisob", topics: 42 },
  { id: "physics", name: "Fizika", icon: "⚛️", color: "#8B5CF6", bg: "rgba(139,92,246,0.12)", description: "Mexanika, termodinamika, kvant", topics: 38 },
  { id: "chemistry", name: "Kimyo", icon: "🧪", color: "#0D9373", bg: "rgba(13,147,115,0.12)", description: "Organik, noorganik, biokimyo", topics: 31 },
  { id: "history", name: "Tarix", icon: "📚", color: "#F5A623", bg: "rgba(245,166,35,0.12)", description: "Jahon tarixi, O'zbekiston", topics: 55 },
  { id: "biology", name: "Biologiya", icon: "🧬", color: "#10B981", bg: "rgba(16,185,129,0.12)", description: "Genetika, ekologiya, anatomiya", topics: 29 },
  { id: "languages", name: "Tillar", icon: "🌍", color: "#E84855", bg: "rgba(232,72,85,0.12)", description: "Ingliz, rus, arab tillari", topics: 67 },
  { id: "programming", name: "Dasturlash", icon: "💻", color: "#6366F1", bg: "rgba(99,102,241,0.12)", description: "Python, JavaScript, algoritmlar", topics: 44 },
  { id: "literature", name: "Adabiyot", icon: "📖", color: "#EC4899", bg: "rgba(236,72,153,0.12)", description: "O'zbek, jahon adabiyoti", topics: 23 },
  { id: "geography", name: "Geografiya", icon: "🌏", color: "#06B6D4", bg: "rgba(6,182,212,0.12)", description: "Jismoniy, iqtisodiy geografiya", topics: 19 },
  { id: "economics", name: "Iqtisodiyot", icon: "💰", color: "#F59E0B", bg: "rgba(245,158,11,0.12)", description: "Mikro, makroiqtisodiyot", topics: 27 },
];

const RECENT_TOPICS = [
  { id: 1, title: "React Hooks", subject: "Dasturlash", subjectId: "programming", progress: 75, lastStudied: "2 kun oldin", difficulty: "O'rtacha", quizScore: 82 },
  { id: 2, title: "Diferensial tenglamalar", subject: "Matematika", subjectId: "math", progress: 45, lastStudied: "1 hafta oldin", difficulty: "Qiyin", quizScore: 61 },
  { id: 3, title: "Organik kimyo asoslari", subject: "Kimyo", subjectId: "chemistry", progress: 90, lastStudied: "Kecha", difficulty: "Oson", quizScore: 94 },
  { id: 4, title: "Jahon urushi tarixi", subject: "Tarix", subjectId: "history", progress: 60, lastStudied: "3 kun oldin", difficulty: "O'rtacha", quizScore: 73 },
];

const AI_RECOMMENDATIONS = [
  { title: "React Hooksni takrorlang", reason: "Uzoq vaqt o'rganilmagan", subjectId: "programming", topic: "React Hooks", icon: "🔄", urgency: "high" },
  { title: "Limit va hosilalar", reason: "Diferensial tenglamalar uchun asos", subjectId: "math", topic: "Limit va hosilalar", icon: "📈", urgency: "medium" },
  { title: "Kvant mexanikasi", reason: "Fizikadagi yangi mavzu siz uchun", subjectId: "physics", topic: "Kvant mexanikasi", icon: "✨", urgency: "low" },
];

const STATS = [
  { label: "Jami o'qilgan", value: "24 soat", icon: Clock, color: "#F5A623" },
  { label: "Mavzular", value: "18 ta", icon: BookOpen, color: "#1B4FD8" },
  { label: "O'rtacha ball", value: "87%", icon: Target, color: "#0D9373" },
  { label: "Streak", value: "7 kun", icon: Flame, color: "#E84855" },
];

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
  
  const bg = isDark ? "#0A0A0F" : "#F8FAFC";
  const fg = isDark ? "#fff" : "#0A0A0F";
  const surface = isDark ? "rgba(255,255,255,0.04)" : "#fff";
  const surfaceBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
  const fgMuted = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)";

  const filteredSubjects = SUBJECTS.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubjectSelect = (subject: typeof SUBJECTS[0]) => {
    info("Mavzu tanlandi", `${subject.name} bo'yicha o'qish rejimi ochilmoqda...`);
    router.push(`/student/independent/learn?subject=${subject.id}&subjectName=${encodeURIComponent(subject.name)}&mode=tutor`);
  };

  const handleCustomTopicSubmit = () => {
    if (customTopic.trim()) {
      success("Mavzu tanlandi", `${customTopic.trim()} bo'yicha o'qish boshlanadi`);
      router.push(`/student/independent/learn?topic=${encodeURIComponent(customTopic.trim())}&mode=tutor`);
    } else {
      error("Xatolik", "Iltimos, mavzu nomini kiriting");
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"].includes(file.type)) {
      error("Noto'g'ri fayl turi", "Faqat PDF, Word yoki matn fayllarini yuklash mumkin");
      return;
    }
    setUploadedFile(file);
    setIsUploading(true);
    setTimeout(() => {
      success("Fayl yuklandi", `${file.name} muvaffaqiyatli yuklandi va tahlil qilindi`);
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
    if (d === "Oson") return "jade";
    if (d === "O'rtacha") return "saffron";
    if (d === "Qiyin") return "coral";
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
              <h1 className="text-lg font-bold" style={{ color: fg }}>Mustaqil o'qish</h1>
              <p className="text-xs" style={{ color: fgMuted }}>Istalgan mavzuni istalgan vaqtda o'rganing</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold" style={{ background: "rgba(232,72,85,0.15)", color: "#E84855" }}>
              <Flame size={14} />
              <span className="hidden sm:inline">7 kun streak</span>
              <span className="sm:hidden">7</span>
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
                  placeholder="Fan yoki mavzu qidirish..."
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
                Fanlarni tanlang
                <span className="text-sm font-normal ml-1" style={{ color: fgMuted }}>({filteredSubjects.length} ta fan)</span>
              </h2>
              <AnimatePresence>
                {filteredSubjects.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12 text-slate-400"
                  >
                    <Search size={40} className="mx-auto mb-3 opacity-30" />
                    <p>"{searchTerm}" bo'yicha fan topilmadi</p>
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
                          <span className="text-xs" style={{ color: fgMuted }}>{subject.topics} mavzu</span>
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
                O'z mavzungizni kiriting
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Masalan: Sun'iy intellekt asoslari..."
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
                  O'rganish
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
                Material yuklang
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
                    <p className="font-medium" style={{ color: fg }}>Fayl tahlil qilinmoqda...</p>
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
                    <p className="font-medium mb-1" style={{ color: fg }}>Faylni bu yerga tashlang yoki bosing</p>
                    <p className="text-sm" style={{ color: fgMuted }}>PDF, Word (.doc/.docx) yoki matn (.txt) • Maks 50MB</p>
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
                AI tavsiyalari
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
                So'nggi mavzular
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
                Haftalik faollik
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
                      {["D", "S", "Ch", "P", "J", "Sh", "Ya"][i]}
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
