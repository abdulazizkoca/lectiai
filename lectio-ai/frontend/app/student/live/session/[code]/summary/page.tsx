"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle, BookOpen, Trophy, RotateCcw, Download,
  ChevronRight, Star, Brain, FileText, ArrowLeft
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

const SUMMARY_TOPICS = [
  {
    title: "Kvant mexanikasi kirishi",
    keyPoints: ["Kvant - eng kichik energiya birligi", "Max Planck 1900-yilda kashf etdi", "Mikroolam klassik fizikadan farq qiladi"],
  },
  {
    title: "Heyzenberg noaniqlik prinsipi",
    keyPoints: ["Holat va tezlikni bir vaqtda o'lchab bo'lmaydi", "Δx · Δp ≥ ℏ/2", "Bu asbob xatosi emas — tabiatning qonuni"],
  },
  {
    title: "To'lqin-zarra ikkiligi",
    keyPoints: ["Yorug'lik ikki tabiatga ega", "De Broglie to'lqin uzunligi: λ = h/p", "Ikki tirqishli tajriba buni isbotlaydi"],
  },
  {
    title: "Shrödinger tenglamasi",
    keyPoints: ["Kvant holatini ifodalaydi", "Ehtimollik amplitudasini hisoblaydi", "Kvant kompyuterlar asosi"],
  },
];

const QUIZ_QUESTIONS = [
  {
    q: "Heyzenberg noaniqlik printsipi nima?",
    options: ["Zarracha tezligini aniq o'lchab bo'lmaydi", "Holat va tezlikni bir vaqtda aniq o'lchab bo'lmaydi", "Kvant kompyuterlar ishlash printsipi", "Yorug'likning to'lqin xususiyati"],
    correct: 1,
  },
  {
    q: "De Broglie formulasi qaysi?",
    options: ["E = mc²", "F = ma", "λ = h/p", "iℏ ∂ψ/∂t = Ĥψ"],
    correct: 2,
  },
  {
    q: "Kvant mexanikasini kim, qachon yaratdi?",
    options: ["Einstein, 1905", "Planck, 1900", "Newton, 1687", "Bohr, 1920"],
    correct: 1,
  },
];

