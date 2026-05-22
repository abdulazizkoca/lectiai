"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CameraBlock } from "@/components/professor/CameraBlock";
import { PhonePermissionToggle } from "@/components/professor/PhonePermissionToggle";
import { SessionQRWidget } from "@/components/shared/SessionQRWidget";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FileText, Plus, Play, BookOpen, BarChart2, ArrowRight, Loader2, ShieldAlert, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { authAPI, lessonsAPI, sessionsAPI } from "@/lib/api";

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
    aiRecDesc: "O'quvchilarning bir qismi chalg'imoqda. Kichik \"Quiz\" o'tkazish yoki mavzuni hayotiy misol bilan tushuntirish tavsiya etiladi.",
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
    breakToastDesc: "Talabalar 5 daqiqa tanaffus olishadi",
    noLessons: "Hozircha darslar mavjud emas. Yangi dars yaratishingiz mumkin."
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
    aiRecDesc: "Некоторые студенты отвлекаются. Рекомендуется провести мини-опрос (Quiz) или объяснить тему на жизненном примере.",
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
    breakToastDesc: "Студенты берут перерыв на 5 минут",
    noLessons: "У вас пока нет уроков. Вы можете создать новый урок."
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
    aiRecDesc: "Some students are distracted. We recommend launching a quick Quiz or using a real-world example to re-engage.",
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
    breakToastDesc: "Students will take a 5-minute break",
    noLessons: "No lessons available yet. You can create a new lesson."
  }
};

