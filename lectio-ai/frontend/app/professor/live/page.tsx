"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ProfessorPoll } from "@/components/polling/LivePoll";
import AttentionGauge from "@/components/analytics/AttentionGauge";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";

export default function LiveSession() {
  const router = useRouter();
  const [lessonId] = useState("lesson_demo");
  const [attention] = useState({ attention: 0.72, confusion: false, boredom: false, students: 45, recommendation: null as string | null });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    intervalRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const handleEndLesson = () => {
    addToast({ title: "Dars yakunlandi", description: "Analitika va natijalar tayyorlanmoqda...", type: "info" });
    setTimeout(() => router.push("/professor/analytics"), 1500);
  };

  return (
    <div className="relative min-h-screen">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="orb orb-1" />
      <nav className="relative z-10 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/professor/dashboard" className="flex items-center gap-2">
              <span className="text-2xl">🎓</span>
              <span className="font-bold gradient-text">Lectio AI</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-sm text-slate-400">Jonli Dars</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <span className="live-dot" />
            JONLI • {formatTime(elapsedSeconds)}
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content — 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 slide-up">
              <h2 className="text-xl font-bold mb-4">📖 Dars: Algoritmlar va Ma&apos;lumotlar Tuzilmasi</h2>
              <div className="bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 rounded-xl p-8 text-center min-h-[300px] flex flex-col items-center justify-center">
                <div className="text-5xl mb-4">🎬</div>
                <p className="text-slate-400">Prezentatsiya shu yerda ko&apos;rsatiladi</p>
                <p className="text-xs text-slate-500 mt-2">SlideViewer komponenti bilan ishlaydi</p>
              </div>
            </div>
            <ProfessorPoll lessonId={lessonId} />
          </div>

          {/* Sidebar — 1 col */}
          <div className="space-y-6">
            <AttentionGauge
              attention={attention.attention}
              confusion={attention.confusion}
              boredom={attention.boredom}
              students={attention.students}
              recommendation={attention.recommendation}
            />
            <div className="glass-card p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Xona ma&apos;lumotlari</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Xona ID</span><span className="font-mono text-xs bg-white/5 px-2 py-1 rounded">{lessonId}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Talabalar</span><span>45 ta ulangan</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Vaqt</span><span className="font-mono">{formatTime(elapsedSeconds)}</span></div>
              </div>
            </div>
            <div className="glass-card p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Tezkor harakatlar</h3>
              <button
                onClick={() => addToast({ title: "🤯 WOW Fakt", description: "Al-Xorazmiy algebra fanining asoschisi — 'algoritm' so'zi uning nomidan!", type: "info" })}
                className="btn-secondary w-full text-sm"
              >
                🤯 WOW Fakt ko&apos;rsatish
              </button>
              <button
                onClick={() => { addToast({ title: "🎯 Quiz savoli", description: "Barcha talabalar ekraniga savol yuborildi!", type: "success" }); }}
                className="btn-secondary w-full text-sm"
              >
                🎯 Test savoli berish
              </button>
              <button
                onClick={handleEndLesson}
                className="w-full p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 transition"
              >
                ⏹ Darsni tugatish
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