export default function LessonSummaryPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { success, info } = useToast();

  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const handleAnswer = (idx: number) => {
    if (showAnswer) return;
    setSelected(idx);
    setShowAnswer(true);
    if (idx === QUIZ_QUESTIONS[currentQ].correct) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentQ < QUIZ_QUESTIONS.length - 1) {
      setCurrentQ(q => q + 1);
      setSelected(null);
      setShowAnswer(false);
    } else {
      setQuizFinished(true);
    }
  };

  const handleDownload = () => {
    info("Yuklanmoqda", "Xulosa PDF sifatida yuklanmoqda...");
  };

  const pct = Math.round((score / QUIZ_QUESTIONS.length) * 100);

  return (
    <div className="min-h-screen text-white" style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)", backgroundAttachment: "fixed" }}>

      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-white/10" style={{ background: "rgba(10,10,20,0.85)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4 pl-[80px]">
          <div>
            <h1 className="text-lg font-bold">Dars xulosasi</h1>
            <p className="text-xs text-slate-400">Xona kodi: <span className="font-mono text-yellow-400">{String(code).toUpperCase()}</span></p>
          </div>
          <button
            onClick={handleDownload}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border border-white/10 hover:bg-white/10"
          >
            <Download size={16} /> PDF Yuklash
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-10 rounded-3xl border border-white/10"
          style={{ background: "linear-gradient(135deg,rgba(245,166,35,0.1),rgba(27,79,216,0.1))" }}
        >
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(245,166,35,0.2)" }}>
            <CheckCircle size={40} style={{ color: "#F5A623" }} />
          </div>
          <h2 className="text-3xl font-bold mb-2">Dars muvaffaqiyatli yakunlandi!</h2>
          <p className="text-slate-400 mb-6">Kvant mexanikasi · Bugun · 47 o'quvchi qatnashdi</p>
          <div className="flex items-center justify-center gap-8">
            {[
              { label: "Slaydlar", value: "5 ta" },
              { label: "Davomiyligi", value: "52 daqiqa" },
              { label: "Savollar", value: "2 ta" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{s.value}</div>
                <div className="text-xs text-slate-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* AI Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Brain size={20} style={{ color: "#1B4FD8" }} />
            AI tomonidan tayyorlangan xulosa
          </h3>
          <div className="space-y-4">
            {SUMMARY_TOPICS.map((topic, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="rounded-2xl p-5 border border-white/10"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(245,166,35,0.2)", color: "#F5A623" }}>
                    {i + 1}
                  </span>
                  {topic.title}
                </h4>
                <ul className="space-y-1.5">
                  {topic.keyPoints.map((pt, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-300">
                      <ChevronRight size={14} className="mt-0.5 flex-shrink-0 text-yellow-400" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Mini Quiz */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Trophy size={20} style={{ color: "#0D9373" }} />
            Bilimingizni tekshiring
          </h3>

          {!quizStarted ? (
            <div className="rounded-2xl p-8 text-center border border-white/10" style={{ background: "rgba(13,147,115,0.08)" }}>
              <Trophy size={48} className="mx-auto mb-4 text-green-400" />
              <h4 className="text-xl font-bold mb-2">Mini Test</h4>
              <p className="text-slate-400 mb-6">{QUIZ_QUESTIONS.length} ta savol · Bugungi dars bo'yicha</p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setQuizStarted(true)}
                className="px-8 py-3 rounded-xl font-bold text-black"
                style={{ background: "linear-gradient(135deg,#F5A623,#e8941a)" }}
              >
                Testni boshlash
              </motion.button>
            </div>
          ) : quizFinished ? (
            <div className="rounded-2xl p-8 text-center border border-white/10" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: pct >= 70 ? "rgba(13,147,115,0.2)" : "rgba(232,72,85,0.2)" }}>
                <Star size={36} style={{ color: pct >= 70 ? "#0D9373" : "#E84855" }} />
              </div>
              <h4 className="text-2xl font-bold mb-2">{pct >= 70 ? "Zo'r natija!" : "Yana urinib ko'ring"}</h4>
              <p className="text-4xl font-bold mb-2" style={{ color: pct >= 70 ? "#0D9373" : "#F5A623" }}>{pct}%</p>
              <p className="text-slate-400 mb-6">{score} / {QUIZ_QUESTIONS.length} to'g'ri javob</p>
              <div className="flex justify-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setQuizStarted(false); setQuizFinished(false); setCurrentQ(0); setScore(0); setSelected(null); setShowAnswer(false); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border border-white/10 hover:bg-white/10 transition-all"
                >
                  <RotateCcw size={16} /> Qaytadan
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push("/student/independent/learn?subject=physics&mode=tutor")}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-black"
                  style={{ background: "linear-gradient(135deg,#F5A623,#e8941a)" }}
                >
                  <BookOpen size={16} /> Chuqurroq o'rganish
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-6 border border-white/10" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm text-slate-400">Savol {currentQ + 1} / {QUIZ_QUESTIONS.length}</span>
                <span className="text-sm font-bold" style={{ color: "#0D9373" }}>Ball: {score}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 mb-6">
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${((currentQ) / QUIZ_QUESTIONS.length) * 100}%`, background: "linear-gradient(90deg,#0D9373,#1B4FD8)" }} />
              </div>

              <h4 className="text-lg font-bold mb-4">{QUIZ_QUESTIONS[currentQ].q}</h4>
              <div className="space-y-3 mb-6">
                {QUIZ_QUESTIONS[currentQ].options.map((opt, idx) => {
                  let cls = "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10";
                  if (showAnswer) {
                    if (idx === QUIZ_QUESTIONS[currentQ].correct) cls = "border-green-400/50 text-white bg-green-400/15";
                    else if (idx === selected) cls = "border-red-400/50 text-white bg-red-400/15";
                    else cls = "bg-white/3 border-white/5 text-slate-500";
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={showAnswer}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm font-medium ${cls}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {showAnswer && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handleNext}
                  className="w-full py-3 rounded-xl font-bold text-black"
                  style={{ background: "linear-gradient(135deg,#F5A623,#e8941a)" }}
                >
                  {currentQ < QUIZ_QUESTIONS.length - 1 ? "Keyingi savol →" : "Natijani ko'rish →"}
                </motion.button>
              )}
            </div>
          )}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="rounded-2xl p-6 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div>
              <h4 className="font-bold mb-1">Mustaqil davom etmoqchimisiz?</h4>
              <p className="text-slate-400 text-sm">AI usto bilan kvant mexanikasini chuqurroq o'rganing</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/student/independent/learn?topic=Kvant%20mexanikasi&mode=tutor")}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-black flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#F5A623,#e8941a)" }}
            >
              <Brain size={18} /> AI Usto bilan davom eting
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
