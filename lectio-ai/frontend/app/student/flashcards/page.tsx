"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Card {
  id: number;
  front: string;
  back: string;
  hint?: string;
  subject?: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
}

export default function FlashcardsPage() {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [error, setError] = useState("");

  const getStudentId = () => {
    try { return JSON.parse(localStorage.getItem("lectio_user") || "{}").id || null; } catch { return null; }
  };

  useEffect(() => {
    const studentId = getStudentId();
    if (!studentId) { setError("Kirish talab qilinadi"); setLoading(false); return; }

    fetch(`${API_URL}/api/chain/due-flashcards/${studentId}?limit=20`)
      .then((r) => r.json())
      .then((data) => {
        setCards(data.cards || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Flashcardlarni yuklashda xatolik");
        setLoading(false);
      });
  }, []);

  const handleRate = async (quality: number) => {
    const card = cards[index];
    const studentId = getStudentId();

    // Submit via spaced repetition API
    if (studentId) {
      fetch(`${API_URL}/api/sr/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_id: card.id, quality }),
      }).catch(() => {});
    }

    setReviewed((r) => r + 1);
    if (index + 1 >= cards.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setFlipped(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#F5A623]" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-white flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => router.push("/student/dashboard")} className="px-6 py-3 bg-[#F5A623] text-black rounded-xl font-bold">
            Orqaga
          </button>
        </div>
      </div>
    );
  }

  if (done || cards.length === 0) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-white flex items-center justify-center p-6 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2">{cards.length === 0 ? "Bugun takrorlanadigan karta yo'q!" : "Barakalla!"}</h2>
          <p className="text-slate-400 mb-2">{cards.length === 0 ? "Barcha kartalaringiz kelajakda takrorlanadi." : `${reviewed} ta karta ko'rib chiqildi.`}</p>
          {cards.length > 0 && (
            <div className="flex items-center justify-center gap-2 mb-6">
              <Clock size={14} className="text-[#F5A623]" />
              <span className="text-sm text-slate-400">Keyingi takrorlash — ertaga yoki so&apos;ngra</span>
            </div>
          )}
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <button onClick={() => router.push("/student/independent")}
              className="py-3 rounded-xl bg-[#F5A623] text-black font-bold hover:bg-[#f7b955] transition">
              Yangi mavzu o&apos;rganish
            </button>
            <button onClick={() => router.push("/student/dashboard")}
              className="py-3 rounded-xl bg-white/5 border border-white/10 font-bold hover:bg-white/10 transition">
              Dashboard ga qaytish
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const card = cards[index];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
        <button onClick={() => router.push("/student/dashboard")} className="p-2 rounded-xl hover:bg-white/5 transition">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-sm">Bugungi Takrorlash</h1>
          <p className="text-xs text-slate-400">{index + 1} / {cards.length} karta</p>
        </div>
        <div className="text-xs text-slate-500">{reviewed} ta baholangan</div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-lg mx-auto w-full">
        {/* Progress */}
        <div className="w-full h-1.5 rounded-full bg-white/10 mb-8 overflow-hidden">
          <div className="h-full rounded-full bg-[#F5A623] transition-all" style={{ width: `${((index) / cards.length) * 100}%` }} />
        </div>

        {card.subject && <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-bold">{card.subject}</p>}

        {/* Card */}
        <motion.div
          key={index}
          onClick={() => setFlipped((f) => !f)}
          whileTap={{ scale: 0.98 }}
          className="w-full min-h-56 rounded-2xl border border-white/10 bg-white/5 p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-white/20 transition select-none mb-6"
        >
          <AnimatePresence mode="wait">
            {!flipped ? (
              <motion.div key="front" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
                <p className="text-xs text-[#F5A623] uppercase tracking-widest mb-3 font-bold">SAVOL</p>
                <p className="text-xl font-bold leading-relaxed">{card.front}</p>
                {card.hint && <p className="text-sm text-slate-500 mt-4">💡 {card.hint}</p>}
                <p className="text-xs text-slate-600 mt-6">Javobni ko&apos;rish uchun bosing</p>
              </motion.div>
            ) : (
              <motion.div key="back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
                <p className="text-xs text-[#0D9373] uppercase tracking-widest mb-3 font-bold">JAVOB</p>
                <p className="text-lg leading-relaxed text-slate-200">{card.back}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Rating buttons — only show after flip */}
        <AnimatePresence>
          {flipped && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full">
              <p className="text-center text-sm text-slate-400 mb-3">Qanchalik yaxshi bildingiz?</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { q: 1, label: "Bilmadim", icon: <XCircle size={16} />, color: "#E84855", bg: "rgba(232,72,85,0.1)" },
                  { q: 3, label: "Qiyin", icon: "😅", color: "#F5A623", bg: "rgba(245,166,35,0.1)" },
                  { q: 5, label: "Oson!", icon: <CheckCircle2 size={16} />, color: "#0D9373", bg: "rgba(13,147,115,0.1)" },
                ].map(({ q, label, icon, color, bg }) => (
                  <button
                    key={q}
                    onClick={() => handleRate(q)}
                    className="flex flex-col items-center gap-1 py-3 rounded-xl border border-white/10 font-bold text-sm transition hover:scale-105"
                    style={{ background: bg, color }}
                  >
                    {typeof icon === "string" ? <span className="text-lg">{icon}</span> : icon}
                    {label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
