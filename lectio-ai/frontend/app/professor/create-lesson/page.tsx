"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { lessonsAPI } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";
import { Sparkles, Play, ArrowLeft, BookOpen, Clock, Hash } from "lucide-react";

export default function CreateLesson() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState(45);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Record<string, any> | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  const handleCreate = async () => {
    if (!title.trim()) { setError("Dars nomini kiriting"); return; }
    if (title.trim().length < 3) { setError("Dars nomi kamida 3 ta belgidan iborat bo'lishi kerak"); return; }
    if (!topic.trim()) { setError("Mavzuni kiriting"); return; }
    if (topic.trim().length < 3) { setError("Mavzu kamida 3 ta belgidan iborat bo'lishi kerak"); return; }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("lectio_token");
      const data = await lessonsAPI.create(
        { title: title.trim(), topic: topic.trim(), duration_minutes: duration, professor_id: 1 },
        token || ""
      );
      setResult(data.presentation_data || data);
      addToast({ title: "Dars yaratildi!", description: "AI muvaffaqiyatli dars tayyorladi", type: "success" });
    } catch {
      // Fallback to mock data if API fails
      setResult({
        wow_fact: "Al-Xorazmiy algebra fanining asoschisi — 'algoritm' so'zi uning nomidan kelib chiqqan!",
        slides: [
          { slide_number: 1, title: "Kirish va maqsad", content: `Bugungi mavzu: ${topic}. Asosiy tushunchalarni o'rganamiz.` },
          { slide_number: 2, title: "Nazariy asoslar", content: `${topic} bo'yicha asosiy nazariy bilimlar va tarixiy rivojlanish.` },
          { slide_number: 3, title: "Amaliy misol", content: `${topic}ni kundalik hayotda qo'llash. Misol va vazifalar.` },
          { slide_number: 4, title: "Mustahkamlash", content: "Savol va javoblar. Test savollari va xulosa." },
        ],
        summary: `Bugungi darsda ${topic} mavzusini o'rgandik. Asosiy tushunchalar, amaliy misollar va mustahkamlash mashqlari bilan tanishdik.`,
      });
      addToast({ title: "Demo rejimida yaratildi", description: "Backend ulangan emas — namuna ma'lumotlar ko'rsatilmoqda", type: "warning" });
    } finally {
      setLoading(false);
    }
  };

  const slides = result?.slides as { slide_number: number; title: string; content: string }[] | undefined;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="flex items-center gap-4 mb-8 pl-[80px]">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles size={24} className="text-[#F5A623]" />
            AI bilan Dars Yaratish
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Mavzuni kiriting — AI hamma narsani yaratadi</p>
        </div>
      </div>

      {!result ? (
        <div className="space-y-6">
          <Card className="p-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-4">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <BookOpen size={16} className="text-[#F5A623]" /> Dars nomi
                </label>
                <input
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setError(""); }}
                  placeholder="Masalan: Algoritmlar va ma'lumotlar tuzilmasi"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent transition"
                  id="lesson-title-input"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <Hash size={16} className="text-[#1B4FD8]" /> Mavzu
                </label>
                <input
                  value={topic}
                  onChange={(e) => { setTopic(e.target.value); setError(""); }}
                  placeholder="Masalan: Binary Search algoritmining ishlash prinsipi"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent transition"
                  id="lesson-topic-input"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <Clock size={16} className="text-[#0D9373]" /> Davomiylik: <span className="text-[#F5A623] font-bold">{duration} daqiqa</span>
                </label>
                <input
                  type="range"
                  min={15}
                  max={90}
                  step={5}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full accent-[#F5A623]"
                  disabled={loading}
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>15 daq</span>
                  <span>90 daq</span>
                </div>
              </div>

              <Button
                variant="primary"
                className="w-full py-4 text-lg"
                onClick={handleCreate}
                isLoading={loading}
                disabled={loading || !title.trim() || !topic.trim()}
                leftIcon={loading ? undefined : <Sparkles size={20} />}
                id="generate-lesson-btn"
              >
                {loading ? "AI yaratmoqda..." : "AI bilan Yaratish"}
              </Button>
            </div>
          </Card>

          {/* Tips */}
          <Card className="p-4 border-l-4 border-[#1B4FD8]">
            <p className="text-sm font-bold text-[#1B4FD8] mb-1">💡 Maslahat</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Mavzuni qanchalik aniq yozsangiz, AI shunchalik yaxshi natija beradi. Masalan: "Binary Search" o'rniga "Binary Search algoritmining O(log n) murakkabligi" yozing.</p>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              ✅ Dars Yaratildi!
            </h2>
            <Button variant="secondary" onClick={() => setResult(null)} leftIcon={<Sparkles size={16} />}>
              Yana yaratish
            </Button>
          </div>

          {/* WOW Fact */}
          <Card className="p-5 border-l-4 border-amber-500/50 bg-amber-500/5">
            <div className="text-amber-400 font-semibold mb-1 flex items-center gap-2">🤯 WOW Fakt</div>
            <p className="text-slate-700 dark:text-slate-300">{String(result.wow_fact || "")}</p>
          </Card>

          {/* Summary */}
          {result.summary && (
            <Card className="p-5 border-l-4 border-[#0D9373]/50 bg-[#0D9373]/5">
              <div className="text-[#0D9373] font-semibold mb-1">📋 Xulosa</div>
              <p className="text-slate-700 dark:text-slate-300 text-sm">{String(result.summary || "")}</p>
            </Card>
          )}

          {/* Slides */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <BookOpen size={18} className="text-[#F5A623]" />
              Slaydlar ({slides?.length || 0} ta)
            </h3>
            <div className="space-y-3">
              {slides?.map((s, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xs bg-[#F5A623]/20 text-[#F5A623] px-2 py-1 rounded-full font-bold shrink-0">
                      #{s.slide_number}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{s.title}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{s.content}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="primary"
              className="flex-1"
              leftIcon={<Play size={16} />}
              onClick={() => router.push("/professor/live")}
            >
              Jonli Dars Boshlash
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => router.push("/professor/lessons")}
            >
              Darslarim
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
