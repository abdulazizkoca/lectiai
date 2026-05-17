"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CameraBlock } from "@/components/professor/CameraBlock";
import { PhonePermissionToggle } from "@/components/professor/PhonePermissionToggle";
import { SessionQRWidget } from "@/components/shared/SessionQRWidget";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FileText, Plus, Play, Users, BookOpen, BarChart2, ArrowRight, Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

const dict = {
  uz: {
    panelTitle: "PROFESSOR PANELI",
    panelSubtitle: "Bugungi dars va talabalar holati",
    confirmEnd: "Rostdan ham darsni yakunlamoqchimisiz?",
    endSession: "Darsni Yakunlash",
    startSession: "Dars Boshlash",
    camTracking: "Kamera kuzatuvi",
    quickActions: "Tezkor amallar",
    startPolling: "Polling boshlash",
    takeBreak: "Tanaffus",
    liveLesson: "Jonli Dars",
    codeLabel: "Kod:",
    attentionText: "Diqqat: {att}% — {status}",
    statusGood: "Yaxshi",
    statusMedium: "O'rta",
    statusPoor: "Past",
    aiRecTitle: "✨ AI Tavsiya",
    aiRecDesc: "O'quvchilarning 30% chalg'imoqda. Kichik \"Quiz\" o'tkazish yoki mavzuni hayotiy misol bilan tushuntirish tavsiya etiladi.",
    prepTitle: "Dars Tayyorlash",
    newLesson: "Yangi Dars Yaratish",
    newLessonDesc: "AI yordamida slaydlar, testlar va materiallar generatsiyasi",
    materials: "Materiallar",
    materialsDesc: "Yuklangan metodichkalar va PDF hujjatlar bazasi",
    stats: "Statistika",
    statsDesc: "O'tgan darslar analitikasi va talabalar faolligi",
    actionStart: "Boshlash",
    actionView: "Ko'rish",
    actionAnalytics: "Analitika",
    recentLessons: "So'nggi tayyorlangan darslar",
    kvantPhysics: "Kvant fizikasi asoslari",
    dataStructures: "Ma'lumotlar tuzilmasi: Daraxtlar",
    today: "Bugun",
    yesterday: "Kecha",
    hours: "soat",
    pollingToastTitle: "Polling boshlash",
    pollingToastDesc: "Real vaqtda so'rovnoma tez orada mavjud bo'ladi",
    wowToastTitle: "WOW Fakt",
    wowToastDesc: "Talabalar ekraniga qiziqarli fakt yuborilmoqda...",
    breakToastTitle: "Tanaffus",
    breakToastDesc: "Talabalar 5 daqiqa tanaffus olishadi"
  },
  ru: {
    panelTitle: "ПАНЕЛЬ ПРОФЕССОРА",
    panelSubtitle: "Сегодняшний урок и состояние студентов",
    confirmEnd: "Вы действительно хотите завершить урок?",
    endSession: "Завершить урок",
    startSession: "Начать урок",
    camTracking: "Камера наблюдения",
    quickActions: "Быстрые действия",
    startPolling: "Начать опрос",
    takeBreak: "Перерыв",
    liveLesson: "Живой Урок",
    codeLabel: "Код:",
    attentionText: "Внимание: {att}% — {status}",
    statusGood: "Хорошо",
    statusMedium: "Средне",
    statusPoor: "Низко",
    aiRecTitle: "✨ Рекомендация AI",
    aiRecDesc: "30% студентов отвлекаются. Рекомендуется провести мини-опрос (Quiz) или объяснить тему на жизненном примере.",
    prepTitle: "Подготовка к уроку",
    newLesson: "Создать новый урок",
    newLessonDesc: "Генерация слайдов, тестов и материалов с помощью AI",
    materials: "Материалы",
    materialsDesc: "База загруженных методичек и PDF документов",
    stats: "Статистика",
    statsDesc: "Аналитика прошлых уроков и активность студентов",
    actionStart: "Начать",
    actionView: "Просмотреть",
    actionAnalytics: "Аналитика",
    recentLessons: "Последние подготовленные уроки",
    kvantPhysics: "Основы квантовой физики",
    dataStructures: "Структуры данных: Деревья",
    today: "Сегодня",
    yesterday: "Вчера",
    hours: "ч.",
    pollingToastTitle: "Начать опрос",
    pollingToastDesc: "Опросы в реальном времени появятся в ближайшее время",
    wowToastTitle: "WOW Факт",
    wowToastDesc: "Интересный факт отправляется на экраны студентов...",
    breakToastTitle: "Перерыв",
    breakToastDesc: "Студенты берут перерыв на 5 минут"
  },
  en: {
    panelTitle: "PROFESSOR PORTAL",
    panelSubtitle: "Today's lesson and student statuses",
    confirmEnd: "Are you sure you want to end the lesson?",
    endSession: "End Lesson",
    startSession: "Start Lesson",
    camTracking: "Camera Monitoring",
    quickActions: "Quick Actions",
    startPolling: "Start Polling",
    takeBreak: "Take Break",
    liveLesson: "Live Lesson",
    codeLabel: "Code:",
    attentionText: "Attention: {att}% — {status}",
    statusGood: "Good",
    statusMedium: "Medium",
    statusPoor: "Poor",
    aiRecTitle: "✨ AI Recommendation",
    aiRecDesc: "30% of students are distracted. We recommend launching a quick Quiz or using a real-world example to re-engage.",
    prepTitle: "Lesson Preparation",
    newLesson: "Create New Lesson",
    newLessonDesc: "Generate slides, quizzes and class materials using AI",
    materials: "Materials",
    materialsDesc: "Database of uploaded manuals and PDF documents",
    stats: "Statistics",
    statsDesc: "Analytics of past lessons and student engagement",
    actionStart: "Start",
    actionView: "View",
    actionAnalytics: "Analytics",
    recentLessons: "Recently Prepared Lessons",
    kvantPhysics: "Fundamentals of Quantum Physics",
    dataStructures: "Data Structures: Trees",
    today: "Today",
    yesterday: "Yesterday",
    hours: "hours",
    pollingToastTitle: "Start Polling",
    pollingToastDesc: "Real-time polling will be available shortly",
    wowToastTitle: "WOW Fact",
    wowToastDesc: "Sending an interesting fact to student screens...",
    breakToastTitle: "Break Time",
    breakToastDesc: "Students will take a 5-minute break"
  }
};

