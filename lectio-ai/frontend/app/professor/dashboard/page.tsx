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

export default function ProfessorDashboardPage() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const roomCode = "LECTIO-2026";
  const sessionId = "session_123";
  const { toasts, addToast, removeToast } = useToast();
  const { language } = useLanguage();

  const handleQuickAction = (action: string) => {
    const actions: Record<string, { title: string; description: string }> = {
      polling: { title: "Polling boshlash", description: "Real vaqtda so'rovnoma tez orada mavjud bo'ladi" },
      wow: { title: "WOW Fakt", description: "Talabalar ekraniga qiziqarli fakt yuborilmoqda..." },
      break: { title: "Tanaffus", description: "Talabalar 5 daqiqa tanaffus olishadi" },
    };
    const a = actions[action];
    if (a) addToast({ title: a.title, description: a.description, type: "info" });
  };

  return (
    <div className="min-h-full bg-transparent text-white p-6 md:p-8 flex flex-col relative z-10">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <header className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-wide">
            {language === 'uz' ? 'PROFESSOR PANELI' : 'ПАНЕЛЬ ПРОФЕССОРА'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {language === 'uz' ? 'Bugungi dars va talabalar holati' : 'Сегодняшний урок и состояние студентов'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={isSessionActive ? "ghost" : "primary"}
            onClick={() => {
              if (isSessionActive) {
                if (window.confirm(language === 'uz' ? "Rostdan ham darsni yakunlamoqchimisiz?" : "Вы действительно хотите завершить урок?")) setIsSessionActive(false);
              } else {
                setIsSessionActive(true);
              }
            }}
            className={isSessionActive ? "text-red-400 border border-red-500/30 hover:bg-red-500/10" : "bg-[#1B4FD8] text-white"}
          >
            {isSessionActive 
              ? (language === 'uz' ? "Darsni Yakunlash" : "Завершить урок") 
              : (language === 'uz' ? "Dars Boshlash" : "Начать урок")}
          </Button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-8 flex-1">

        {/* LEFT PANEL */}
        <div className="w-full lg:w-[400px] shrink-0 space-y-6">
          <h2 className="text-xl font-bold font-display text-gray-200">Kamera kuzatuvi</h2>
          <CameraBlock sessionId={isSessionActive ? sessionId : null} />

          {isSessionActive && (
            <div className="p-4 bg-gray-900 rounded-xl border border-white/10 mt-4">
              <h3 className="text-sm font-bold text-gray-300 mb-2">Tezkor amallar</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="ghost" className="bg-white/5 hover:bg-white/10 text-xs" onClick={() => handleQuickAction("polling")}>Polling boshlash</Button>
                <Button size="sm" variant="ghost" className="bg-white/5 hover:bg-white/10 text-xs text-[#F5A623]" onClick={() => handleQuickAction("wow")}>WOW Fakt</Button>
                <Button size="sm" variant="ghost" className="bg-white/5 hover:bg-white/10 text-xs" onClick={() => handleQuickAction("break")}>Tanaffus</Button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 bg-gray-900/50 rounded-3xl border border-white/5 p-6 md:p-8">
          {isSessionActive ? (
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold font-display flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  Jonli Dars
                </h2>
                <div className="flex items-center gap-4">
                  <PhonePermissionToggle />
                  <div className="text-sm text-gray-400">Kod: <span className="font-mono text-white bg-white/10 px-2 py-1 rounded">{roomCode}</span></div>
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
                    onClick={() => addToast({ title: s.name, description: `Diqqat: ${s.attention}% — ${s.attention >= 70 ? "Yaxshi" : s.attention >= 40 ? "O'rta" : "Past"}`, type: s.attention >= 70 ? "success" : s.attention >= 40 ? "warning" : "error" })}
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
                <h4 className="font-bold text-indigo-300 mb-1 flex items-center gap-2">✨ AI Tavsiya</h4>
                <p className="text-sm text-indigo-100/80">O'quvchilarning 30% chalg'imoqda. Kichik "Quiz" o'tkazish yoki mavzuni hayotiy misol bilan tushuntirish tavsiya etiladi.</p>
              </div>

              <SessionQRWidget roomCode={roomCode} role="professor" />
            </div>
          ) : (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold font-display">Dars Tayyorlash</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card variant="default" className="bg-black/40 border-white/5 hover:border-white/20 transition cursor-pointer group" onClick={() => router.push("/professor/create-lesson")}>
                  <div className="p-4 flex flex-col items-center text-center gap-4 py-8">
                    <div className="w-14 h-14 rounded-2xl bg-[#1B4FD8]/20 flex items-center justify-center text-[#1B4FD8] group-hover:scale-110 transition">
                      <Plus size={28} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Yangi Dars Yaratish</h3>
                      <p className="text-sm text-gray-500 mt-1">AI yordamida slaydlar, testlar va materiallar generatsiyasi</p>
                    </div>
                    <div className="flex items-center gap-1 text-[#1B4FD8] text-sm font-bold">
                      Boshlash <ArrowRight size={14} />
                    </div>
                  </div>
                </Card>

                <Card variant="default" className="bg-black/40 border-white/5 hover:border-white/20 transition cursor-pointer group" onClick={() => router.push("/professor/materials")}>
                  <div className="p-4 flex flex-col items-center text-center gap-4 py-8">
                    <div className="w-14 h-14 rounded-2xl bg-[#0D9373]/20 flex items-center justify-center text-[#0D9373] group-hover:scale-110 transition">
                      <FileText size={28} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Materiallar</h3>
                      <p className="text-sm text-gray-500 mt-1">Yuklangan metodichkalar va PDF hujjatlar bazasi</p>
                    </div>
                    <div className="flex items-center gap-1 text-[#0D9373] text-sm font-bold">
                      Ko'rish <ArrowRight size={14} />
                    </div>
                  </div>
                </Card>

                <Card variant="default" className="bg-black/40 border-white/5 hover:border-white/20 transition cursor-pointer group" onClick={() => router.push("/professor/analytics")}>
                  <div className="p-4 flex flex-col items-center text-center gap-4 py-8">
                    <div className="w-14 h-14 rounded-2xl bg-[#F5A623]/20 flex items-center justify-center text-[#F5A623] group-hover:scale-110 transition">
                      <BarChart2 size={28} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Statistika</h3>
                      <p className="text-sm text-gray-500 mt-1">O'tgan darslar analitikasi va talabalar faolligi</p>
                    </div>
                    <div className="flex items-center gap-1 text-[#F5A623] text-sm font-bold">
                      Analitika <ArrowRight size={14} />
                    </div>
                  </div>
                </Card>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-4 border-b border-white/10 pb-2">So'nggi tayyorlangan darslar</h3>
                <div className="space-y-3">
                  {[
                    { title: "Kvant fizikasi asoslari", date: "Bugun, 10:00", duration: "1.5 soat", id: "lesson-1" },
                    { title: "Ma'lumotlar tuzilmasi: Daraxtlar", date: "Kecha, 14:30", duration: "1 soat", id: "lesson-2" },
                  ].map((lesson, i) => (
                    <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-black/20 border border-white/5 hover:bg-black/40 transition">
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
                        Boshlash
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