export default function ProfessorDashboardPage() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [roomCode, setRoomCode] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();
  const { language } = useLanguage();

  const langKey = (language === "uz" || language === "ru" || language === "en") ? language : "uz";
  const t = dict[langKey];

  // Check auth token and proceed, otherwise prompt to connect account
  const checkAuthAndExecute = (action: () => void) => {
    const token = localStorage.getItem("lectio_token");
    if (!token || token.startsWith("mock_")) {
      setShowConnectModal(true);
    } else {
      action();
    }
  };

  // 1. Fetch profile, lessons and restore active session on mount (No automatic redirect!)
  useEffect(() => {
    const token = localStorage.getItem("lectio_token");
    
    const loadDashboardData = async () => {
      if (!token || token.startsWith("mock_")) {
        // Guest/preview mode: skip API requests and keep simulated state
        setLoading(false);
        return;
      }

      try {
        const me = await authAPI.getMe(token);
        setUser(me);

        // Fetch professor's lessons
        try {
          const fetchedLessons = await lessonsAPI.getByProfessor(me.id, token);
          setLessons(fetchedLessons || []);
        } catch (lessonErr) {
          console.error("Error loading professor lessons:", lessonErr);
        }

        // Restore active session if stored in localStorage
        const storedSession = localStorage.getItem("lectio_active_session");
        if (storedSession) {
          const parsed = JSON.parse(storedSession);
          try {
            const status = await sessionsAPI.get(parsed.roomCode);
            if (status && status.status !== "ended") {
              setRoomCode(parsed.roomCode);
              setSessionId(parsed.sessionId);
              setLessonTitle(parsed.lessonTitle);
              setIsSessionActive(true);
            } else {
              localStorage.removeItem("lectio_active_session");
            }
          } catch (e) {
            // Keep stored session in offline mode
            setRoomCode(parsed.roomCode);
            setSessionId(parsed.sessionId);
            setLessonTitle(parsed.lessonTitle);
            setIsSessionActive(true);
          }
        }
      } catch (err) {
        console.error("Dashboard mount authentication check failed:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [router]);

  // 2. Poll session participants in real-time when session is active
  useEffect(() => {
    if (!isSessionActive || !roomCode) return;

    let intervalId: any;

    const fetchSessionState = async () => {
      try {
        const res = await sessionsAPI.get(roomCode);
        if (res && res.participants) {
          const mapped = res.participants.map((p: any) => {
            const randomAttention = Math.floor(45 + Math.random() * 55);
            const status = randomAttention >= 70 ? "green" : randomAttention >= 40 ? "yellow" : "red";
            return {
              name: p.nickname,
              attention: randomAttention,
              status: status,
              score: p.score
            };
          });
          setParticipants(mapped);
        }
      } catch (err) {
        console.error("Error fetching live session participants:", err);
      }
    };

    fetchSessionState();
    intervalId = setInterval(fetchSessionState, 3000);

    return () => clearInterval(intervalId);
  }, [isSessionActive, roomCode]);

  // 3. Handle live session startup
  const handleStartSession = async (lessonId: number, title: string) => {
    const token = localStorage.getItem("lectio_token");
    if (!token || token.startsWith("mock_")) {
      setShowConnectModal(true);
      return;
    }

    try {
      addToast({ title: "Sessiya", description: "Yangi jonli dars tayyorlanmoqda...", type: "info" });
      const res = await sessionsAPI.create(lessonId, token);
      
      if (res.success) {
        await sessionsAPI.start(res.session_id, token);

        setRoomCode(res.room_code);
        setSessionId(String(res.session_id));
        setLessonTitle(res.lesson_title || title);
        setIsSessionActive(true);

        localStorage.setItem("lectio_active_session", JSON.stringify({
          roomCode: res.room_code,
          sessionId: String(res.session_id),
          lessonId,
          lessonTitle: res.lesson_title || title
        }));

        addToast({ title: "Dars Boshlandi", description: `Talabalar ulanishi mumkin. Kod: ${res.room_code}`, type: "success" });
      }
    } catch (err: any) {
      console.error("Backend session start error, falling back to simulated session:", err);
      
      const mockCode = `LECTIO-${Math.floor(1000 + Math.random() * 9000)}`;
      const mockSessionId = `mock_${Date.now()}`;
      setRoomCode(mockCode);
      setSessionId(mockSessionId);
      setLessonTitle(title);
      setIsSessionActive(true);

      localStorage.setItem("lectio_active_session", JSON.stringify({
        roomCode: mockCode,
        sessionId: mockSessionId,
        lessonId,
        lessonTitle: title
      }));

      addToast({
        title: "Offline Sessiya",
        description: `Backend xatoligi sababli offline rejimda dars boshlandi. Kod: ${mockCode}`,
        type: "warning"
      });
    }
  };

  // 4. Handle live session ending
  const handleEndSession = async () => {
    const token = localStorage.getItem("lectio_token");
    const active = localStorage.getItem("lectio_active_session");

    if (active) {
      const parsed = JSON.parse(active);
      if (token && parsed.sessionId && !parsed.sessionId.startsWith("mock_")) {
        try {
          await sessionsAPI.end(Number(parsed.sessionId), token);
        } catch (err) {
          console.error("Failed to end session on backend:", err);
        }
      }
    }

    setIsSessionActive(false);
    setRoomCode("");
    setSessionId("");
    setLessonTitle("");
    setParticipants([]);
    localStorage.removeItem("lectio_active_session");

    addToast({ title: "Yakunlandi", description: "Dars sessiyasi muvaffaqiyatli yakunlandi", type: "success" });
  };

  const handleQuickAction = (action: string) => {
    const actions: Record<string, { title: string; description: string }> = {
      polling: { title: t.pollingToastTitle, description: t.pollingToastDesc },
      wow: { title: t.wowToastTitle, description: t.wowToastDesc },
      break: { title: t.breakToastTitle, description: t.breakToastDesc },
    };
    const a = actions[action];
    if (a) addToast({ title: a.title, description: a.description, type: "info" });
  };

  // Render Loader screen during initial mount validation
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center text-white relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full opacity-[0.05] blur-[80px]" style={{ background: "#F5A623" }} />
          <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 rounded-full opacity-[0.03] blur-[80px]" style={{ background: "#1B4FD8" }} />
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 relative z-10"
        >
          <Loader2 className="w-12 h-12 text-[#F5A623] animate-spin" />
          <p className="text-slate-400 text-sm tracking-wide uppercase font-semibold">Tizim yuklanmoqda...</p>
        </motion.div>
      </div>
    );
  }

  // Map real database lessons into view model list
  const displayLessons = lessons.length > 0 ? lessons.map((l: any) => ({
    id: l.id,
    title: l.title,
    date: l.created_at ? new Date(l.created_at).toLocaleDateString() : `${t.today}`,
    duration: `1.5 ${t.hours}`
  })) : [
    { id: 1, title: t.kvantPhysics, date: `${t.today}, 10:00`, duration: `1.5 ${t.hours}` },
    { id: 2, title: t.dataStructures, date: `${t.yesterday}, 14:30`, duration: `1 ${t.hours}` }
  ];

  // Default mock participants if no active students have connected yet
  const displayParticipants = participants.length > 0 ? participants : [
    { name: "Jasur", status: "green", attention: 95 },
    { name: "Sardor", status: "yellow", attention: 55 },
    { name: "Malika", status: "red", attention: 20 },
    { name: "Dilnoza", status: "green", attention: 88 }
  ];

  return (
    <div className="min-h-full bg-transparent text-white p-4 md:p-6 xl:p-8 flex flex-col relative z-10">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-white/20">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl font-bold font-display tracking-wide uppercase">
            {t.panelTitle}
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-1">
            {isSessionActive ? `${lessonTitle} • ${t.liveLesson}` : t.panelSubtitle}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto mt-1 sm:mt-0">
          <Button
            size="sm"
            variant={isSessionActive ? "ghost" : "primary"}
            onClick={() => {
              if (isSessionActive) {
                if (window.confirm(t.confirmEnd)) handleEndSession();
              } else {
                checkAuthAndExecute(() => {
                  const firstLesson = displayLessons[0];
                  handleStartSession(firstLesson.id, firstLesson.title);
                });
              }
            }}
            className={`max-w-xs sm:max-w-none ${isSessionActive ? "text-red-400 border border-red-500/30 hover:bg-red-500/10" : ""}`}
          >
            {isSessionActive ? t.endSession : t.startSession}
          </Button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-col gap-5 xl:gap-6 flex-1">

        {/* CAMERA PANEL */}
        <section className="min-w-0 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-xl font-bold font-display text-gray-200">{t.camTracking}</h2>
            {isSessionActive && (
              <div className="grid grid-cols-2 gap-2 sm:w-auto">
                <Button size="sm" variant="ghost" className="bg-white/5 hover:bg-white/10 text-xs" onClick={() => handleQuickAction("polling")}>{t.startPolling}</Button>
                <Button size="sm" variant="ghost" className="bg-white/5 hover:bg-white/10 text-xs" onClick={() => handleQuickAction("break")}>{t.takeBreak}</Button>
              </div>
            )}
          </div>
          <CameraBlock sessionId={isSessionActive ? sessionId : null} />
        </section>

        {/* CONTENT PANEL */}
        <section className="min-w-0 bg-gray-900/50 rounded-2xl border border-white/15 p-4 md:p-6 xl:p-7">
          {isSessionActive ? (
            <div className="flex flex-col">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4 mb-6">
                {displayParticipants.map((s, i) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    key={`${s.name}-${i}`}
                    className="p-4 rounded-xl border border-white/15 bg-black/40 flex justify-between items-center group cursor-pointer hover:bg-black/60 transition"
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

              <div className="mt-auto p-4 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 rounded-xl border border-indigo-500/20 mb-6">
                <h4 className="font-bold text-indigo-300 mb-1 flex items-center gap-2">{t.aiRecTitle}</h4>
                <p className="text-sm text-indigo-100/80">{t.aiRecDesc}</p>
              </div>

              <SessionQRWidget roomCode={roomCode} role="professor" />
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold font-display">{t.prepTitle}</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4">
                <Card 
                  variant="default" 
                  className="bg-black/40 border-white/15 hover:border-white/25 transition cursor-pointer group" 
                  onClick={() => checkAuthAndExecute(() => router.push("/professor/create-lesson"))}
                >
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

                <Card 
                  variant="default" 
                  className="bg-black/40 border-white/15 hover:border-white/25 transition cursor-pointer group" 
                  onClick={() => checkAuthAndExecute(() => router.push("/professor/materials"))}
                >
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

                <Card 
                  variant="default" 
                  className="bg-black/40 border-white/15 hover:border-white/25 transition cursor-pointer group" 
                  onClick={() => checkAuthAndExecute(() => router.push("/professor/analytics"))}
                >
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
                <h3 className="text-lg font-bold mb-4 border-b border-white/20 pb-2">{t.recentLessons}</h3>
                {lessons.length === 0 && (
                  <p className="text-sm text-slate-400 italic mb-4">{t.noLessons}</p>
                )}
                <div className="space-y-3">
                  {displayLessons.map((lesson, i) => (
                    <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 rounded-xl bg-black/20 border border-white/15 hover:bg-black/40 transition">
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
                        onClick={() => checkAuthAndExecute(() => handleStartSession(lesson.id, lesson.title))}
                      >
                        {t.actionStart}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Account Connection Prompt Modal */}
      <AnimatePresence>
        {showConnectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0F0F16] p-6 md:p-8 text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute -top-12 -left-12 w-28 h-28 bg-[#F5A623] rounded-full blur-[40px] opacity-[0.15]" />
              
              <div className="w-16 h-16 rounded-2xl bg-[#F5A623]/10 border border-[#F5A623]/25 flex items-center justify-center text-[#F5A623] mx-auto mb-5 shadow-lg shadow-[#F5A623]/5">
                <ShieldAlert size={32} />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">Akkaunt Ulanmagan</h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Ushbu amalni bajarish va tizim imkoniyatlaridan to&apos;liq foydalanish uchun, iltimos, avval dars xonasi akkauntingizni ulang.
              </p>

              <div className="flex flex-col gap-3">
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowConnectModal(false);
                    router.push("/login");
                  }}
                  className="w-full py-3.5 font-bold"
                >
                  Akkauntni Ulash (Kirish)
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowConnectModal(false);
                    router.push("/register");
                  }}
                  className="w-full py-3.5 border border-white/10 hover:bg-white/5 text-slate-300 font-bold"
                >
                  Ro&apos;yxatdan O&apos;tish
                </Button>
                <button
                  onClick={() => setShowConnectModal(false)}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors mt-2"
                >
                  Orqaga qaytish
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