export default function ProfessorDashboardPage() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const roomCode = "LECTIO-2026";
  const sessionId = "session_123";
  const { toasts, addToast, removeToast } = useToast();
  const { language } = useLanguage();

  const langKey = (language === "uz" || language === "ru" || language === "en") ? language : "uz";
  const t = dict[langKey];

  const handleQuickAction = (action: string) => {
    const actions: Record<string, { title: string; description: string }> = {
      polling: { title: t.pollingToastTitle, description: t.pollingToastDesc },
      wow: { title: t.wowToastTitle, description: t.wowToastDesc },
      break: { title: t.breakToastTitle, description: t.breakToastDesc },
    };
    const a = actions[action];
    if (a) addToast({ title: a.title, description: a.description, type: "info" });
  };

  return (
    <div className="min-h-full bg-transparent text-white p-6 md:p-8 flex flex-col relative z-10">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-white/10">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl font-bold font-display tracking-wide uppercase">
            {t.panelTitle}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {t.panelSubtitle}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
          <Button
            variant={isSessionActive ? "ghost" : "primary"}
            onClick={() => {
              if (isSessionActive) {
                if (window.confirm(t.confirmEnd)) setIsSessionActive(false);
              } else {
                setIsSessionActive(true);
              }
            }}
            className={`w-full sm:w-auto ${isSessionActive ? "text-red-400 border border-red-500/30 hover:bg-red-500/10" : ""}`}
          >
            {isSessionActive ? t.endSession : t.startSession}
          </Button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-8 flex-1">

        {/* LEFT PANEL */}
        <div className="w-full lg:w-[600px] xl:w-[720px] 2xl:w-[820px] shrink-0 space-y-6">
          <h2 className="text-xl font-bold font-display text-gray-200">{t.camTracking}</h2>
          <CameraBlock sessionId={isSessionActive ? sessionId : null} />

          {isSessionActive && (
            <div className="p-4 bg-gray-900 rounded-xl border border-white/10 mt-4">
              <h3 className="text-sm font-bold text-gray-300 mb-2">{t.quickActions}</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="ghost" className="bg-white/5 hover:bg-white/10 text-xs" onClick={() => handleQuickAction("polling")}>{t.startPolling}</Button>
                <Button size="sm" variant="ghost" className="bg-white/5 hover:bg-white/10 text-xs" onClick={() => handleQuickAction("break")}>{t.takeBreak}</Button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 bg-gray-900/50 rounded-3xl border border-white/5 p-6 md:p-8">
          {isSessionActive ? (
            <div className="h-full flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold font-display flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  {t.liveLesson}
                </h2>
                <div className="flex items-center gap-4">
                  <PhonePermissionToggle />
                  <div className="text-sm text-gray-400">{t.codeLabel} <span className="font-mono text-white bg-white/10 px-2 py-1 rounded">{roomCode}</span></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {[
                  { name: "Jasur", status: "green", attention: 95 },
                  { name: "Sardor", status: "yellow", attention: 55 },
                  { name: "Malika", status: "red", attention: 20 },
                  { name: "Dilnoza", status: "green", attention: 88 },
                  { name: "Aziz", status: "green", attention: 92 },
                  { name: "Anvar", status: "yellow", attention: 45 },
                ].map((s, i) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    key={s.name}
                    className="p-4 rounded-xl border border-white/5 bg-black/40 flex justify-between items-center group cursor-pointer hover:bg-black/60 transition"
                    onClick={() => {
                      const statusStr = s.attention >= 70 ? t.statusGood : s.attention >= 40 ? t.statusMedium : t.statusPoor;
                      const formattedToast = t.attentionText.replace("{att}", String(s.attention)).replace("{status}", statusStr);
                      addToast({ 
                        title: s.name, 
                        description: formattedToast, 
                        type: s.attention >= 70 ? "success" : s.attention >= 40 ? "warning" : "error" 
                      });
                    }}
                  >
                    <span className="font-medium">{s.name}</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`w-2 h-2 rounded-full ${s.status === "green" ? "bg-[#0D9373]" : s.status === "yellow" ? "bg-[#F5A623]" : "bg-[#E84855]"}`} />
                      {s.attention}%
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-auto p-4 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 rounded-xl border border-indigo-500/20">
                <h4 className="font-bold text-indigo-300 mb-1 flex items-center gap-2">{t.aiRecTitle}</h4>
                <p className="text-sm text-indigo-100/80">{t.aiRecDesc}</p>
              </div>

              <SessionQRWidget roomCode={roomCode} role="professor" />
            </div>
          ) : (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold font-display">{t.prepTitle}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card variant="default" className="bg-black/40 border-white/5 hover:border-white/20 transition cursor-pointer group" onClick={() => router.push("/professor/create-lesson")}>
                  <div className="p-4 flex flex-col items-center text-center gap-4 py-8">
                    <div className="w-14 h-14 rounded-2xl bg-[#1B4FD8]/20 flex items-center justify-center text-[#1B4FD8] group-hover:scale-110 transition">
                      <Plus size={28} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{t.newLesson}</h3>
                      <p className="text-sm text-gray-500 mt-1">{t.newLessonDesc}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[#1B4FD8] text-sm font-bold">
                      {t.actionStart} <ArrowRight size={14} />
                    </div>
                  </div>
                </Card>

                <Card variant="default" className="bg-black/40 border-white/5 hover:border-white/20 transition cursor-pointer group" onClick={() => router.push("/professor/materials")}>
                  <div className="p-4 flex flex-col items-center text-center gap-4 py-8">
                    <div className="w-14 h-14 rounded-2xl bg-[#0D9373]/20 flex items-center justify-center text-[#0D9373] group-hover:scale-110 transition">
                      <FileText size={28} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{t.materials}</h3>
                      <p className="text-sm text-gray-500 mt-1">{t.materialsDesc}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[#0D9373] text-sm font-bold">
                      {t.actionView} <ArrowRight size={14} />
                    </div>
                  </div>
                </Card>

                <Card variant="default" className="bg-black/40 border-white/5 hover:border-white/20 transition cursor-pointer group" onClick={() => router.push("/professor/analytics")}>
                  <div className="p-4 flex flex-col items-center text-center gap-4 py-8">
                    <div className="w-14 h-14 rounded-2xl bg-[#F5A623]/20 flex items-center justify-center text-[#F5A623] group-hover:scale-110 transition">
                      <BarChart2 size={28} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{t.stats}</h3>
                      <p className="text-sm text-gray-500 mt-1">{t.statsDesc}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[#F5A623] text-sm font-bold">
                      {t.actionAnalytics} <ArrowRight size={14} />
                    </div>
                  </div>
                </Card>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-4 border-b border-white/10 pb-2">{t.recentLessons}</h3>
                <div className="space-y-3">
                  {[
                    { title: t.kvantPhysics, date: `${t.today}, 10:00`, duration: `1.5 ${t.hours}`, id: "lesson-1" },
                    { title: t.dataStructures, date: `${t.yesterday}, 14:30`, duration: `1 ${t.hours}`, id: "lesson-2" },
                  ].map((lesson, i) => (
                    <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 rounded-xl bg-black/20 border border-white/5 hover:bg-black/40 transition">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-gray-800 rounded-lg"><BookOpen size={20} className="text-gray-400" /></div>
                        <div>
                          <p className="font-bold">{lesson.title}</p>
                          <p className="text-xs text-gray-500">{lesson.date} • {lesson.duration}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-white"
                        leftIcon={<Play size={14} />}
                        onClick={() => setIsSessionActive(true)}
                      >
                        {t.actionStart}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
